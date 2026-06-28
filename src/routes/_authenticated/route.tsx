import { createFileRoute, Outlet } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    try {
      if (typeof window !== "undefined") {
        const { data } = await supabase.auth.getUser();
        if (data?.user) return { user: data.user };
      }
    } catch (e) {
      // ignore
    }

    // Retorna um usuário visitante padrão para liberar o acesso automático direto à aplicação
    return { user: { id: "00000000-0000-0000-0000-000000000000", email: "visitante@refinador.app" } as any };
  },
  component: () => <Outlet />,
});
