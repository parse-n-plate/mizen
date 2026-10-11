"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { PublicHeader } from "@/components/PublicPage";
import { LandingAuthCta } from "@/components/LandingAuthCta";
import { BetaAuthModal } from "@/components/BetaAuthModal";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export function PublicSiteHeader() {
  const pathname = usePathname();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <PublicHeader
        currentPath={pathname}
        action={<LandingAuthCta onSignIn={() => setAuthOpen(true)} />}
      />
      {isSupabaseConfigured && <BetaAuthModal open={authOpen} onOpenChange={setAuthOpen} />}
    </>
  );
}
