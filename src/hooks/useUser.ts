"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { User } from "@supabase/supabase-js";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [supabaseDown, setSupabaseDown] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      return;
    }

    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        setUser(user);
        setSupabaseDown(false);
        setLoading(false);
      })
      .catch(() => {
        setSupabaseDown(true);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setSupabaseDown(false);
      setLoading(false);

      if (event === "SIGNED_IN" && window.location.hash.includes("access_token")) {
        // Strip tokens from URL after implicit-flow auth (e.g. invite links)
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }

      if (event === "TOKEN_REFRESHED" && !session) {
        // Token refresh failed — session expired; force-clear since the
        // unconditional setUser above may still see a stale session object.
        setUser(null);
      }
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
