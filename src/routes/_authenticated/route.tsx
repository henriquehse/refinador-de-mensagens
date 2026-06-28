import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    if (typeof window === "undefined") {
      return { user: { id: "dev-user", email: "dev@local.com" } as any };
    }

    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) return { user: data.user };
    } catch (e) {
      // ignore
    }

    // Bypass temporário para testes e desenvolvimento local
    return { user: { id: "dev-user", email: "dev@local.com" } as any };
  },
  component: () => <Outlet />,
});
