import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowRight, Copy, Check, Loader2, RotateCcw, Wand2, KeyRound, ClipboardPaste, Sparkles, Zap, ShieldCheck, ArrowRightLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  getProfile,
  transformText,
} from "@/lib/transformer.functions";

type Preset =
  | "improve"
  | "shorten"
  | "formal_low"
  | "formal_med"
  | "formal_high"
  | "casual_low"
  | "casual_med"
  | "casual_high";

const PRIMARY: { id: Preset; label: string; hint: string }[] = [
  { id: "improve", label: "Refinar Mensagem", hint: "Melhora geral mantendo o tom original" },
  { id: "shorten", label: "Reduzir Texto", hint: "Torna mais conciso e direto" },
];

const FORMAL: { id: Preset; label: string }[] = [
  { id: "formal_low", label: "Levemente Formal" },
  { id: "formal_med", label: "Corporativo Médio" },
  { id: "formal_high", label: "Protocolar / Alto" },
];

const CASUAL: { id: Preset; label: string }[] = [
  { id: "casual_low", label: "Levemente Amigável" },
  { id: "casual_med", label: "Descontraído" },
  { id: "casual_high", label: "Informal / Colega" },
];

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Refinador de Mensagens · IA para escrever com maestria" },
      {
        name: "description",
        content:
          "Cole sua mensagem, escolha o tom e receba uma versão refinada em segundos. Powered by OpenRouter.",
      },
    ],
  }),
  component: TransformerPage,
});

