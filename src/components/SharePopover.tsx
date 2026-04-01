"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRecipe } from "@/context/RecipeContext";
import { useUser } from "@/hooks/useUser";
import Share from "@solar-icons/react/csr/ui/Share";
import Copy from "@solar-icons/react/csr/ui/Copy";
import CheckCircle from "@solar-icons/react/csr/ui/CheckCircle";
import Link from "@solar-icons/react/csr/text-formatting/Link";

export function SharePopover() {
  const { recipe, savedMeta, setSavedMeta } = useRecipe();
  const { user } = useUser();

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!recipe) return null;

  const shareUrl = savedMeta
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/r/${savedMeta.slug}`
    : "";

  const ensureSaved = async (): Promise<string | null> => {
    if (savedMeta) return `${window.location.origin}/r/${savedMeta.slug}`;
    if (!user) return null;
    setSaving(true);
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe }),
      });
      const saved = await res.json();
      if (saved?.id && saved?.slug) {
        setSavedMeta({ id: saved.id, slug: saved.slug });
        return `${window.location.origin}/r/${saved.slug}`;
      }
      return null;
    } catch {
      toast.error("Failed to save recipe");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleOpen = async () => {
    setCopied(false);
    setOpen(true);
    // Auto-save if needed
    if (!savedMeta && user) {
      await ensureSaved();
    }
  };

  const handleCopy = async () => {
    const url = await ensureSaved();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="relative">
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
        aria-label="Share"
      >
        <Share className="h-[18px] w-[18px]" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="popover-animate absolute right-0 top-full z-40 mt-2 w-72 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-200 dark:border-stone-700">
              <Link className="h-4 w-4 text-stone-400 dark:text-stone-500" />
              <span className="font-sans text-[13px] font-semibold text-stone-900 dark:text-stone-100">
                Share link
              </span>
            </div>

            {/* Content */}
            <div className="p-3">
              {saving ? (
                <div className="flex items-center justify-center py-3">
                  <svg
                    className="h-4 w-4 animate-spin text-stone-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                </div>
              ) : !user ? (
                <p className="font-sans text-sm text-stone-500 dark:text-stone-400 text-center py-3">
                  Sign in to share recipes.
                </p>
              ) : shareUrl ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 px-2.5 py-2 min-w-0">
                    <span className="font-sans text-xs text-stone-500 dark:text-stone-400 truncate">
                      {shareUrl.replace(/^https?:\/\//, "")}
                    </span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
                      copied
                        ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                        : "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200"
                    }`}
                    aria-label={copied ? "Copied" : "Copy link"}
                  >
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
