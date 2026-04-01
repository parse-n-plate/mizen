"use client";

import { useState } from "react";
import { toast } from "sonner";
import Share from "@solar-icons/react/csr/ui/Share";

export function ShareLinkButton({
  slug,
  title,
  summary,
}: {
  slug: string;
  title: string;
  summary?: string;
}) {
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/r/${slug}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          ...(summary && { text: summary }),
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast.error("Failed to share");
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
      aria-label="Share recipe"
    >
      <Share className={`h-[18px] w-[18px] ${shared ? "text-emerald-500" : ""}`} />
    </button>
  );
}
