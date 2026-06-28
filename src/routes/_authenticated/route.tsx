import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    // No servidor (SSR), não bloqueia para permitir que o cliente hidrate a sessão do localStorage
    if (typeof window === "undefined") {
      return { user: null };
    }

    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        return { user: data.user };
      }
    } catch (e) {
      // ignore
    }

    // Se no cliente não houver usuário autenticado no Supabase, redireciona para a tela de login
    throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
