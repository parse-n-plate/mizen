"use client";

import { useRouter } from "next/navigation";
import { SearchCommandFullScreen } from "@/components/SearchCommandModal";

export default function SearchPage() {
  const router = useRouter();

  const handleClose = () => {
    if (document.referrer.startsWith(window.location.origin) && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return <SearchCommandFullScreen onClose={handleClose} />;
}
