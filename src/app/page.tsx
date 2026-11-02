"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { HomeLibrary } from "@/components/HomeLibrary";
import { SunsetHomepage } from "@/components/SunsetHomepage";
import { useUser } from "@/hooks/useUser";

export default function HomePage() {
  const { user, loading } = useUser();

  // Show toast for auth errors from /auth/callback redirects (query params)
  // or from Supabase error fragments (hash params, per Supabase docs).
  // Deferred to next frame so Sonner's <Toaster> is mounted before we fire.
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace("#", ""));
    const error = query.get("error") || hash.get("error_code");

    if (!error) return;

    // Clean up the URL immediately so a refresh doesn't re-trigger
    query.delete("error");
    const clean = query.toString();
    window.history.replaceState(null, "", clean ? `/?${clean}` : "/");

    // Defer toast so Sonner's Toaster is ready
    requestAnimationFrame(() => {
      if (error === "not-approved" || error === "signup_disabled") {
        toast.error("Your Google account isn\u2019t part of the beta yet.");
      } else if (error === "auth" || error.startsWith("4")) {
        toast.error("Sign-in failed. Please try again.");
      }
    });
  }, []);

  if (loading) return null;
  if (user) return <HomeLibrary />;
  return <SunsetHomepage />;
}
