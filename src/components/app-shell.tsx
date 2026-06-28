import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Sparkles, History, Settings, LogOut, Star, Download, X } from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBottomBar, setShowBottomBar] = useState(true);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("beforeinstallprompt", handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("beforeinstallprompt", handler);
      }
    };
  }, []);

  async function handleInstallPWA() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        toast.success("Aplicativo instalado com sucesso!");
        setShowBottomBar(false);
      }
      setDeferredPrompt(null);
    } else {
      toast.info("Para instalar no celular ou PC: clique no ícone de instalar na barra do seu navegador ou selecione 'Adicionar à tela de início'.");
    }
  }

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
    <div className="min-h-screen bg-[#F8F9FC] text-slate-900 flex flex-col font-sans selection:bg-emerald-600 selection:text-white pb-12 sm:pb-0">
      {/* Cabeçalho Luminoso com Separação Nítida */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="group flex items-center gap-3 transition-transform hover:scale-[1.02]">
            <span className="relative grid h-10 w-10 place-items-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30 transition-transform group-hover:rotate-[6deg]">
              <Sparkles className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-2xl font-bold tracking-tight text-slate-900">refinador</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-600 font-bold">.app</span>
            </div>
          </Link>

          {/* Navegação Desktop */}
          <nav className="hidden items-center gap-2 sm:flex">
            {navItems.map((item) => {
              const active = pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold font-sans transition-all duration-200",
                    active
                      ? "bg-slate-900 text-white shadow-md"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-emerald-400" : "text-slate-400")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="h-4 w-px bg-slate-200 mx-1" />
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-2 text-xs font-bold text-rose-600 transition-all hover:bg-rose-100 hover:border-rose-300 shadow-xs"
              aria-label="Sair"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sair</span>
            </button>
          </nav>
        </div>

        {/* Navegação Mobile */}
        <nav className="flex items-center gap-1 border-t border-slate-200/80 px-2 py-2 sm:hidden bg-white/90 backdrop-blur-md">
          {navItems.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-bold transition-all",
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900",
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active ? "text-emerald-400" : "text-slate-400")} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          <button
            onClick={handleSignOut}
            className="flex shrink-0 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-bold text-rose-600 hover:bg-rose-50"
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </button>
        </nav>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">{children}</main>

      {/* LINHA DISCRETA COLADA NA BASE PARA INSTALAR O APP (PWA BANNER) */}
      {showBottomBar && (
        <aside className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 text-white backdrop-blur-lg border-t border-slate-800 px-4 py-2.5 shadow-2xl">
          <div className="mx-auto max-w-6xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="font-sans font-bold truncate text-slate-100">
                Instale como App <span className="text-emerald-400 font-mono font-medium hidden sm:inline">→ Acesso + rápido!</span>
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleInstallPWA}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-md transition-all active:scale-95"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Instalar</span>
              </button>
              <button
                onClick={() => setShowBottomBar(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
                aria-label="Fechar aviso"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Rodapé Elegante com Contraste */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span className="font-sans font-bold text-slate-800">Refinador de Mensagens · IA High-End</span>
          </div>
          <p className="font-mono text-[11px] text-slate-500">
            Comunicação profissional acelerada por Inteligência Artificial · OpenRouter Engine
          </p>
        </div>
      </footer>
    </div>
  );
}
