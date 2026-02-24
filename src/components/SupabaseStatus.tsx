"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { useUser } from "@/hooks/useUser";

export function SupabaseStatus() {
  const { supabaseDown } = useUser();

  useEffect(() => {
    if (!isSupabaseConfigured) {
      toast.info(
        "Supabase is not connected. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local to enable accounts and saving.",
        { id: "supabase-status", duration: Infinity, position: "bottom-right" }
      );
    }
  }, []);

  useEffect(() => {
    if (supabaseDown && isSupabaseConfigured) {
      toast.info(
        "Some features like saving recipes are temporarily unavailable.",
        { id: "supabase-down", duration: Infinity, position: "bottom-right" }
      );
    }
  }, [supabaseDown]);

  return null;
}
