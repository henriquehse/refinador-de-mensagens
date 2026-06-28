import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowRight, Copy, Check, Loader2, RotateCcw, Wand2, KeyRound } from "lucide-react";
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
  { id: "improve", label: "Refinar", hint: "Melhora geral mantendo o tom" },
  { id: "shorten", label: "Reduzir", hint: "Menor sem mudar o teor" },
];

const FORMAL: { id: Preset; label: string }[] = [
  { id: "formal_low", label: "Baixo" },
  { id: "formal_med", label: "Médio" },
  { id: "formal_high", label: "Alto" },
];

const CASUAL: { id: Preset; label: string }[] = [
  { id: "casual_low", label: "Baixo" },
  { id: "casual_med", label: "Médio" },
  { id: "casual_high", label: "Alto" },
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
      toast.error(err instanceof Error ? err.message : "Falha ao refinar");
    },
  });

  function run(preset: Preset) {
    if (!input.trim()) {
      toast.error("Escreva uma mensagem primeiro.");
      return;
    }
    if (!profile?.hasKey) {
      toast.error("Configure sua chave OpenRouter primeiro.");
      return;
    }
    setActivePreset(preset);
    mutation.mutate(preset);
  }

  async function copyOutput() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <AppShell>
      <section className="ambient-glow relative">
        <div className="mb-8 sm:mb-16">
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur-md">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              Refinador · v1
            </span>
          </div>
          <h1 className="text-display mx-auto mt-4 sm:mt-6 max-w-4xl text-center text-balance text-foreground break-words px-2">
            Escreva uma vez.{" "}
            <span className="font-display text-primary">Envie</span>{" "}
            como um profissional.
          </h1>
          <p className="mx-auto mt-3 sm:mt-5 max-w-xl text-balance text-center text-sm sm:text-lg text-muted-foreground px-2">
            Cole sua mensagem, ajuste o tom em um clique e copie a versão
            <span className="font-display text-foreground"> impecável</span> antes de enviar.
          </p>
        </div>

        {!profile?.hasKey && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
            <KeyRound className="mt-0.5 h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium">Configure sua chave gratuita do OpenRouter</p>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground break-words">
                Em 2 minutos: crie uma conta em{" "}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:text-primary"
                >
                  openrouter.ai/keys
                </a>
                , gere uma API key gratuita e cole em{" "}
                <Link to="/configuracoes" className="font-medium text-primary underline-offset-2 hover:underline">
                  Configurações
                </Link>
                .
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Input */}
          <div className="card-soft noise rounded-2xl sm:rounded-3xl p-4 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <span className="text-primary">01 ·</span> Sua mensagem
              </label>
              <span className="font-mono text-[11px] text-muted-foreground">{input.length}/8000</span>
            </div>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 8000))}
              placeholder="Cole aqui o texto que você quer melhorar antes de enviar..."
              className="min-h-[180px] sm:min-h-[300px] resize-none border-0 bg-transparent px-0 text-[15px] leading-relaxed shadow-none focus-visible:ring-0"
            />
          </div>

          {/* Output */}
          <div className="card-soft noise rounded-2xl sm:rounded-3xl p-4 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <span className="text-primary">02 ·</span> Refinada
              </label>
              {output && (
                <button
                  onClick={copyOutput}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-surface px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:bg-surface-elevated hover:text-foreground"
                >
                  {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
              )}
            </div>
            <div className="min-h-[180px] sm:min-h-[300px] whitespace-pre-wrap text-[15px] leading-relaxed text-foreground break-words">
              {mutation.isPending ? (
                <div className="flex h-full min-h-[180px] sm:min-h-[300px] items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-shimmer font-mono text-xs uppercase tracking-[0.18em]">Refinando</span>
                </div>
              ) : output ? (
                output
              ) : (
                <p className="font-display text-xl sm:text-2xl text-muted-foreground/70">
                  A versão refinada aparecerá aqui.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="card-soft mt-4 sm:mt-6 space-y-4 rounded-2xl sm:rounded-3xl p-4 sm:p-6">

          {/* Primary actions */}
          <div className="flex flex-wrap items-center gap-2">
            {PRIMARY.map((p) => (
              <Button
                key={p.id}
                onClick={() => run(p.id)}
                disabled={mutation.isPending}
                className={cn(
                  "gap-2 flex-1 sm:flex-initial",
                  p.id === "improve" ? "" : "bg-surface-elevated text-foreground hover:bg-accent",
                )}
                variant={p.id === "improve" ? "default" : "secondary"}
                title={p.hint}
              >
                {p.id === "improve" ? <Wand2 className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                {p.label}
                {mutation.isPending && activePreset === p.id && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
              </Button>
            ))}
            <div className="ml-auto hidden items-center gap-1.5 font-mono text-[11px] text-muted-foreground sm:flex">
              <ArrowRight className="h-3 w-3" />
              dica: Refinar mantém o tom original
            </div>
          </div>

          {/* Tone groups */}
          <div className="grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-2">
            <ToneGroup
              label="Formal"
              options={FORMAL}
              activePreset={activePreset}
              loading={mutation.isPending}
              onPick={run}
            />
            <ToneGroup
              label="Coloquial"
              options={CASUAL}
              activePreset={activePreset}
              loading={mutation.isPending}
              onPick={run}
            />
          </div>
        </div>

        {profile && (
          <p className="mt-4 text-center font-mono text-[11px] text-muted-foreground break-all px-2">
            modelo ativo: <span className="text-foreground">{profile.model}</span>
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
}: {
  label: string;
  options: { id: Preset; label: string }[];
  activePreset: Preset;
  loading: boolean;
  onPick: (id: Preset) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="flex gap-1.5">
        {options.map((opt) => {
          const isLoading = loading && activePreset === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onPick(opt.id)}
              disabled={loading}
              className={cn(
                "flex-1 min-w-0 rounded-md border border-border/60 bg-surface px-2 py-2 text-xs sm:text-sm font-medium transition-colors hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-50 truncate",
                isLoading && "ring-1 ring-primary/50",
              )}
            >
              {isLoading ? (
                <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" />
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
