import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Copy, Check, Trash2, History as HistoryIcon, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  deleteTransformation,
  listTransformations,
} from "@/lib/transformer.functions";

const PRESET_LABEL: Record<string, string> = {
  improve: "Refinar",
  shorten: "Reduzir",
  formal_low: "Formal · baixo",
  formal_med: "Formal · médio",
  formal_high: "Formal · alto",
  casual_low: "Coloquial · baixo",
  casual_med: "Coloquial · médio",
  casual_high: "Coloquial · alto",
  custom: "Personalizado",
};

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({ meta: [{ title: "Histórico · Refinador" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listTransformations);
  const deleteFn = useServerFn(deleteTransformation);

  const { data, isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: () => listFn(),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Removido");
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Histórico</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Últimas 100 mensagens que você refinou.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <HistoryIcon className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhuma mensagem refinada ainda.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map((item) => (
            <HistoryItem
              key={item.id}
              item={item}
              onDelete={() => del.mutate(item.id)}
              deleting={del.isPending && del.variables === item.id}
            />
          ))}
        </ul>
      )}
    </AppShell>
  );
}

interface Item {
  id: string;
  original_text: string;
  result_text: string;
  preset: string;
  model: string | null;
  created_at: string;
}

function HistoryItem({
  item,
  onDelete,
  deleting,
}: {
  item: Item;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(item.result_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const date = new Date(item.created_at).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <li className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-primary">
            {PRESET_LABEL[item.preset] ?? item.preset}
          </span>
          <span className="font-mono text-muted-foreground">{date}</span>
        </div>
        {item.model && (
          <span className="truncate max-w-full font-mono text-[11px] text-muted-foreground">
            {item.model}
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="min-w-0">
          <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Original
          </p>
          <p className={expanded ? "whitespace-pre-wrap text-sm break-words" : "line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground break-words"}>
            {item.original_text}
          </p>
        </div>
        <div className="min-w-0">
          <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Refinada
          </p>
          <p className={expanded ? "whitespace-pre-wrap text-sm break-words" : "line-clamp-4 whitespace-pre-wrap text-sm break-words"}>
            {item.result_text}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Recolher" : "Expandir"}
        </Button>
        <Button variant="ghost" size="sm" onClick={copy} className="gap-1.5">
          {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiado" : "Copiar refinada"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={deleting}
          className="ml-auto text-muted-foreground hover:text-destructive"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </li>
  );
}
