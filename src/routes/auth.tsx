import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Loader2, Mail, Lock, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;

        if (data.session) {
          toast.success("Conta criada e logada com sucesso!");
          navigate({ to: "/", replace: true });
        } else {
          toast.success("Conta criada! Se a confirmação por e-mail estiver ativa, verifique sua caixa de entrada.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (data.session) {
          toast.success("Login realizado!");
          navigate({ to: "/", replace: true });
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err) {
      toast.error("O login via Google exige configuração do OAuth Secret no Supabase. Por favor, acesse via E-mail/Senha abaixo.");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="dark ambient-glow relative flex min-h-screen items-center justify-center bg-background px-4 py-12 text-foreground overflow-hidden">
      {/* Luzes ambiente e grade de fundo */}
      <div className="absolute inset-0 grid-bg opacity-70" aria-hidden />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[400px] bg-primary/15 blur-[140px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-md space-y-6">
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

        {/* Card Principal de Autenticação */}
        <div className="rounded-3xl border border-border/80 bg-card/80 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl transition-all">
          
          {/* Seleção de Abas */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface p-1 border border-border/50 mb-6 font-mono text-xs">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={cn(
                "rounded-lg py-2 transition-all duration-200 font-medium text-center",
                mode === "signin"
                  ? "bg-surface-elevated text-foreground shadow-sm border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated/40"
              )}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={cn(
                "rounded-lg py-2 transition-all duration-200 font-medium text-center",
                mode === "signup"
                  ? "bg-surface-elevated text-foreground shadow-sm border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated/40"
              )}
            >
              Criar Conta
            </button>
          </div>

          {/* Aviso Google OAuth */}
          <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200/90 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <span>Use a opção de <strong>E-mail e Senha</strong> abaixo para acessar o sistema instantaneamente na Vercel.</span>
          </div>

          {/* Botão de Login com Google */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 bg-surface/80 hover:bg-surface-elevated border-border/80 font-medium text-sm gap-2.5 transition-all glow-ring/0 opacity-70 hover:opacity-100"
            onClick={handleGoogle}
            disabled={googleLoading}
          >
            {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
            <span>Continuar com Google</span>
          </Button>

          {/* Divisor */}
          <div className="my-6 flex items-center gap-3 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            <div className="h-px flex-1 bg-border/60" />
            <span>ou via e-mail</span>
            <div className="h-px flex-1 bg-border/60" />
          </div>

          {/* Formulário de Credenciais */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-surface/90 border-border/80 pl-9 h-11 text-sm focus-visible:ring-primary/40 focus-visible:border-primary/60 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-surface/90 border-border/80 pl-9 h-11 text-sm focus-visible:ring-primary/40 focus-visible:border-primary/60 transition-all"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 font-medium gap-2 glow-ring mt-2" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>{mode === "signin" ? "Entrar na conta" : "Criar minha conta"}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Rodapé de Segurança */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>Autenticação protegida via OAuth 2.0 & Supabase</span>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.4-1.6 4-5.4 4-3.2 0-5.9-2.7-5.9-6s2.6-6 5.9-6c1.8 0 3.1.8 3.8 1.4l2.6-2.5C16.7 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.6 0 9.3-3.9 9.3-9.4 0-.6-.1-1.1-.2-1.6H12z"/>
    </svg>
  );
}
