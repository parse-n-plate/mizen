"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRecipe } from "@/context/RecipeContext";
import { detectCollectionUrl } from "@/utils/urlPatterns";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

export function CookbookAddRecipeButton() {
  const router = useRouter();
  const { setRecipe } = useRecipe();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"menu" | "link">("menu");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const close = () => {
    setOpen(false);
    setMode("menu");
    setUrl("");
  };

  const parseRecipe = async (body: Record<string, string>) => {
    const response = await fetch("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!result.success || !result.data) {
      throw new Error(result.error || "Failed to parse recipe");
    }
    setRecipe(result.data);
    router.push("/recipe");
  };

  const handleUrl = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl || loading) return;

    const collectionWarning = detectCollectionUrl(trimmedUrl);
    if (collectionWarning) toast.warning(`${collectionWarning} We'll still try parsing it.`);

    setLoading(true);
    try {
      await parseRecipe({ url: trimmedUrl });
      close();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImage = async (file: File) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Only JPEG, PNG, and WebP images are supported.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image is too large (max 4 MB).");
      return;
    }

    close();
    setLoading(true);
    try {
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      await parseRecipe({ image, mimeType: file.type });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => {
          setMode("menu");
          setOpen((isOpen) => !isOpen);
        }}
        className="inline-flex items-center gap-1.5 rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700 dark:bg-stone-200 dark:text-stone-900 dark:hover:bg-stone-300"
        aria-label="Add recipe"
        aria-expanded={open}
      >
        <span className="text-base leading-none">+</span>
        Add Recipe
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={close} />
          <div className="popover-animate absolute right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-900">
            {mode === "menu" ? (
              <div className="w-44 py-1">
                <p className="px-3 py-1.5 font-sans text-xs font-medium text-stone-400 dark:text-stone-500">Add recipe</p>
                <button type="button" onClick={() => setMode("link")} className="flex w-full items-center gap-2.5 px-3 py-2 font-sans text-sm text-stone-600 transition-colors hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-800">
                  Paste a link
                </button>
                <button type="button" onClick={() => { close(); fileInputRef.current?.click(); }} className="flex w-full items-center gap-2.5 px-3 py-2 font-sans text-sm text-stone-600 transition-colors hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-800">
                  Upload an image
                </button>
              </div>
            ) : (
              <div className="w-72 p-2">
                <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 transition-colors focus-within:border-stone-400 dark:border-stone-700 dark:bg-stone-800/50 dark:focus-within:border-stone-500">
                  <input autoFocus type="url" value={url} onChange={(event) => setUrl(event.target.value)} onKeyDown={(event) => event.key === "Enter" && handleUrl()} placeholder="https://..." className="flex-1 bg-transparent font-sans text-sm text-stone-700 outline-none placeholder:text-stone-400 dark:text-stone-200 dark:placeholder:text-stone-500" />
                  <button type="button" onClick={handleUrl} disabled={!url.trim() || loading} className="text-sm text-stone-500 disabled:opacity-30 dark:text-stone-400">Add</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) handleImage(file); event.target.value = ""; }} />
    </div>
  );
}
