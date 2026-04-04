"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AltArrowLeft from "@solar-icons/react/csr/arrows/AltArrowLeft";
import CloseCircle from "@solar-icons/react/csr/ui/CloseCircle";
import CloseSquare from "@solar-icons/react/csr/ui/CloseSquare";
import AddCircle from "@solar-icons/react/csr/ui/AddCircle";
import Gallery from "@solar-icons/react/csr/video/Gallery";
import ChatRoundDots from "@solar-icons/react/csr/messages/ChatRoundDots";
import Bug from "@solar-icons/react/csr/it/Bug";
import Lightbulb from "@solar-icons/react/csr/devices/Lightbulb";
import Heart from "@solar-icons/react/csr/like/Heart";
import { useRecipe } from "@/context/RecipeContext";
import { useUser } from "@/hooks/useUser";

const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

type FeedbackCategory = "bug" | "idea" | "feedback";

const CATEGORIES: {
  id: FeedbackCategory;
  label: string;
  description: string;
  icon: typeof Bug;
}[] = [
  { id: "bug", label: "Bug Report", description: "Something isn't working correctly", icon: Bug },
  {
    id: "idea",
    label: "Feature Idea",
    description: "Suggest a new feature or improvement",
    icon: Lightbulb,
  },
  {
    id: "feedback",
    label: "General Feedback",
    description: "Share your thoughts or experience",
    icon: Heart,
  },
];

interface FeedbackDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

