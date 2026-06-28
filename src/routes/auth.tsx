import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar · Refinador de Mensagens" },
      { name: "description", content: "Acesse sua conta para refinar suas mensagens com IA." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: "/", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      // Tenta realizar a autenticação via Supabase padrão
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        // Fallback para o módulo do Lovable caso esteja rodando na nuvem
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin,
        });
        if (result.error) throw result.error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao entrar com Google");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="dark ambient-glow relative flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground overflow-hidden">
      {/* Luzes ambiente e grade de fundo */}
      <div className="absolute inset-0 grid-bg opacity-70" aria-hidden />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[400px] bg-primary/15 blur-[140px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md space-y-8">
        {/* Cabeçalho / Logo */}
        <div className="text-center space-y-3">
          <Link to="/auth" className="inline-flex items-center gap-3 group transition-transform hover:scale-[1.02]">
            <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground glow-ring shadow-xl transition-transform group-hover:rotate-[6deg]">
              <Sparkles className="h-6 w-6" strokeWidth={2.5} />
            </span>
            <div className="text-left leading-none">
              <span className="font-display text-3xl tracking-tight text-foreground">refinador</span>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground block mt-1">.app</span>
            </div>
          </Link>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-[0.18em]">
            Comunicação de Alto Nível impulsionada por IA
          </p>
        </div>

        {/* Card Principal de Autenticação Exclusiva Google */}
        <div className="rounded-3xl border border-border/80 bg-card/80 p-8 shadow-2xl backdrop-blur-2xl transition-all space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Bem-vindo de volta
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Acesse sua conta com segurança para criar, refinar e transformar suas mensagens profissionais.
            </p>
          </div>

          {/* Destaques rápidos */}
          <div className="space-y-2 py-2 border-y border-border/40">
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <span>Acesso instantâneo sem necessidade de senhas</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <span>Histórico e configurações sincronizadas na nuvem</span>
            </div>
          </div>

          {/* Botão Único de Login com Google */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 bg-surface hover:bg-surface-elevated border-border font-medium text-sm gap-3 transition-all glow-ring/0 hover:glow-ring shadow-md hover:scale-[1.01]"
            onClick={handleGoogle}
            disabled={googleLoading}
          >
            {googleLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <GoogleIcon />}
            <span className="text-foreground font-semibold">Continuar com o Google</span>
          </Button>

          <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
            Ao continuar, você concorda em conectar sua conta do Google de forma segura.
          </p>
        </div>

        {/* Rodapé de Segurança */}
        <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Autenticação protegida via OAuth 2.0 & Supabase</span>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.4-1.6 4-5.4 4-3.2 0-5.9-2.7-5.9-6s2.6-6 5.9-6c1.8 0 3.1.8 3.8 1.4l2.6-2.5C16.7 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.6 0 9.3-3.9 9.3-9.4 0-.6-.1-1.1-.2-1.6H12z"/>
    </svg>
  );
}
