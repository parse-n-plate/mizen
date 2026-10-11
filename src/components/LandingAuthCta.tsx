"use client";

import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { cn } from "@/lib/utils";

type LandingAuthCtaProps = {
  onSignIn: () => void;
  className?: string;
  signedInLabel?: string;
};

export function LandingAuthCta({
  onSignIn,
  className,
  signedInLabel = "Open app",
}: LandingAuthCtaProps) {
  const { user, loading } = useUser();

  if (!isSupabaseConfigured) return null;
  if (loading) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "inline-block h-8 w-[88px] rounded-lg bg-stone-100 dark:bg-stone-800",
          className
        )}
      />
    );
  }

  const ctaClassName = cn(
    "px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 font-sans text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-none",
    className
  );

  if (user) {
    return (
      <Link href="/" prefetch={false} className={ctaClassName}>
        {signedInLabel}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onSignIn} className={ctaClassName}>
      Sign in
    </button>
  );
}
