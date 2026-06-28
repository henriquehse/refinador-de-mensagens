import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Check, ExternalLink, Loader2, KeyRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getProfile, saveProfile } from "@/lib/transformer.functions";

const FREE_MODELS = [
  { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B (recomendado)" },
  { id: "deepseek/deepseek-chat-v3.1:free", label: "DeepSeek Chat v3.1" },
  { id: "google/gemini-2.0-flash-exp:free", label: "Gemini 2.0 Flash" },
  { id: "qwen/qwen-2.5-72b-instruct:free", label: "Qwen 2.5 72B" },
  { id: "meta-llama/llama-3.2-3b-instruct:free", label: "Llama 3.2 3B (rápido)" },
];

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações · Refinador" }] }),
  component: ConfigPage,
});

function ConfigPage() {
  const queryClient = useQueryClient();
  const getProfileFn = useServerFn(getProfile);
  const saveProfileFn = useServerFn(saveProfile);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfileFn(),
  });

  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState<string>("");

  useEffect(() => {
    if (profile?.model) setModel(profile.model);
  }, [profile?.model]);

  const mutation = useMutation({
    mutationFn: (payload: { openrouter_api_key?: string; openrouter_model?: string }) =>
      saveProfileFn({ data: payload }),
    onSuccess: () => {
      toast.success("Salvo com sucesso");
      setApiKey("");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Falha ao salvar"),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Configurações</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sua chave fica salva de forma segura e é usada apenas para refinar suas mensagens.
          </p>
        </div>

        {/* How to get the key */}
        <section className="rounded-2xl border border-border/60 bg-card/60 p-5">
          <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <KeyRound className="h-3.5 w-3.5" /> Como obter sua chave gratuita
          </h2>
          <ol className="mt-3 space-y-2 text-sm">
            <li>
              <span className="mr-2 font-mono text-primary">01</span>
              Crie uma conta gratuita em{" "}
              <a
                href="https://openrouter.ai/sign-up"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
              >
                openrouter.ai/sign-up <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>
              <span className="mr-2 font-mono text-primary">02</span>
              Vá até{" "}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
              >
                openrouter.ai/keys <ExternalLink className="h-3 w-3" />
              </a>{" "}
              e clique em <span className="font-mono">Create Key</span>
            </li>
            <li>
              <span className="mr-2 font-mono text-primary">03</span>
              Copie a chave (começa com <span className="font-mono text-foreground">sk-or-...</span>) e cole abaixo
            </li>
            <li>
              <span className="mr-2 font-mono text-primary">04</span>
              Pronto. Os modelos com <span className="font-mono">:free</span> não cobram créditos.
            </li>
          </ol>
        </section>

        {/* API key */}
        <section className="space-y-3 rounded-2xl border border-border/60 bg-card/60 p-5">
          <div className="flex items-center justify-between">
            <Label htmlFor="apiKey" className="text-sm font-medium">
              Chave OpenRouter
            </Label>
            {profile?.hasKey && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[11px] text-primary">
                <Check className="h-3 w-3" /> {profile.keyPreview}
              </span>
            )}
          </div>
          <Input
            id="apiKey"
            type="password"
            placeholder="sk-or-v1-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="bg-surface font-mono text-sm"
          />
          <Button
            onClick={() => mutation.mutate({ openrouter_api_key: apiKey.trim() })}
            disabled={mutation.isPending || apiKey.trim().length < 10}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {profile?.hasKey ? "Substituir chave" : "Salvar chave"}
          </Button>
        </section>

        {/* Model */}
        <section className="space-y-3 rounded-2xl border border-border/60 bg-card/60 p-5">
          <Label htmlFor="model" className="text-sm font-medium">
            Modelo padrão
          </Label>
          <p className="text-xs text-muted-foreground">
            Modelos marcados como <span className="font-mono">:free</span> não consomem créditos.
          </p>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger id="model" className="bg-surface font-mono text-xs">
              <SelectValue placeholder="Selecione um modelo" />
            </SelectTrigger>
            <SelectContent>
              {FREE_MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id} className="font-mono text-xs">
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="secondary"
            onClick={() => mutation.mutate({ openrouter_model: model })}
            disabled={mutation.isPending || !model || model === profile?.model}
          >
            Salvar modelo
          </Button>
        </section>
      </div>
    </AppShell>
  );
}
