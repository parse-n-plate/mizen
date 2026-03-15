"use client";

import { useEffect } from "react";
import { initThemeListener } from "@/lib/theme";

export function ThemeSync() {
  useEffect(() => initThemeListener(), []);
  return null;
}
