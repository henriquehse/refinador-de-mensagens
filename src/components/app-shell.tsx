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
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="group flex items-center gap-2.5 text-[15px] tracking-tight">
            <span className="relative grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground glow-ring transition-transform group-hover:rotate-[8deg]">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            <span className="font-display text-xl leading-none">refinador</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">.app</span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {navItems.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-surface-elevated text-foreground"
                      : "text-muted-foreground hover:bg-surface hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={handleSignOut}
              className="ml-2 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              aria-label="Sair"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </nav>
        </div>
        <nav className="flex items-center gap-1 border-t border-border/60 px-2 py-1.5 sm:hidden">
          {navItems.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1.5 text-[10px]",
                  active ? "bg-surface-elevated text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={handleSignOut}
            className="flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1.5 text-[10px] text-muted-foreground"
            aria-label="Sair"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sair</span>
          </button>
        </nav>

      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>
      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        Feito para mensagens melhores · powered by OpenRouter
      </footer>
    </div>
  );
}
