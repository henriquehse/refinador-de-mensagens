import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    // No servidor (SSR), permite passar para o cliente verificar o localStorage
    if (typeof window === "undefined") {
      return { user: null };
    }

    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) return { user: data.user };
    } catch (e) {
      // ignore
    }

    // No ambiente de desenvolvimento local (localhost), permite acesso direto
    if (import.meta.env.DEV) {
      return { user: { id: "dev-user", email: "dev@local.com" } as any };
    }

    // Na Vercel (cliente), se não estiver autenticado, redireciona para /auth
    throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
