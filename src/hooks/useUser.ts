"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseDown, setSupabaseDown] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        setUser(user);
        setLoading(false);
      })
      .catch(() => {
        setSupabaseDown(true);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
    } catch {
      // silent — user state cleared below regardless
    }
    setUser(null);
  };

  return { user, loading, signOut, supabaseDown };
}
