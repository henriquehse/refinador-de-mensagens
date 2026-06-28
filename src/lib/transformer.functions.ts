import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PresetEnum = z.enum([
  "improve",
  "shorten",
  "formal_low",
  "formal_med",
  "formal_high",
  "casual_low",
  "casual_med",
  "casual_high",
  "custom",
]);

const presetInstructions: Record<z.infer<typeof PresetEnum>, string> = {
  improve:
    "Aprimore a mensagem mantendo o sentido original. Corrija ortografia, pontuação e gramática. Melhore a clareza, fluidez e profissionalismo, sem mudar o tom geral nem o tamanho de forma significativa.",
  shorten:
    "Reduza a mensagem ao máximo possível SEM mudar o teor, a intenção ou omitir informações relevantes. Seja conciso e direto.",
  formal_low:
    "Aplique um tom levemente mais formal. Corrija a gramática e refine vocabulário, mas mantenha leveza e proximidade.",
  formal_med:
    "Reescreva em tom claramente formal e profissional, adequado para comunicação corporativa cotidiana.",
  formal_high:
    "Reescreva em tom altamente formal, cerimonioso e protocolar, adequado para comunicação institucional ou jurídica.",
  casual_low:
    "Deixe a mensagem ligeiramente mais coloquial e amigável, mantendo correção gramatical.",
  casual_med:
    "Reescreva em tom coloquial e descontraído, como uma conversa entre colegas.",
  casual_high:
    "Reescreva em tom bem informal e próximo, com expressões do dia a dia, como uma conversa entre amigos. Mantenha respeito básico.",
  custom: "",
};

const Input = z.object({
  text: z.string().trim().min(1, "Mensagem vazia").max(8000),
  preset: PresetEnum.default("improve"),
  customInstruction: z.string().trim().max(500).optional(),
});

export const transformText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("openrouter_api_key, openrouter_model")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) throw new Error("Não foi possível carregar seu perfil.");
    const apiKey = profile?.openrouter_api_key?.trim();
    if (!apiKey) {
      throw new Error(
        "Sua chave OpenRouter não está configurada. Vá em Configurações para adicioná-la.",
      );
    }
    const model = profile?.openrouter_model?.trim() || "meta-llama/llama-3.3-70b-instruct:free";

    const instruction =
      data.preset === "custom"
        ? data.customInstruction?.trim() ||
          "Aprimore a mensagem mantendo o sentido original."
        : presetInstructions[data.preset];

    const systemPrompt = `Você é um assistente especializado em refinar mensagens escritas em português brasileiro (mas mantenha o idioma original do texto recebido se for outro).
Sua única tarefa é reescrever a mensagem do usuário de acordo com a instrução fornecida.
REGRAS ESTRITAS:
- Devolva APENAS o texto reescrito, sem aspas, sem cabeçalhos, sem explicações, sem markdown.
- Nunca adicione assinaturas, saudações ou despedidas que não existiam no original.
- Preserve quebras de parágrafo significativas.
- Não invente fatos, datas, nomes ou números.
Instrução: ${instruction}`;

    // Tenta o modelo escolhido pelo usuário e, em caso de rate-limit/indisponibilidade
    // upstream (comum em modelos :free), faz fallback para outros gratuitos confiáveis.
    const FREE_FALLBACKS = [
      "google/gemma-4-31b-it:free",
      "qwen/qwen3-next-80b-a3b-instruct:free",
      "nvidia/nemotron-nano-9b-v2:free",
      "openai/gpt-oss-20b:free",
      "meta-llama/llama-3.3-70b-instruct:free",
    ];
    const candidates = [model, ...FREE_FALLBACKS.filter((m) => m !== model)];

    let result: string | undefined;
    let usedModel = model;
    let lastErr: { status: number; text: string } | null = null;

    for (const candidate of candidates) {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://lovable.dev",
          "X-Title": "Refinador de Mensagens",
        },
        body: JSON.stringify({
          model: candidate,
          temperature: 0.4,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: data.text },
          ],
        }),
      });

      if (res.status === 401) {
        throw new Error("Chave OpenRouter inválida. Verifique em Configurações.");
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        lastErr = { status: res.status, text: errText };
        // 429 / 5xx → tenta o próximo candidato
        if (res.status === 429 || res.status >= 500) continue;
        throw new Error(`OpenRouter respondeu ${res.status}: ${errText.slice(0, 200)}`);
      }

      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
        error?: { message?: string; code?: number };
      };
      // OpenRouter às vezes retorna 200 com { error: { code: 429 } }
      if (json.error) {
        lastErr = { status: json.error.code ?? 500, text: json.error.message ?? "" };
        continue;
      }
      const text = json.choices?.[0]?.message?.content?.trim();
      if (text) {
        result = text;
        usedModel = candidate;
        break;
      }
      lastErr = { status: 502, text: "Resposta vazia" };
    }

    if (!result) {
      if (lastErr?.status === 429)
        throw new Error(
          "Todos os modelos gratuitos estão sobrecarregados no momento. Aguarde alguns instantes ou troque o modelo em Configurações.",
        );
      throw new Error(
        `Não foi possível refinar agora${lastErr ? ` (${lastErr.status}: ${lastErr.text.slice(0, 160)})` : ""}.`,
      );
    }

    await supabase.from("transformations").insert({
      user_id: userId,
      original_text: data.text,
      result_text: result,
      preset: data.preset,
      custom_instruction: data.preset === "custom" ? data.customInstruction ?? null : null,
      model: usedModel,
    });

    return { result, model: usedModel };
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("display_name, openrouter_api_key, openrouter_model")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      display_name: data?.display_name ?? null,
      hasKey: Boolean(data?.openrouter_api_key),
      keyPreview: data?.openrouter_api_key
        ? `${data.openrouter_api_key.slice(0, 8)}…${data.openrouter_api_key.slice(-4)}`
        : null,
      model: data?.openrouter_model ?? "meta-llama/llama-3.3-70b-instruct:free",
    };
  });

const SaveProfileInput = z.object({
  openrouter_api_key: z.string().trim().min(10).max(200).optional(),
  openrouter_model: z.string().trim().min(3).max(120).optional(),
  display_name: z.string().trim().max(80).optional(),
});

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SaveProfileInput.parse(d))
  .handler(async ({ data, context }) => {
    const update: Record<string, string> = {};
    if (data.openrouter_api_key) update.openrouter_api_key = data.openrouter_api_key;
    if (data.openrouter_model) update.openrouter_model = data.openrouter_model;
    if (data.display_name !== undefined) update.display_name = data.display_name;

    const { error } = await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, ...update }, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listTransformations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("transformations")
      .select("id, original_text, result_text, preset, custom_instruction, model, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const DeleteInput = z.object({ id: z.string().uuid() });
export const deleteTransformation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => DeleteInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("transformations")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
