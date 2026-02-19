"use client";

import { useState } from "react";

export function useUser() {
  const [user] = useState<null>(null);
  const [loading] = useState(false);

  const signOut = async () => {
    // No-op without Supabase
  };

  return { user, loading, signOut };
}