function TransformerPage() {
  const queryClient = useQueryClient();
  const getProfileFn = useServerFn(getProfile);
  const transformFn = useServerFn(transformText);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfileFn(),
  });

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [activePreset, setActivePreset] = useState<Preset>("improve");
  const [copied, setCopied] = useState(false);

  const mutation = useMutation({
    mutationFn: (preset: Preset) =>
      transformFn({ data: { text: input, preset } }),
    onSuccess: (data) => {
      setOutput(data.result);
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Falha ao refinar mensagem.");
    },
  });

  function run(preset: Preset) {
    if (!input.trim()) {
      toast.error("Por favor, cole ou digite uma mensagem primeiro.");
      return;
    }
    if (!profile?.hasKey) {
      toast.error("Configure sua chave OpenRouter em Configurações para usar a IA.");
      return;
    }
    setActivePreset(preset);
    mutation.mutate(preset);
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInput(text.slice(0, 8000));
        toast.success("Mensagem colada com sucesso!");
      } else {
        toast.error("Nenhum texto encontrado na sua área de transferência.");
      }
    } catch (err) {
      toast.error("Por favor, permita o acesso à área de transferência ou use Ctrl+V.");
    }
  }

  async function copyOutput() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success("Texto refinado copiado!");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <AppShell>
      <section className="ambient-glow relative space-y-10">
        
        {/* HERO SECTION IMPRESSIONANTE COM DEMO DE IMPACTO */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-white via-slate-50/50 to-emerald-50/30 p-6 sm:p-12 shadow-xl shadow-slate-200/50">
          <div className="grid gap-8 lg:grid-cols-12 items-center">
            
            {/* Chamada Principal */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-600/30 bg-emerald-50 px-3.5 py-1.5 shadow-xs">
                <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
                <span className="font-sans text-xs uppercase tracking-wider font-extrabold text-emerald-800">
                  Inteligência Artificial de Comunicação High-End
                </span>
              </div>

              <h1 className="text-display text-slate-900 font-extrabold tracking-tight leading-none">
                Escreva sem filtro. <br />
                <span className="font-display text-emerald-600 font-normal">Impacte</span> em qualquer canal.
              </h1>

              <p className="max-w-xl text-base sm:text-lg text-slate-600 font-sans leading-relaxed">
                Transforme rascunhos rápidos, áudios transcritos ou e-mails em mensagens impecáveis, prontas para impressionar no WhatsApp, Slack ou trabalho.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span>Resposta em instantes</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Privacidade Garantida</span>
                </div>
              </div>
            </div>

            {/* Showcase Interativo de Antes & Depois na Hero */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xl shadow-slate-300/60 space-y-3 font-sans">
                
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">Exemplo ao vivo</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    <ArrowRightLeft className="h-3 w-3" /> Tom Corporativo
                  </span>
                </div>

                {/* Antes */}
                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-xs text-slate-600 space-y-1">
                  <span className="font-mono text-[10px] font-bold uppercase text-slate-400 block">Original (Rascunho):</span>
                  <p className="italic">"vc pode me mandar o relatorio hj? preciso ver o negocio la da reuniao"</p>
                </div>

                {/* Depois */}
                <div className="rounded-xl bg-emerald-600 text-white p-3.5 shadow-md space-y-1">
                  <span className="font-mono text-[10px] font-bold uppercase text-emerald-200 block">Refinado por IA:</span>
                  <p className="font-semibold text-xs leading-relaxed">"Poderia, por gentileza, me encaminhar o relatório consolidado hoje? Preciso analisar os indicadores para nossa reunião."</p>
                </div>

              </div>
            </div>

          </div>
        </div>

        {!profile?.hasKey && (
          <div className="mx-auto max-w-4xl flex items-start gap-3.5 rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
            <KeyRound className="mt-0.5 h-5 w-5 text-amber-600 shrink-0" />
            <div className="flex-1 min-w-0 space-y-1">
              <p className="font-bold text-amber-900 text-sm">Configure sua chave gratuita do OpenRouter</p>
              <p className="text-xs text-amber-800 leading-relaxed">
                Em 2 minutos: crie uma conta gratuita em{" "}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline underline-offset-2 hover:text-amber-950"
                >
                  openrouter.ai/keys
                </a>
                , copie sua API Key e salve em{" "}
                <Link to="/configuracoes" className="font-bold text-emerald-700 underline underline-offset-2 hover:text-emerald-900">
                  Configurações
                </Link>
                .
              </p>
            </div>
          </div>
        )}

        {/* PAINEL DUAL DE ENTRADA E SAÍDA LUMINOSO */}
        <div className="grid gap-6 lg:grid-cols-2">
          
          {/* CARD 01 - MENSAGEM ORIGINAL */}
          <div className="card-soft rounded-3xl p-6 space-y-4 border-l-4 border-l-emerald-600">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <label className="flex items-center gap-2 font-sans text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                <Zap className="h-4 w-4" />
                <span>01 · Sua Mensagem</span>
              </label>
              
              {/* BOTÃO MÁGICO DE COLAR EM 1 CLIQUE */}
              <button
                type="button"
                onClick={handlePaste}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600/30 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 transition-all hover:bg-emerald-100 shadow-xs hover:scale-[1.02]"
                title="Colar texto da área de transferência com 1 clique"
              >
                <ClipboardPaste className="h-3.5 w-3.5 text-emerald-600" />
                <span>Colar Texto</span>
              </button>
            </div>

            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 8000))}
              placeholder="Clique em 'Colar Texto' acima ou digite aqui o rascunho da sua mensagem..."
              className="min-h-[220px] sm:min-h-[300px] resize-none border-0 bg-transparent px-0 text-base leading-relaxed text-slate-900 placeholder:text-slate-400 shadow-none focus-visible:ring-0 font-sans"
            />

            <div className="flex justify-end border-t border-slate-100 pt-2">
              <span className="font-mono text-[11px] font-semibold text-slate-400">{input.length}/8000 caracteres</span>
            </div>
          </div>

          {/* CARD 02 - MENSAGEM REFINADA */}
          <div className="card-soft rounded-3xl p-6 space-y-4 border-l-4 border-l-indigo-600 bg-gradient-to-br from-white to-slate-50/50">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <label className="flex items-center gap-2 font-sans text-xs font-extrabold uppercase tracking-wider text-indigo-700">
                <Sparkles className="h-4 w-4" />
                <span>02 · Versão Refinada</span>
              </label>

              {output && (
                <button
                  type="button"
                  onClick={copyOutput}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700 transition-all hover:bg-indigo-100 shadow-xs hover:scale-[1.02]"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copiado!" : "Copiar Texto"}</span>
                </button>
              )}
            </div>

            <div className="min-h-[220px] sm:min-h-[300px] whitespace-pre-wrap text-base leading-relaxed text-slate-900 break-words font-sans">
              {mutation.isPending ? (
                <div className="flex h-full min-h-[220px] sm:min-h-[300px] flex-col items-center justify-center gap-3 text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                  <span className="font-mono text-xs uppercase tracking-widest font-bold text-emerald-700">Refinando com IA...</span>
                </div>
              ) : output ? (
                <div className="rounded-2xl bg-white p-5 border border-slate-200 shadow-sm text-slate-900 leading-relaxed font-medium">
                  {output}
                </div>
              ) : (
                <div className="flex h-full min-h-[220px] sm:min-h-[300px] flex-col items-center justify-center text-center p-6 space-y-2">
                  <p className="font-display text-3xl text-slate-300 font-normal">
                    A versão refinada aparecerá aqui.
                  </p>
                  <p className="text-xs text-slate-400 font-sans font-medium">
                    Escolha o tom desejado nos botões abaixo para gerar.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BARRA DE AÇÃO E SELEÇÃO DE TOM */}
        <div className="card-soft rounded-3xl p-6 sm:p-8 space-y-6">
          
          {/* Ações Principais */}
          <div className="flex flex-wrap items-center gap-3">
            {PRIMARY.map((p) => (
              <Button
                key={p.id}
                onClick={() => run(p.id)}
                disabled={mutation.isPending}
                className={cn(
                  "h-13 px-7 font-bold text-sm gap-2.5 flex-1 sm:flex-initial rounded-2xl transition-all shadow-md hover:scale-[1.02]",
                  p.id === "improve" 
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30" 
                    : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20",
                )}
                title={p.hint}
              >
                {p.id === "improve" ? <Wand2 className="h-4 w-4 text-emerald-200" /> : <RotateCcw className="h-4 w-4" />}
                <span>{p.label}</span>
                {mutation.isPending && activePreset === p.id && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </Button>
            ))}
            <div className="ml-auto hidden items-center gap-2 font-sans text-xs font-semibold text-slate-500 sm:flex">
              <ArrowRight className="h-4 w-4 text-emerald-600" />
              <span>Refinar mantém o sentido original com gramática perfeita</span>
            </div>
          </div>

          {/* Grupos de Tons com Destaque */}
          <div className="grid gap-6 border-t border-slate-100 pt-6 sm:grid-cols-2">
            <ToneGroup
              label="Tons Formais"
              options={FORMAL}
              activePreset={activePreset}
              loading={mutation.isPending}
              onPick={run}
              accentColor="emerald"
            />
            <ToneGroup
              label="Tons Coloquiais"
              options={CASUAL}
              activePreset={activePreset}
              loading={mutation.isPending}
              onPick={run}
              accentColor="indigo"
            />
          </div>
        </div>

        {profile && (
          <p className="text-center font-mono text-xs text-slate-500 font-medium pb-4">
            Modelo de IA ativo: <span className="text-emerald-700 font-bold">{profile.model}</span>
          </p>
        )}
      </section>
    </AppShell>
  );
}

function ToneGroup({
  label,
  options,
  activePreset,
  loading,
  onPick,
  accentColor,
}: {
  label: string;
  options: { id: Preset; label: string }[];
  activePreset: Preset;
  loading: boolean;
  onPick: (id: Preset) => void;
  accentColor: "emerald" | "indigo";
}) {
  return (
    <div className="space-y-2.5">
      <p className="font-sans text-xs uppercase tracking-wider text-slate-500 font-extrabold flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", accentColor === "emerald" ? "bg-emerald-600" : "bg-indigo-600")} />
        {label}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => {
          const isLoading = loading && activePreset === opt.id;
          const isActive = activePreset === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onPick(opt.id)}
              disabled={loading}
              className={cn(
                "rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold font-sans transition-all hover:bg-slate-50 text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 truncate shadow-xs hover:scale-[1.02]",
                isActive && "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/30 shadow-sm font-extrabold",
                isLoading && "ring-2 ring-emerald-600 animate-pulse",
              )}
            >
              {isLoading ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin text-emerald-600" />
              ) : (
                opt.label
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