export function FeedbackDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  showTrigger = true,
}: FeedbackDialogProps = {}) {
  const { user } = useUser();
  const { recipe } = useRecipe();
  const pathname = usePathname();

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [description, setDescription] = useState("");
  const [includeRecipe, setIncludeRecipe] = useState(true);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isOnRecipePage = pathname === "/recipe";
  const hasRecipeContext = isOnRecipePage && !!recipe;

  const recipeDomain = (() => {
    if (!recipe?.sourceUrl) return "";
    try {
      return new URL(recipe.sourceUrl).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  })();

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

    setImages((prev) => [...prev, ...toAdd]);
    setPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);

    if (fileRef.current) fileRef.current.value = "";
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(previews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setCategory(null);
    setDescription("");
    setIncludeRecipe(true);
    setImages([]);
    previews.forEach(URL.revokeObjectURL);
    setPreviews([]);
    setSubmitting(false);
  }

  async function handleSubmit() {
    if (!description.trim() || !category || submitting) return;
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("description", description.trim());
      formData.append("category", category);
      formData.append("reporterEmail", user?.email || "");
      formData.append("deviceOS", navigator.userAgent);

      if (hasRecipeContext && includeRecipe) {
        formData.append("feedbackType", "recipe");
        formData.append("recipeTitle", recipe.title || "Untitled");
        formData.append("sourceUrl", recipe.sourceUrl || "");
      } else {
        formData.append("feedbackType", "general");
      }

      for (const img of images) {
        formData.append("images", img);
      }

      const res = await fetch("/api/feedback", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit feedback");
      }

      toast.success("Feedback submitted — thank you!");
      resetForm();
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForm();
        setOpen(next);
      }}
    >
      {showTrigger && (
        <DialogTrigger asChild>
          <button
            type="button"
            className={`fixed right-5 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-[#18A1F7] text-white shadow-lg transition-transform duration-200 hover:scale-110 sm:right-6 ${
              isOnRecipePage
                ? "bottom-[calc(env(safe-area-inset-bottom)+5rem)] sm:bottom-6"
                : "bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:bottom-6"
            }`}
            aria-label="Send feedback"
          >
            <ChatRoundDots size={20} />
          </button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-md">
        {!category ? (
          /* ── Step 1: Category picker ── */
          <div className="flex flex-col gap-4 h-[288px]">
            <DialogHeader>
              <DialogTitle>Send us a message</DialogTitle>
              <DialogDescription>We&apos;ll respond asap!</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2 flex-1 justify-center">
              {CATEGORIES.map(({ id, label, description: desc, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCategory(id)}
                  className="flex items-center gap-3 rounded-xl bg-[#FAFAF9] dark:bg-stone-800 px-4 py-3.5 text-left transition-colors duration-200 ease-out hover:bg-stone-100 dark:hover:bg-stone-700"
                >
                  <Icon
                    size={20}
                    weight="Bold"
                    className="text-stone-600 dark:text-stone-400 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium font-sans text-stone-800 dark:text-stone-200">
                      {label}
                    </p>
                    <p className="text-xs font-sans text-stone-500 dark:text-stone-400">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ── Step 2: Feedback form ── */
          <div className="flex flex-col gap-4 min-h-[288px]">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCategory(null)}
                  className="flex items-center justify-center rounded-lg size-7 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors duration-200 ease-out -ml-1"
                  aria-label="Back to categories"
                >
                  <AltArrowLeft size={14} />
                </button>
                <DialogTitle>{CATEGORIES.find((c) => c.id === category)?.label}</DialogTitle>
              </div>
              <DialogDescription>
                {category === "bug"
                  ? "Describe what happened and what you expected."
                  : category === "idea"
                    ? "Tell us about your idea."
                    : "Share your thoughts with us."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2 flex-1 min-h-0">
              {/* Textarea with inline attach button */}
              <div className="flex flex-col rounded-md border border-input shadow-xs transition-[color,box-shadow] focus-within:border-[#18A1F7] focus-within:ring-[3px] focus-within:ring-[#18A1F7]/25">
                <textarea
                  placeholder={
                    category === "bug"
                      ? "What went wrong?"
                      : category === "idea"
                        ? "What would you like to see?"
                        : "What's on your mind?"
                  }
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                  rows={3}
                  autoFocus
                  className="w-full resize-none rounded-t-md bg-transparent p-3 text-sm placeholder:text-muted-foreground outline-none"
                />
                <div className="flex items-center justify-between px-2 pb-2">
                  <span className="text-xs text-stone-400 dark:text-stone-500 pl-1">
                    {description.length}/1000
                  </span>
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
                      className="relative w-16 h-16 rounded-md overflow-hidden border border-stone-200 dark:border-stone-700"
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
            </div>

            <div className="flex items-center gap-3 pt-1">
              {/* Recipe context card */}
              {hasRecipeContext && includeRecipe ? (
                <div className="flex flex-1 items-center gap-3 rounded-lg bg-stone-100 dark:bg-stone-800 px-3 py-2 group">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-stone-200 dark:bg-stone-700 text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase overflow-hidden">
                    {recipe.sourceUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(recipeDomain)}&sz=32`}
                        alt=""
                        width={20}
                        height={20}
                        className="rounded-[2px]"
                        onError={(e) => {
                          const el = e.target as HTMLImageElement;
                          el.style.display = "none";
                          el.parentElement!.textContent = recipeDomain.slice(0, 2);
                        }}
                      />
                    ) : (
                      recipe.title.slice(0, 2)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                      {recipe.title}
                    </p>
                    {recipeDomain && (
                      <p className="truncate text-xs text-stone-400 dark:text-stone-500">
                        {recipeDomain}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIncludeRecipe(false)}
                    className="flex items-center justify-center rounded-lg shrink-0 size-6 opacity-0 group-hover:opacity-100 hover:bg-stone-200 dark:hover:bg-stone-700 transition-opacity duration-200"
                    aria-label="Remove recipe attachment"
                  >
                    <CloseSquare size={12} className="text-stone-500" />
                  </button>
                </div>
              ) : hasRecipeContext ? (
                <button
                  type="button"
                  onClick={() => setIncludeRecipe(true)}
                  className="flex flex-1 items-center gap-2 rounded-lg border border-dashed border-stone-300 dark:border-stone-600 px-3 py-2 transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/50"
                >
                  <AddCircle size={16} className="text-stone-400 flex-shrink-0" />
                  <span className="text-[13px] font-sans text-stone-400 dark:text-stone-500 truncate">
                    Attach current recipe
                  </span>
                </button>
              ) : (
                <div className="flex-1" />
              )}

              <Button
                onClick={handleSubmit}
                disabled={!description.trim() || submitting}
                className="bg-[#18A1F7] hover:bg-[#0d8de0] text-white"
              >
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
