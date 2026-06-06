"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isDesignSystemSlug } from "./nav";

export function DesignSystemHashRedirect() {
  const router = useRouter();

  useEffect(() => {
    const slug = window.location.hash.replace("#", "");
    if (slug && isDesignSystemSlug(slug)) {
      router.replace(slug === "overview" ? "/design-system" : `/design-system/${slug}`);
    }
  }, [router]);

  return null;
}
