"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CloseCircle from "@solar-icons/react/csr/ui/CloseCircle";
import Gallery from "@solar-icons/react/csr/video/Gallery";
import type { ParsedRecipe } from "@/lib/types";

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function buildDebugInfo(recipe: ParsedRecipe | null, activeTab: string, unitSystem: string) {
  if (!recipe) return {};
  const totalIngredients = recipe.ingredients.reduce((n, g) => n + g.ingredients.length, 0);
  return {
    title: recipe.title,
    sourceUrl: recipe.sourceUrl || null,
    servings: recipe.servings ?? null,
    prepTime: recipe.prepTimeMinutes ?? null,
    cookTime: recipe.cookTimeMinutes ?? null,
    totalTime: recipe.totalTimeMinutes ?? null,
    ingredientGroups: recipe.ingredients.length,
    totalIngredients,
    stepCount: recipe.instructions.length,
    steps: recipe.instructions.map((s, i) => ({
      step: i + 1,
      title: s.title,
      detail: s.detail,
      ...(s.timeMinutes != null && { timeMinutes: s.timeMinutes }),
      ...(s.ingredients?.length && { ingredients: s.ingredients }),
    })),
    activeTab,
    unitSystem,
  };
}

interface ReportRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: ParsedRecipe | null;
  userEmail: string;
  activeTab: string;
  unitSystem: string;
}

export function ReportRecipeDialog({
  open,
  onOpenChange,
  recipe,
  userEmail,
  activeTab,
  unitSystem,
}: ReportRecipeDialogProps) {
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const debugInfo = useMemo(
    () => buildDebugInfo(recipe, activeTab, unitSystem),
    [recipe, activeTab, unitSystem]
  );

  function handleImageAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - images.length;
    const toAdd = files.slice(0, remaining);

    for (const file of toAdd) {
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error("Image too large (max 5 MB)");
        return;
      }
    }

    const newImages = [...images, ...toAdd];
    setImages(newImages);
    setPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);

    // Reset input so same file can be re-selected
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(previews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setDescription("");
    setImages([]);
    previews.forEach(URL.revokeObjectURL);
    setPreviews([]);
    setSubmitting(false);
  }

  async function handleSubmit() {
    if (!description.trim() || submitting) return;
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("description", description.trim());
      formData.append("recipeTitle", recipe?.title || "Untitled");
      formData.append("sourceUrl", recipe?.sourceUrl || "");
      formData.append("reporterEmail", userEmail);
      formData.append("deviceOS", navigator.userAgent);
      formData.append("activeTab", activeTab);
      formData.append("unitSystem", unitSystem);
      formData.append("debugInfo", JSON.stringify(debugInfo));
      for (const img of images) {
        formData.append("images", img);
      }

      const res = await fetch("/api/feedback", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit report");
      }

      toast.success("Report submitted — thanks for the feedback!");
      resetForm();
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit report. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForm();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md gap-4">
        <DialogHeader>
          <DialogTitle>Report an issue</DialogTitle>
          <DialogDescription>Let us know what went wrong with this recipe.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {/* Textarea with inline attach button */}
          <div className="flex flex-col rounded-md border border-input shadow-xs transition-[color,box-shadow] focus-within:border-[var(--color-blue)] focus-within:ring-[3px] focus-within:ring-[var(--color-blue)]/20">
            <textarea
              placeholder="Describe the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
              rows={3}
              autoFocus
              className="w-full resize-none rounded-t-md bg-transparent p-3 text-sm placeholder:text-muted-foreground outline-none"
            />
            <div className="flex items-center justify-end px-2 pb-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={handleImageAdd}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={images.length >= MAX_IMAGES}
                aria-label="Attach image"
                className="flex items-center justify-center size-8 rounded-md text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-40"
              >
                <Gallery size={18} className="size-[18px] shrink-0" />
              </button>
            </div>
          </div>

          {/* Image previews */}
          {previews.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {previews.map((src, i) => (
                <div
                  key={src}
                  className="relative w-16 h-16 rounded-md overflow-hidden border border-stone-200 dark:border-stone-700 animate-in fade-in zoom-in-95 duration-150"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`Attachment ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-1 -right-1 bg-white dark:bg-stone-800 rounded-full shadow-sm"
                    aria-label={`Remove image ${i + 1}`}
                  >
                    <CloseCircle size={18} className="text-stone-500" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <span className="text-xs text-stone-400 dark:text-stone-500">
            {description.length}/1000
          </span>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3">
          {/* Recipe context card */}
          {recipe && (
            <div className="flex flex-1 items-center gap-3 rounded-lg bg-stone-100 dark:bg-stone-800 px-3 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-stone-200 dark:bg-stone-700 text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase">
                {(recipe.sourceUrl
                  ? safeHostname(recipe.sourceUrl).split(".").slice(-2, -1)[0] || recipe.title
                  : recipe.title
                ).slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                  {recipe.title}
                </p>
                {recipe.sourceUrl && safeHostname(recipe.sourceUrl) && (
                  <p className="truncate text-xs text-stone-400 dark:text-stone-500">
                    {safeHostname(recipe.sourceUrl)}
                  </p>
                )}
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!description.trim() || submitting}
            className="bg-[var(--color-blue)] hover:bg-[var(--color-blue)]/90 text-white w-full sm:w-auto"
          >
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
