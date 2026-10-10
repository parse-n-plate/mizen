"use client";

import { useState } from "react";
import Image from "next/image";
import { FileText, ImageIcon, LinkIcon, type LucideIcon } from "lucide-react";
import type { SavedRecipe } from "@/lib/types";

type SourceKind = "image" | "url" | "text";

const SOURCE_KIND_ICON: Record<SourceKind, LucideIcon> = {
  image: ImageIcon,
  url: LinkIcon,
  text: FileText,
};

const SOURCE_KIND_LABEL: Record<SourceKind, string> = {
  image: "Image recipe",
  url: "Web recipe",
  text: "Text recipe",
};

export function getSourceKind(item: SavedRecipe): SourceKind {
  if (item.source_url || item.recipe.sourceUrl) return "url";
  if (item.recipe.imageTranscription || item.recipe.imageUrl) return "image";
  return "text";
}

export function RecipeSourceIcon({ domain, kind }: { domain: string | null; kind: SourceKind }) {
  const [faviconFailed, setFaviconFailed] = useState(false);

  if (domain && !faviconFailed) {
    return (
      <Image
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
        alt=""
        width={16}
        height={16}
        unoptimized
        onError={() => setFaviconFailed(true)}
        className="shrink-0 rounded-sm"
      />
    );
  }

  const Icon = SOURCE_KIND_ICON[kind];

  return (
    <span
      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm text-stone-400 dark:text-stone-500"
      title={SOURCE_KIND_LABEL[kind]}
      aria-label={SOURCE_KIND_LABEL[kind]}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
    </span>
  );
}
