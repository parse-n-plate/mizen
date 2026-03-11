"use client";

import { useSyncExternalStore } from "react";
import { subscribePreferences } from "@/lib/preferences";

export function usePreference<T>(getSnapshot: () => T) {
  return useSyncExternalStore(subscribePreferences, getSnapshot, getSnapshot);
}
