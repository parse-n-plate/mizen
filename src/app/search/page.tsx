"use client";

import { useRouter } from "next/navigation";
import { SearchCommandFullScreen } from "@/components/SearchCommandModal";

export default function SearchPage() {
  const router = useRouter();

  return <SearchCommandFullScreen onClose={() => router.back()} />;
}
