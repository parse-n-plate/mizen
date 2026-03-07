"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useRecipe } from "@/context/RecipeContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import GalleryAdd from "@solar-icons/react/csr/video/GalleryAdd";
import { looksLikeRecipeUrl, detectCollectionUrl } from "@/utils/urlPatterns";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

interface ImageFile {
  base64: string;
  mimeType: string;
  name: string;
  preview: string; // object URL for thumbnail
}

function fileToImageFile(file: File): Promise<ImageFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Strip "data:<mime>;base64," prefix
      const base64 = dataUrl.split(",")[1];
      resolve({
        base64,
        mimeType: file.type,
        name: file.name || "pasted-image",
        preview: URL.createObjectURL(file),
      });
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function Search({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [url, setUrl] = useState("");
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [clipboardUrl, setClipboardUrl] = useState<string | null>(null);
  const [dismissedUrl, setDismissedUrl] = useState<string | null>(null);
  const dragCounter = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const { setRecipe, setIsLoading, setError, isLoading } = useRecipe();
  const router = useRouter();

  // Clipboard URL detection
  useEffect(() => {
    const checkClipboard = async () => {
      try {
        const text = await navigator.clipboard.readText();
        const trimmed = text?.trim();
        if (trimmed && looksLikeRecipeUrl(trimmed)) {
          setClipboardUrl(trimmed);
        } else {
          setClipboardUrl(null);
        }
      } catch {
        // Permission denied or unavailable — silently skip
      }
    };

    checkClipboard();
    window.addEventListener("focus", checkClipboard);
    return () => window.removeEventListener("focus", checkClipboard);
  }, []);

  // Revoke current object URL when component unmounts.
  useEffect(() => {
    return () => {
      if (imageFile?.preview) {
        URL.revokeObjectURL(imageFile.preview);
      }
    };
  }, [imageFile]);

  const handleFile = useCallback(
    async (file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error("Only JPEG, PNG, and WebP images are supported.");
        return;
      }
      if (file.size > MAX_SIZE) {
        toast.error("Image is too large (max 10 MB).");
        return;
      }
      try {
        const img = await fileToImageFile(file);
        setImageFile((prev) => {
          if (prev?.preview) {
            URL.revokeObjectURL(prev.preview);
          }
          return img;
        });
        setUrl("");
        setError(null);
      } catch {
        toast.error("Failed to read image.");
      }
    },
    [setError]
  );

  const removeImage = useCallback(() => {
    if (!imageFile) return;

    const clearImage = () => {
      URL.revokeObjectURL(imageFile.preview);
      setImageFile(null);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      clearImage();
      return;
    }

    const el = pillRef.current;
    if (el) {
      el.classList.remove("image-pill-animate");
      el.classList.add("image-pill-exit");

      let done = false;
      const onEnd = () => {
        if (done) return;
        done = true;
        el.removeEventListener("animationend", onEnd);
        window.clearTimeout(fallbackTimeout);
        clearImage();
      };

      const fallbackTimeout = window.setTimeout(onEnd, 220);
      el.addEventListener("animationend", onEnd);
    } else {
      clearImage();
    }
  }, [imageFile]);

  // Drag handlers
  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      dragCounter.current = 0;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // Paste handler
  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) handleFile(file);
          return;
        }
      }
      // If no image, let the default paste (URL text) happen
    },
    [handleFile]
  );

  const submitUrl = useCallback(
    async (recipeUrl: string) => {
      if (isLoading) return;

      const collectionWarning = detectCollectionUrl(recipeUrl);
      if (collectionWarning) {
        toast.warning(`${collectionWarning} We'll still try parsing it.`);
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: recipeUrl }),
        });

        const result = await response.json();

        if (result.success && result.data) {
          setRecipe(result.data);
          onSuccess?.();
          router.push("/recipe");
        } else {
          toast.error(result.error || "Failed to parse recipe");
        }
      } catch {
        toast.error("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, setIsLoading, setError, setRecipe, router, onSuccess]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (imageFile) {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: imageFile.base64,
            mimeType: imageFile.mimeType,
          }),
        });

        const result = await response.json();

        if (result.success && result.data) {
          setRecipe(result.data);
          onSuccess?.();
          router.push("/recipe");
        } else {
          toast.error(result.error || "Failed to parse recipe");
        }
      } catch {
        toast.error("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (url.trim()) {
      submitUrl(url.trim());
    }
  };

  const handleClipboardPaste = () => {
    if (!clipboardUrl || isLoading) return;
    setUrl(clipboardUrl);
    setClipboardUrl(null);
    submitUrl(clipboardUrl);
  };

  const hasInput = imageFile || url.trim();
  const showPill =
    clipboardUrl && clipboardUrl !== dismissedUrl && !url && !imageFile && !isLoading;

  let clipboardDomain = "";
  if (clipboardUrl) {
    try {
      clipboardDomain = new URL(clipboardUrl).hostname.replace(/^www\./, "");
    } catch {
      clipboardDomain = "link";
    }
  }

  return (
    <div className="w-full max-w-3xl flex flex-col items-center">
      {showPill &&
        createPortal(
          <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className="clipboard-pill-animate pointer-events-auto flex items-center gap-1 rounded-full bg-stone-900 pl-4 pr-1.5 py-2 shadow-lg dark:bg-stone-100">
              <button
                type="button"
                onClick={handleClipboardPaste}
                className="flex items-center gap-2 text-sm font-medium text-white dark:text-stone-900 whitespace-nowrap"
              >
                Paste {clipboardDomain}
                <svg
                  className="h-3.5 w-3.5 opacity-50"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDismissedUrl(clipboardUrl);
                }}
                className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-700 hover:text-white dark:text-stone-500 dark:hover:bg-stone-300 dark:hover:text-stone-900"
                aria-label="Dismiss"
              >
                <svg
                  className="h-3 w-3"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          </div>,
          document.body
        )}
      <form ref={formRef} onSubmit={handleSubmit} className="w-full">
        <div
          className={`w-full rounded-2xl border bg-white dark:bg-transparent shadow-sm transition-all focus-within:border-stone-300 dark:focus-within:border-stone-600 focus-within:shadow-md ${
            isDragging
              ? "border-[var(--color-blue)] ring-2 ring-[var(--color-blue)]/20"
              : "border-stone-200 dark:border-stone-700"
          }`}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          {/* Input area */}
          <div className="flex items-center h-9 px-4 mt-3 mb-2">
            {isDragging ? (
              <p className="text-sm text-[var(--color-blue)]">Drop image here...</p>
            ) : imageFile ? (
              <div
                ref={pillRef}
                className="image-pill-animate flex items-center gap-2 rounded-lg bg-stone-100 dark:bg-stone-800 px-2 py-1 w-fit"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageFile.preview}
                  alt="Recipe"
                  className="h-5 w-5 rounded object-cover"
                />
                <span className="max-w-[200px] truncate text-sm font-medium text-stone-600 dark:text-stone-300">
                  {imageFile.name}
                </span>
                <button
                  type="button"
                  onClick={removeImage}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                  aria-label="Remove image"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <Input
                type="url"
                placeholder="Paste a recipe URL or drop an image..."
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                }}
                onPaste={onPaste}
                className="border-0 bg-transparent dark:bg-transparent px-0 text-base shadow-none placeholder:text-stone-400 dark:placeholder:text-stone-500 dark:text-stone-100 focus-visible:ring-0"
                disabled={isLoading}
                autoFocus
              />
            )}
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="press-scale flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 duration-0 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-300 disabled:opacity-50"
                aria-label="Upload image"
              >
                <GalleryAdd size={18} />
              </button>
            </div>

            <Button
              type="submit"
              size="icon"
              disabled={!hasInput || isLoading}
              className="press-scale h-8 w-8 rounded-lg bg-[var(--color-blue)] transition-opacity hover:bg-[var(--color-blue)]/90 disabled:opacity-30"
            >
              {isLoading ? (
                <svg
                  className="h-4 w-4 animate-spin"
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
              ) : (
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              )}
            </Button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </form>
    </div>
  );
}
