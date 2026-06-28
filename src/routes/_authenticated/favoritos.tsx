import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
  Variable,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  deleteFavorite,
  listFavorites,
  upsertFavorite,
} from "@/lib/favorites.functions";

type Favorite = {
  id: string;
  name: string;
  body: string;
  created_at: string;
  updated_at: string;
};

const VAR_RE = /\{\{\s*([a-zA-Z0-9_\-\u00C0-\u017F ]+?)\s*\}\}/g;

function extractVariables(body: string): string[] {
  const set = new Set<string>();
  for (const m of body.matchAll(VAR_RE)) set.add(m[1].trim());
  return Array.from(set);
}

function fillTemplate(body: string, values: Record<string, string>): string {
  return body.replace(VAR_RE, (_, raw: string) => {
    const key = raw.trim();
    const v = values[key];
    return v && v.trim().length > 0 ? v : `{{${key}}}`;
  });
}

const SUGGESTED_VARS = ["nome", "telefone", "email", "site", "empresa", "hora", "data"];

export const Route = createFileRoute("/_authenticated/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos · Mensagens-modelo com variáveis" },
      {
        name: "description",
        content:
          "Salve mensagens reutilizáveis com variáveis como {{nome}} e {{telefone}}. Personalize em segundos.",
      },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listFavorites);
  const upsertFn = useServerFn(upsertFavorite);
  const deleteFn = useServerFn(deleteFavorite);

  const { data: favorites, isLoading } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => listFn(),
  });

  const [editing, setEditing] = useState<Partial<Favorite> | null>(null);
  const [usingFav, setUsingFav] = useState<Favorite | null>(null);

  const upsertMut = useMutation({
    mutationFn: (input: { id?: string; name: string; body: string }) =>
      upsertFn({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      setEditing(null);
      toast.success("Favorito salvo");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Falha ao salvar"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Favorito removido");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Falha ao remover"),
  });

  return (
    <AppShell>
      <section className="ambient-glow relative">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-surface px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              <Star className="h-3 w-3 text-primary" />
              Favoritos
            </span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Suas mensagens-modelo
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Crie mensagens reutilizáveis com variáveis no formato{" "}
              <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-primary">
                {"{{nome}}"}
              </code>
              ,{" "}
              <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-primary">
                {"{{telefone}}"}
              </code>
              ,{" "}
              <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-primary">
                {"{{site}}"}
              </code>
              … Personalize a cada envio sem reescrever do zero.
            </p>
          </div>
          <Button
            onClick={() =>
              setEditing({
                name: "",
                body:
                  "Olá {{nome}}, tudo bem?\n\nGostaria de confirmar nosso contato pelo telefone {{telefone}} às {{hora}}.\n\nQualquer coisa, me retorne pelo e-mail {{email}}.\n\nObrigado!",
              })
            }
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Novo favorito
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-mono text-xs">carregando favoritos...</span>
          </div>
        ) : !favorites || favorites.length === 0 ? (
          <EmptyState onCreate={() => setEditing({ name: "", body: "" })} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {favorites.map((f) => (
              <FavoriteCard
                key={f.id}
                favorite={f}
                onUse={() => setUsingFav(f)}
                onEdit={() => setEditing(f)}
                onDelete={() => {
                  if (confirm(`Remover "${f.name}"?`)) deleteMut.mutate(f.id);
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Edit / create */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? "Editar favorito" : "Novo favorito"}
            </DialogTitle>
            <DialogDescription>
              Use{" "}
              <code className="rounded bg-surface px-1 font-mono text-xs text-primary">
                {"{{variavel}}"}
              </code>{" "}
              em qualquer lugar da mensagem. Sugestões: {SUGGESTED_VARS.map((v) => `{{${v}}}`).join(", ")}.
            </DialogDescription>
          </DialogHeader>
          <EditorForm
            initial={editing}
            saving={upsertMut.isPending}
            onCancel={() => setEditing(null)}
            onSave={(values) => upsertMut.mutate(values)}
          />
        </DialogContent>
      </Dialog>

      {/* Use */}
      <Dialog open={!!usingFav} onOpenChange={(o) => !o && setUsingFav(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{usingFav?.name}</DialogTitle>
            <DialogDescription>
              Preencha as variáveis e copie a mensagem pronta.
            </DialogDescription>
          </DialogHeader>
          {usingFav && (
            <UseForm favorite={usingFav} onClose={() => setUsingFav(null)} />
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function FavoriteCard({
  favorite,
  onUse,
  onEdit,
  onDelete,
}: {
  favorite: Favorite;
  onUse: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const vars = extractVariables(favorite.body);
  return (
    <div className="group flex flex-col rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-xl transition-colors hover:border-border min-w-0">
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-1 font-medium break-words min-w-0">{favorite.name}</h3>
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 transition-opacity sm:group-hover:opacity-100 shrink-0">
          <button
            onClick={onEdit}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-surface hover:text-foreground"
            aria-label="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-surface hover:text-destructive"
            aria-label="Remover"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground break-words">
        {favorite.body}
      </p>
      {vars.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {vars.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground max-w-full truncate"
            >
              <Variable className="h-2.5 w-2.5 text-primary shrink-0" />
              <span className="truncate">{v}</span>
            </span>
          ))}
        </div>
      )}
      <Button
        onClick={onUse}
        size="sm"
        variant="secondary"
        className="mt-4 w-full"
      >
        Usar mensagem
      </Button>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 p-10 text-center">
      <Star className="mx-auto h-8 w-8 text-muted-foreground" />
      <h2 className="mt-3 text-lg font-medium">Nenhum favorito ainda</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Salve aqui mensagens que você manda com frequência (boas-vindas,
        cobrança, follow-up...) usando variáveis para personalizar cada envio.
      </p>
      <Button onClick={onCreate} className="mt-5 gap-2">
        <Plus className="h-4 w-4" /> Criar primeiro favorito
      </Button>
    </div>
  );
}

function EditorForm({
  initial,
  saving,
  onCancel,
  onSave,
}: {
  initial: Partial<Favorite> | null;
  saving: boolean;
  onCancel: () => void;
  onSave: (v: { id?: string; name: string; body: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const vars = useMemo(() => extractVariables(body), [body]);

  function insertVar(v: string) {
    setBody((b) => `${b}${b.endsWith(" ") || b.length === 0 ? "" : " "}{{${v}}}`);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="fav-name">Nome</Label>
        <Input
          id="fav-name"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 120))}
          placeholder="Ex.: Boas-vindas cliente novo"
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="fav-body">Mensagem</Label>
          <span className="font-mono text-[11px] text-muted-foreground">
            {body.length}/8000
          </span>
        </div>
        <Textarea
          id="fav-body"
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 8000))}
          placeholder="Escreva sua mensagem usando {{variaveis}} onde quiser personalizar."
          className="min-h-[200px]"
        />
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Inserir:
          </span>
          {SUGGESTED_VARS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => insertVar(v)}
              className="rounded-md border border-border/60 bg-surface px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
            >
              {"{{"}{v}{"}}"}
            </button>
          ))}
        </div>
        {vars.length > 0 && (
          <p className="pt-2 font-mono text-[11px] text-muted-foreground">
            Variáveis detectadas:{" "}
            <span className="text-foreground">{vars.join(", ")}</span>
          </p>
        )}
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button
          onClick={() =>
            onSave({
              id: initial?.id,
              name: name.trim(),
              body: body.trim(),
            })
          }
          disabled={saving || !name.trim() || !body.trim()}
          className="gap-2"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Salvar
        </Button>
      </DialogFooter>
    </div>
  );
}

function UseForm({
  favorite,
  onClose,
}: {
  favorite: Favorite;
  onClose: () => void;
}) {
  const vars = useMemo(() => extractVariables(favorite.body), [favorite.body]);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(vars.map((v) => [v, ""])),
  );
  const [copied, setCopied] = useState(false);

  const filled = useMemo(() => fillTemplate(favorite.body, values), [
    favorite.body,
    values,
  ]);

  const missing = vars.filter((v) => !values[v]?.trim());

  async function copy() {
    await navigator.clipboard.writeText(filled);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("Mensagem copiada");
  }

  return (
    <div className="space-y-4">
      {vars.length === 0 ? (
        <p className="rounded-md border border-border/60 bg-surface px-3 py-2 text-xs text-muted-foreground">
          Esta mensagem não tem variáveis. Pode copiar direto.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {vars.map((v) => (
            <div key={v} className="space-y-1">
              <Label htmlFor={`var-${v}`} className="font-mono text-xs">
                {"{{"}{v}{"}}"}
              </Label>
              <Input
                id={`var-${v}`}
                value={values[v] ?? ""}
                onChange={(e) =>
                  setValues((s) => ({ ...s, [v]: e.target.value }))
                }
                placeholder={`Valor para ${v}`}
              />
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Pré-visualização
          </Label>
          {missing.length > 0 && (
            <span className="font-mono text-[11px] text-muted-foreground">
              {missing.length} variável(is) sem valor
            </span>
          )}
        </div>
        <div
          className={cn(
            "min-h-[140px] whitespace-pre-wrap rounded-md border border-border/60 bg-surface/60 p-3 text-sm",
            missing.length > 0 && "text-muted-foreground",
          )}
        >
          {filled}
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button variant="ghost" onClick={onClose} className="gap-2">
          <X className="h-3.5 w-3.5" /> Fechar
        </Button>
        <Button onClick={copy} className="gap-2">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado" : "Copiar mensagem"}
        </Button>
      </DialogFooter>
    </div>
  );
}
