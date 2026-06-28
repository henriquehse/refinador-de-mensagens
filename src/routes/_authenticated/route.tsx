import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    if (typeof window === "undefined") {
      if (import.meta.env.DEV) {
        return { user: { id: "dev-user", email: "dev@local.com" } as any };
      }
      throw redirect({ to: "/auth" });
    }

    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) return { user: data.user };
    } catch (e) {
      // ignore
    }

    // No ambiente local de desenvolvimento, permite bypass. Em produção (Vercel), exige login.
    if (import.meta.env.DEV) {
      return { user: { id: "dev-user", email: "dev@local.com" } as any };
    }

    throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
