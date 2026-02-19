"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useRecipe } from "@/context/RecipeContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

export function Search() {
  const [url, setUrl] = useState("");
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const { setRecipe, setIsLoading, setError, isLoading } =
    useRecipe();
  const router = useRouter();

  const handleFile = useCallback(
    async (file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Only JPEG, PNG, and WebP images are supported.");
        return;
      }
      if (file.size > MAX_SIZE) {
        setError("Image is too large (max 10 MB).");
        return;
      }
      try {
        const img = await fileToImageFile(file);
        setImageFile(img);
        setUrl("");
        setError(null);
      } catch {
        setError("Failed to read image.");
      }
    },
    [setError]
  );

  const removeImage = useCallback(() => {
    if (imageFile) {
      URL.revokeObjectURL(imageFile.preview);
      setImageFile(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!imageFile && !url.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const body = imageFile
        ? { image: imageFile.base64, mimeType: imageFile.mimeType }
        : { url: url.trim() };

      const response = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setRecipe(result.data);
        router.push("/recipe");
      } else {
        setError(result.error || "Failed to parse recipe");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const hasInput = imageFile || url.trim();

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div
        className={`rounded-2xl border bg-white shadow-sm transition-all focus-within:border-stone-300 focus-within:shadow-md ${
          isDragging
            ? "border-[var(--color-blue)] ring-2 ring-[var(--color-blue)]/20"
            : "border-stone-200"
        }`}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {/* Input area */}
        <div className="px-4 pt-3 pb-2">
          {isDragging ? (
            <p className="py-1 text-sm text-[var(--color-blue)]">
              Drop image here...
            </p>
          ) : (
            <Input
              type="url"
              placeholder="Paste a recipe URL or drop an image..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (imageFile) removeImage();
              }}
              onPaste={onPaste}
              className="border-0 bg-transparent px-0 text-base shadow-none placeholder:text-stone-400 focus-visible:ring-0"
              disabled={isLoading || !!imageFile}
              autoFocus
            />
          )}
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-1">
            {imageFile ? (
              <div className="flex h-8 items-center gap-2 rounded-lg bg-stone-100 px-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageFile.preview}
                  alt="Recipe"
                  className="h-5 w-5 rounded object-cover"
                />
                <span className="max-w-[160px] truncate text-xs font-medium text-stone-600">
                  {imageFile.name}
                </span>
                <button
                  type="button"
                  onClick={removeImage}
                  className="ml-0.5 text-stone-400 hover:text-stone-600"
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
              <div className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-stone-400">
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
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <span className="text-xs font-medium text-stone-500">URL</span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            size="icon"
            disabled={!hasInput || isLoading}
            className="h-8 w-8 rounded-lg bg-[var(--color-blue)] transition-opacity hover:bg-[var(--color-blue)]/90 disabled:opacity-30"
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
    </form>
  );
}
