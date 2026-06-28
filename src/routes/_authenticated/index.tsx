import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowRight, Copy, Check, Loader2, RotateCcw, Wand2, KeyRound, ClipboardPaste, Sparkles, Zap } from "lucide-react";
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
      { title: "Refinador de Mensagens · IA para mensagens profissionais" },
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
      <section className="ambient-glow relative space-y-8">
        
        {/* HERO SECTION DE ALTO IMPACTO (Dribbble/Framer style) */}
        <div className="text-center py-6 sm:py-10 space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 backdrop-blur-md shadow-lg animate-float">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-primary">
              Inteligência Artificial de Elite
            </span>
          </div>

          <h1 className="text-display mx-auto max-w-4xl text-balance text-foreground tracking-tight px-2">
            Escreva sem filtro.{" "}
            <span className="font-display text-primary underline decoration-primary/30 underline-offset-8">Envie</span>{" "}
            com perfeição.
          </h1>

          <p className="mx-auto max-w-2xl text-balance text-sm sm:text-base text-muted-foreground font-sans leading-relaxed px-4">
            Cole rascunhos ou audios transcritos mal formatados. A IA ajusta a gramática, melhora a clareza e aplica o tom perfeito em segundos.
          </p>
        </div>

        {!profile?.hasKey && (
          <div className="mx-auto max-w-3xl flex items-start gap-3.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 shadow-xl backdrop-blur-xl">
            <KeyRound className="mt-0.5 h-5 w-5 text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0 space-y-1">
              <p className="font-semibold text-amber-200 text-sm">Configure sua chave gratuita do OpenRouter</p>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                Crie uma conta gratuita em{" "}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline underline-offset-2 hover:text-amber-100"
                >
                  openrouter.ai/keys
                </a>
                , copie sua API Key e salve em{" "}
                <Link to="/configuracoes" className="font-bold text-primary underline underline-offset-2 hover:text-primary/80">
                  Configurações
                </Link>
                .
              </p>
            </div>
          </div>
        )}

        {/* PAINEL DUAL DE ENTRADA E SAÍDA COM BORDAS NEON VIBRANTES */}
        <div className="grid gap-6 lg:grid-cols-2">
          
          {/* CARD 01 - MENSAGEM ORIGINAL */}
          <div className="group relative rounded-3xl border border-emerald-500/30 bg-card/90 p-5 sm:p-6 shadow-[0_0_40px_-15px_rgba(16,185,129,0.15)] backdrop-blur-2xl transition-all duration-300 hover:border-emerald-500/50">
            <div className="mb-4 flex items-center justify-between border-b border-emerald-500/20 pb-3">
              <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] font-bold text-emerald-400">
                <Zap className="h-4 w-4" />
                <span>01 · Sua Mensagem</span>
              </label>
              
              {/* BOTÃO MÁGICO DE COLAR EM 1 CLIQUE */}
              <button
                type="button"
                onClick={handlePaste}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-mono text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20 hover:border-emerald-500/50 shadow-sm hover:scale-[1.03]"
                title="Colar texto da área de transferência com 1 clique"
              >
                <ClipboardPaste className="h-3.5 w-3.5" />
                <span>Colar Texto</span>
              </button>
            </div>

            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 8000))}
              placeholder="Clique em 'Colar Texto' acima ou digite aqui o rascunho da sua mensagem..."
              className="min-h-[220px] sm:min-h-[320px] resize-none border-0 bg-transparent px-0 text-base leading-relaxed text-foreground placeholder:text-muted-foreground/60 shadow-none focus-visible:ring-0"
            />

            <div className="mt-2 flex justify-end">
              <span className="font-mono text-[11px] font-medium text-muted-foreground">{input.length}/8000 caracteres</span>
            </div>
          </div>

          {/* CARD 02 - MENSAGEM REFINADA */}
          <div className="group relative rounded-3xl border border-indigo-500/30 bg-card/90 p-5 sm:p-6 shadow-[0_0_40px_-15px_rgba(99,102,241,0.15)] backdrop-blur-2xl transition-all duration-300 hover:border-indigo-500/50">
            <div className="mb-4 flex items-center justify-between border-b border-indigo-500/20 pb-3">
              <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] font-bold text-indigo-400">
                <Sparkles className="h-4 w-4" />
                <span>02 · Versão Refinada</span>
              </label>

              {output && (
                <button
                  type="button"
                  onClick={copyOutput}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/15 px-3 py-1.5 font-mono text-xs font-semibold text-indigo-300 transition-all hover:bg-indigo-500/25 shadow-sm hover:scale-[1.03]"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? "Copiado!" : "Copiar Texto"}</span>
                </button>
              )}
            </div>

            <div className="min-h-[220px] sm:min-h-[320px] whitespace-pre-wrap text-base leading-relaxed text-foreground break-words">
              {mutation.isPending ? (
                <div className="flex h-full min-h-[220px] sm:min-h-[320px] flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  <span className="text-shimmer font-mono text-xs uppercase tracking-[0.2em] font-bold">Refinando com IA...</span>
                </div>
              ) : output ? (
                <div className="rounded-2xl bg-surface/60 p-4 border border-border/40">
                  {output}
                </div>
              ) : (
                <div className="flex h-full min-h-[220px] sm:min-h-[320px] flex-col items-center justify-center text-center p-6">
                  <p className="font-display text-2xl text-muted-foreground/50">
                    A versão final impecável aparecerá aqui.
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground/40 font-mono">
                    Escolha o tom desejado nos botões abaixo.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BARRA DE AÇÃO E SELEÇÃO DE TOM DE ALTO IMPACTO */}
        <div className="rounded-3xl border border-border/80 bg-card/80 p-6 shadow-2xl backdrop-blur-2xl space-y-6">
          
          {/* Ações Principais */}
          <div className="flex flex-wrap items-center gap-3">
            {PRIMARY.map((p) => (
              <Button
                key={p.id}
                onClick={() => run(p.id)}
                disabled={mutation.isPending}
                className={cn(
                  "h-12 px-6 font-semibold text-sm gap-2.5 flex-1 sm:flex-initial rounded-xl transition-all shadow-lg hover:scale-[1.02]",
                  p.id === "improve" 
                    ? "bg-primary text-primary-foreground glow-ring" 
                    : "bg-surface-elevated text-foreground border border-border hover:bg-accent",
                )}
                title={p.hint}
              >
                {p.id === "improve" ? <Wand2 className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                <span>{p.label}</span>
                {mutation.isPending && activePreset === p.id && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </Button>
            ))}
            <div className="ml-auto hidden items-center gap-2 font-mono text-xs text-muted-foreground sm:flex">
              <ArrowRight className="h-3.5 w-3.5 text-primary" />
              <span>Refinar mantém o sentido original com gramática impecável</span>
            </div>
          </div>

          {/* Grupos de Tons com Destaque */}
          <div className="grid gap-4 border-t border-border/60 pt-6 sm:grid-cols-2">
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
          <p className="text-center font-mono text-xs text-muted-foreground break-all py-2">
            Modelo de IA ativo: <span className="text-primary font-semibold">{profile.model}</span>
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
    <div className="space-y-2">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
        <span className={cn("h-1.5 w-1.5 rounded-full", accentColor === "emerald" ? "bg-emerald-400" : "bg-indigo-400")} />
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
                "rounded-xl border border-border/80 bg-surface px-3 py-2.5 text-xs font-semibold font-mono transition-all hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-50 truncate shadow-sm hover:scale-[1.02]",
                isActive && "border-primary bg-primary/15 text-primary ring-1 ring-primary/50 font-bold",
                isLoading && "ring-2 ring-primary animate-pulse",
              )}
            >
              {isLoading ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin text-primary" />
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
