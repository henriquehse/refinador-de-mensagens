import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      try {
        const { data } = await supabase.auth.getUser();
        if (!data?.user) {
          throw redirect({ to: "/auth" });
        }
        return { user: data.user };
      } catch (e) {
        // Se der erro ou redirecionamento, lança para o router
        if ((e as any)?.to) throw e;
      }
    }
  },
  component: AuthenticatedGuard,
});

function AuthenticatedGuard() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        window.location.href = "/auth";
      } else {
        setAuthenticated(true);
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        window.location.href = "/auth";
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading || !authenticated) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-background text-muted-foreground font-mono text-xs uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Verificando autenticação...
        </div>
      </div>
    );
  }

  return <Outlet />;
}
