import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Sparkles, History, Settings, LogOut, Star } from "lucide-react";
import { type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

interface AppShellProps {
  children: ReactNode;
}

const navItems = [
  { to: "/", label: "Refinar", icon: Sparkles },
  { to: "/favoritos", label: "Favoritos", icon: Star },
  { to: "/historico", label: "Histórico", icon: History },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function handleSignOut() {
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    } finally {
      if (typeof window !== "undefined") {
        window.localStorage.clear();
        window.location.href = "/auth";
      } else {
        navigate({ to: "/auth", replace: true });
      }
    }
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground flex flex-col selection:bg-primary selection:text-primary-foreground">
      {/* Cabeçalho de Alto Impacto com Separação de Cor */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-surface/90 backdrop-blur-2xl shadow-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="group flex items-center gap-3 transition-transform hover:scale-[1.02]">
            <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground glow-ring transition-transform group-hover:rotate-[6deg]">
              <Sparkles className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-2xl font-bold tracking-tight text-foreground">refinador</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary font-semibold">.app</span>
            </div>
          </Link>

          {/* Navegação Desktop */}
          <nav className="hidden items-center gap-1.5 sm:flex">
            {navItems.map((item) => {
              const active = pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold font-mono transition-all duration-200",
                    active
                      ? "bg-primary text-primary-foreground shadow-lg glow-ring/30"
                      : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground border border-transparent hover:border-border/60",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="h-4 w-px bg-border/60 mx-1" />
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold font-mono text-rose-400 transition-all hover:bg-rose-500/20 hover:border-rose-500/40"
              aria-label="Sair"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sair</span>
            </button>
          </nav>
        </div>

        {/* Navegação Mobile Focada em UX */}
        <nav className="flex items-center gap-1 border-t border-border/60 px-2 py-2 sm:hidden bg-surface-elevated/90 backdrop-blur-md">
          {navItems.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-mono font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-md font-bold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={handleSignOut}
            className="flex shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-mono font-medium text-rose-400 hover:bg-rose-500/10"
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </button>
        </nav>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>

      {/* Rodapé Distinto e Elegante */}
      <footer className="border-t border-border/80 bg-surface/90 py-8 text-center text-xs text-muted-foreground backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-mono text-foreground font-medium">Refinador de Mensagens · IA High-End</span>
          </div>
          <p className="font-mono text-[11px] text-muted-foreground">
            Desenvolvido para máxima produtividade profissional · Powered by OpenRouter
          </p>
        </div>
      </footer>
    </div>
  );
}
