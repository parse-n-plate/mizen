"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ImageLightbox } from "@/components/ImageLightbox";
import { useRecipe } from "@/context/RecipeContext";
import { toast } from "sonner";
import { looksLikeRecipeUrl, detectCollectionUrl } from "@/utils/urlPatterns";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const TEXT_PASTE_MIN_LENGTH = 50;

// Heights for the morph transition
const PILL_HEIGHT = 60;
const TEXT_MIN_HEIGHT = 186;
const TEXT_MAX_HEIGHT = 400;

interface ImageFile {
  file: File;
  name: string;
  preview: string;
}

type BarMode = "idle" | "focused" | "loading" | "url" | "image" | "text";

function looksLikeUrl(str: string): boolean {
  const trimmed = str.trim();
  try {
    const u = new URL(trimmed);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function getMode(
  isLoading: boolean,
  url: string,
  imageFile: ImageFile | null,
  pastedText: string | null,
  isFocused: boolean
): BarMode {
  if (isLoading) return "loading";
  if (imageFile) return "image";
  if (pastedText) return "text";
  if (url.trim() && looksLikeUrl(url)) return "url";
  if (isFocused) return "focused";
  return "idle";
}

function extractDomain(urlStr: string): string {
  try {
    return new URL(urlStr).hostname.replace(/^www\./, "");
  } catch {
    return "link";
  }
}

function extractDishName(urlStr: string): string | null {
  try {
    const { pathname } = new URL(urlStr);
    // Find the last meaningful path segment (ignore trailing slash)
    const segments = pathname.split("/").filter(Boolean);
    const slug = segments.at(-1);
    if (!slug) return null;
    // Skip segments that look like IDs, dates, or generic paths
    if (/^\d+$/.test(slug) || /^\d{4}-\d{2}/.test(slug)) return null;
    // Convert slug to title case: "japanese-curry" → "Japanese Curry"
    const name = slug
      .replace(/\.[^.]+$/, "") // strip file extension
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
    return name.length > 1 ? name : null;
  } catch {
    return null;
  }
}

// ── Icon components ──────────────────────────────────────────────────────

function ImageIcon({ size = 20, stroke = "#A8A29E" }: { size?: number; stroke?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M3 16l5-5 4 4 3-3 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UpArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M9 3v12M9 3l-4 4M9 3l4 4"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      className="smart-bar-spinner"
      aria-hidden="true"
    >
      <circle
        cx="9"
        cy="9"
        r="7"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeDasharray="6 10"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
}

function CloseIcon({ size = 6 }: { size?: number }) {
  return (
    <svg
      width={size + 2}
      height={size + 2}
      viewBox="0 0 8 8"
      fill="none"
      style={{ width: size, height: size, flexShrink: 0 }}
      aria-hidden="true"
    >
      <path d="M2 2l4 4M6 2l-4 4" stroke="#FFFFFF" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function LinkPillIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#18A1F7"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#A8A29E"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function UrlChip({ url, onRemove }: { url: string; onRemove: () => void }) {
  const domain = extractDomain(url);
  const dishName = extractDishName(url);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;

  return (
    <div className="flex items-center gap-2 rounded-xl bg-stone-100 dark:bg-stone-800 pl-2.5 pr-1.5 py-1.5 group">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 min-w-0 hover:opacity-70 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={faviconUrl}
          alt=""
          width={16}
          height={16}
          className="rounded-[3px] shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="flex flex-col min-w-0 gap-0">
          <span className="text-[13px] font-medium leading-[17px] text-stone-700 dark:text-stone-200 truncate max-w-[240px]">
            {dishName ?? domain}
          </span>
          <span className="text-[11px] leading-[14px] text-stone-400 dark:text-stone-500 truncate">
            {domain}
          </span>
        </div>
      </a>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="flex items-center justify-center rounded-lg shrink-0 size-6 opacity-0 group-hover:opacity-100 hover:bg-stone-200 dark:hover:bg-stone-700 transition-opacity"
        aria-label="Remove URL"
      >
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
          <path d="M4 4l8 8M12 4l-8 8" stroke="#78716C" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

function ImagePillIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="9" height="9" rx="2" stroke="#18A1F7" strokeWidth="1.2" />
      <circle cx="4.5" cy="4.5" r="1" fill="#18A1F7" />
      <path
        d="M1.5 8.5l2.5-2.5 2 2 1.5-1.5 3 3v.5a2 2 0 01-2 2h-5a2 2 0 01-2-2v-.5z"
        fill="#18A1F7"
        opacity="0.3"
      />
    </svg>
  );
}

function TextPillIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 12 12"
      fill="none"
      style={{ flexShrink: 0 }}
      aria-hidden="true"
    >
      <path d="M2 3h8M2 6h6M2 9h4" stroke="#18A1F7" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────

function ThumbnailClose({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full bg-[#8A8A8A] hover:bg-[#7A7A7A] size-6 opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-150 ease-out z-10"
      aria-label="Remove"
    >
      <CloseIcon size={10} />
    </button>
  );
}

function ImageThumbnail({ src, onRemove }: { src: string; onRemove: () => void }) {
  const [lightbox, setLightbox] = useState<{ rect: DOMRect; el: HTMLElement } | null>(null);

  return (
    <>
      <div className="group/thumb relative flex rounded-xl overflow-visible shrink-0 bg-stone-100 dark:bg-stone-800 outline outline-1 outline-stone-200 dark:outline-stone-700 size-16 ">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Recipe"
          className="w-full h-full object-cover rounded-xl cursor-zoom-in"
          onClick={(e) =>
            setLightbox({ rect: e.currentTarget.getBoundingClientRect(), el: e.currentTarget })
          }
        />
        <ThumbnailClose onClick={onRemove} />
      </div>
      {lightbox && (
        <ImageLightbox
          src={src}
          alt="Attached image"
          sourceRect={lightbox.rect}
          sourceEl={lightbox.el}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}

function TextPreview({ text, onChange }: { text: string; onChange: (value: string) => void }) {
  return (
    <div className="pt-2.5 pb-1 px-5 grow min-h-0">
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Pasted recipe text"
        name="recipe-text"
        className="w-full h-full text-[14px] leading-[22px] text-stone-700 dark:text-stone-300 font-sans bg-transparent border-0 outline-none resize-none overflow-y-auto"
      />
    </div>
  );
}

function TypePill({ mode, text }: { mode: BarMode; text?: string | null }) {
  if (mode === "text") {
    const lines = text ? text.split("\n").length : 0;
    const chars = text ? text.length : 0;
    return (
      <div className="flex items-center shrink-0 rounded-[10px] py-2 px-3 gap-2 bg-[var(--color-blue-light)] dark:bg-blue-950/30">
        <TextPillIcon />
        <div className="flex flex-col">
          <span className="text-[12px] font-semibold leading-4 text-[var(--color-blue)]">
            Pasted text
          </span>
          <span className="text-[11px] leading-[15px] text-[#008FDF] dark:text-blue-400">
            {lines} {lines === 1 ? "line" : "lines"}, {chars.toLocaleString()} chars
          </span>
        </div>
      </div>
    );
  }

  const isUrl = mode === "url";
  return (
    <div className="flex items-center shrink-0 rounded-lg py-1 px-2.5 gap-[5px] bg-[var(--color-blue-light)] dark:bg-blue-950/30">
      {isUrl ? <LinkPillIcon /> : <ImagePillIcon />}
      <span className="text-[12px] font-semibold leading-4 text-[var(--color-blue)]">
        {isUrl ? "URL" : "Image"}
      </span>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────

export function Search({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [url, setUrl] = useState("");
  const [imageFile, setImageFile] = useState<ImageFile | null>(null);
  const [pastedText, setPastedText] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [clipboardUrl, setClipboardUrl] = useState<string | null>(null);
  const [dismissedUrl, setDismissedUrl] = useState<string | null>(null);
  const dragCounter = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textContentRef = useRef<HTMLDivElement>(null);
  const { setRecipe, setIsLoading, setError, isLoading } = useRecipe();
  const router = useRouter();

  // Track which mode was active before loading started
  const [preLoadMode, setPreLoadMode] = useState<BarMode>("idle");
  const [inlineError, setInlineError] = useState<string | null>(null);

  const mode = isLoading ? "loading" : getMode(false, url, imageFile, pastedText, isFocused);
  const displayMode = isLoading ? preLoadMode : mode;
  const isExpanded = displayMode === "text";

  // Compute container height
  const [textHeight, setTextHeight] = useState(TEXT_MIN_HEIGHT);
  useEffect(() => {
    if (displayMode === "text" && textContentRef.current) {
      const h = textContentRef.current.scrollHeight;
      setTextHeight(Math.max(TEXT_MIN_HEIGHT, Math.min(h, TEXT_MAX_HEIGHT)));
    }
  }, [displayMode, pastedText]);

  const containerHeight = isExpanded
    ? textHeight
    : displayMode === "image"
      ? undefined
      : PILL_HEIGHT;

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
        // Permission denied or unavailable
      }
    };

    checkClipboard();
    window.addEventListener("focus", checkClipboard);
    return () => window.removeEventListener("focus", checkClipboard);
  }, []);

  // Revoke object URL on unmount
  useEffect(() => {
    return () => {
      if (imageFile?.preview) {
        URL.revokeObjectURL(imageFile.preview);
      }
    };
  }, [imageFile]);

  const handleFile = useCallback(
    (file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error("Only JPEG, PNG, and WebP images are supported.");
        return;
      }
      if (file.size > MAX_SIZE) {
        toast.error("Image is too large (max 10 MB).");
        return;
      }
      setImageFile((prev) => {
        if (prev?.preview) URL.revokeObjectURL(prev.preview);
        return {
          file,
          name: file.name || "pasted-image",
          preview: URL.createObjectURL(file),
        };
      });
      setUrl("");
      setPastedText(null);
      setError(null);
    },
    [setError]
  );

  const clearContent = useCallback(() => {
    if (imageFile?.preview) URL.revokeObjectURL(imageFile.preview);
    setImageFile(null);
    setUrl("");
    setPastedText(null);
    setError(null);
    setInlineError(null);
    // Refocus the input after clearing
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [imageFile, setError]);

  // Drag handlers
  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
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

  // Paste handler — differentiates image, URL, and text
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
      // Text paste — check if it's a URL or plain text
      const text = e.clipboardData.getData("text/plain")?.trim();
      if (!text) return;

      // If it looks like a URL, set it directly (prevent default to avoid raw text in input)
      if (looksLikeUrl(text)) {
        e.preventDefault();
        setUrl(text);
        setPastedText(null);
        setImageFile(null);
        if (inlineError) setInlineError(null);
        return;
      }

      // Long text paste → text mode
      if (text.length >= TEXT_PASTE_MIN_LENGTH) {
        e.preventDefault();
        setPastedText(text);
        setUrl("");
        setImageFile(null);
      }
    },
    [handleFile, inlineError]
  );

  const submitUrl = useCallback(
    async (recipeUrl: string) => {
      if (isLoading) return;

      const collectionWarning = detectCollectionUrl(recipeUrl);
      if (collectionWarning) {
        toast.warning(`${collectionWarning} We'll still try parsing it.`);
      }

      setPreLoadMode(getMode(false, recipeUrl, null, null, true));
      setIsLoading(true);
      setError(null);
      setInlineError(null);

      try {
        const body = new FormData();
        body.append("url", recipeUrl);

        const response = await fetch("/api/parse", { method: "POST", body });
        const result = await response.json();

        if (result.success && result.data) {
          setRecipe(result.data);
          onSuccess?.();
          router.push("/recipe");
        } else {
          const msg = result.error || "Failed to parse recipe";
          toast.error(msg);
          setInlineError(msg);
        }
      } catch {
        const msg = "Something went wrong. Please try again.";
        toast.error(msg);
        setInlineError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, setIsLoading, setError, setRecipe, router, onSuccess]
  );

  const submitText = useCallback(
    async (text: string) => {
      if (isLoading) return;

      setPreLoadMode("text");
      setIsLoading(true);
      setError(null);
      setInlineError(null);

      try {
        const body = new FormData();
        body.append("text", text);

        const response = await fetch("/api/parse", { method: "POST", body });
        const result = await response.json();

        if (result.success && result.data) {
          setRecipe(result.data);
          onSuccess?.();
          router.push("/recipe");
        } else {
          const msg = result.error || "Failed to parse recipe";
          toast.error(msg);
          setInlineError(msg);
        }
      } catch {
        const msg = "Something went wrong. Please try again.";
        toast.error(msg);
        setInlineError(msg);
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
      setPreLoadMode("image");
      setIsLoading(true);
      setError(null);
      setInlineError(null);

      try {
        const body = new FormData();
        body.append("file", imageFile.file);

        const response = await fetch("/api/parse", { method: "POST", body });
        const result = await response.json();

        if (result.success && result.data) {
          setRecipe(result.data);
          onSuccess?.();
          router.push("/recipe");
        } else {
          const msg = result.error || "Failed to parse recipe";
          toast.error(msg);
          setInlineError(msg);
        }
      } catch {
        const msg = "Something went wrong. Please try again.";
        toast.error(msg);
        setInlineError(msg);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (pastedText) {
      submitText(pastedText);
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

  const hasInput = imageFile || pastedText || url.trim();
  const showPill =
    clipboardUrl &&
    clipboardUrl !== dismissedUrl &&
    !url &&
    !imageFile &&
    !pastedText &&
    !isLoading;

  const clipboardDomain = clipboardUrl ? extractDomain(clipboardUrl) : "";

  const showUrlInline = mode === "url" || (mode === "loading" && looksLikeUrl(url));
  const submitIsBlue = mode === "focused" || mode === "loading" || mode === "url" || !!inlineError;

  return (
    <div className="w-full max-w-xl flex flex-col items-center">
      <form ref={formRef} onSubmit={handleSubmit} className="w-full">
        <div
          className={`smart-bar w-full antialiased ${
            isDragging
              ? "rounded-[20px] border-2 border-dashed border-[var(--color-blue)] bg-[var(--color-blue-light)] dark:bg-blue-950/20"
              : `bg-white dark:bg-stone-900 [border-width:1.5px] border-solid ${
                  isExpanded || displayMode === "image"
                    ? "rounded-[20px] p-1 border-stone-200 dark:border-stone-700"
                    : "rounded-2xl border-stone-200 dark:border-stone-700"
                } ${
                  inlineError
                    ? "border-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.12)]"
                    : !isExpanded && mode === "loading"
                      ? "smart-bar-loading-ring"
                      : !isExpanded && mode === "focused"
                        ? "smart-bar-focus-ring"
                        : ""
                }`
          }`}
          style={{ height: isDragging ? 180 : containerHeight }}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          {/* ── Drop zone overlay ── */}
          {isDragging && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path
                  d="M16 6v14"
                  stroke="var(--color-blue)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M11 11l5-5 5 5"
                  stroke="var(--color-blue)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 15v8a2 2 0 01-2 2H12a2 2 0 01-2-2v-8"
                  stroke="var(--color-blue)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[15px] font-medium text-stone-700 dark:text-stone-300">
                  Drop your image here
                </span>
                <span className="text-[13px] text-stone-400 dark:text-stone-500">
                  JPEG, PNG, or WebP
                </span>
              </div>
            </div>
          )}

          {/* ── Pill mode (idle / focused / url / loading / error) ── */}
          {!isExpanded && displayMode !== "image" && !isDragging && (
            <div className="relative flex items-center h-[60px] pr-1.5 pl-2 gap-2">
              {/* URL chip when a URL is present */}
              {showUrlInline && !isLoading ? (
                <div
                  role="group"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" || e.key === "Delete") {
                      e.preventDefault();
                      clearContent();
                    }
                  }}
                  className="outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-blue)] focus-visible:ring-offset-2 rounded-xl min-w-0"
                  ref={(el) => el?.focus()}
                >
                  <UrlChip url={url.trim()} onRemove={clearContent} />
                </div>
              ) : (
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Paste a URL, text, or image…"
                  name="recipe-url"
                  autoComplete="off"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setPastedText(null);
                    if (inlineError) setInlineError(null);
                  }}
                  onPaste={onPaste}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className={`grow text-[15px] leading-[18px] bg-transparent border-0 outline-none placeholder:text-stone-300 dark:placeholder:text-stone-600 font-sans pl-3 ${
                    isLoading
                      ? "text-[var(--color-blue)] opacity-50"
                      : "text-stone-800 dark:text-stone-200"
                  }`}
                  disabled={isLoading}
                  autoFocus
                />
              )}

              <div className="flex items-center gap-1 shrink-0 ml-auto">
                {/* Clear button when URL is shown */}
                {showUrlInline && !isLoading && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearContent();
                    }}
                    className="flex items-center justify-center rounded-[10px] bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 shrink-0 size-10 transition-colors"
                    aria-label="Clear"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M4 4l8 8M12 4l-8 8"
                        stroke="#78716C"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                )}

                {/* Image + paperclip icons when idle/focused */}
                {!showUrlInline && !url.trim() && (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="flex items-center justify-center rounded-[10px] shrink-0 size-9 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-50"
                      aria-label="Upload image"
                    >
                      <ImageIcon />
                    </button>
                    {showPill && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center rounded-[10px] shrink-0 size-9 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                        aria-label="Attach file"
                      >
                        <PaperclipIcon />
                      </button>
                    )}
                  </>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={!hasInput || isLoading}
                  className={`press-scale flex items-center justify-center rounded-xl shrink-0 size-10 transition-[color,background-color,opacity,transform] ${
                    submitIsBlue
                      ? "bg-[var(--color-blue)] text-white"
                      : "bg-stone-200 dark:bg-stone-700 text-stone-500 dark:text-stone-400"
                  } disabled:opacity-50`}
                >
                  {isLoading ? <SpinnerIcon /> : <UpArrowIcon />}
                </button>
              </div>
            </div>
          )}

          {/* ── Image mode (single row: thumbnail + buttons) ── */}
          {displayMode === "image" && !isDragging && imageFile && (
            <div className="flex items-center h-full px-2 py-2 gap-2">
              <ImageThumbnail src={imageFile.preview} onRemove={clearContent} />
              <div className="flex items-center shrink-0 gap-1 ml-auto">
                {!isLoading && (
                  <button
                    type="button"
                    onClick={clearContent}
                    className="flex items-center justify-center rounded-[10px] bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 shrink-0 size-10 transition-colors"
                    aria-label="Clear"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M4 4l8 8M12 4l-8 8"
                        stroke="#78716C"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="press-scale flex items-center justify-center rounded-xl bg-[var(--color-blue)] text-white shrink-0 size-10 transition-[opacity,transform] disabled:opacity-60"
                >
                  {isLoading ? <SpinnerIcon /> : <UpArrowIcon />}
                </button>
              </div>
            </div>
          )}

          {/* ── Text mode (stacked: preview + bottom bar) ── */}
          {displayMode === "text" && !isDragging && (
            <div ref={textContentRef} className="flex flex-col h-full min-h-0">
              {pastedText && <TextPreview text={pastedText} onChange={setPastedText} />}
              <div className="flex items-center pt-1.5 pr-2 pb-2 pl-2.5 gap-1.5 mt-auto">
                <div className="flex items-center grow gap-1.5">
                  <TypePill mode="text" text={pastedText} />
                </div>
                <div className="flex items-center shrink-0 gap-1">
                  {!isLoading && (
                    <button
                      type="button"
                      onClick={clearContent}
                      className="flex items-center justify-center rounded-[10px] bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 shrink-0 size-10 transition-colors"
                      aria-label="Clear"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M4 4l8 8M12 4l-8 8"
                          stroke="#78716C"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="press-scale flex items-center justify-center rounded-xl bg-[var(--color-blue)] text-white shrink-0 size-10 transition-[opacity,transform] disabled:opacity-60"
                  >
                    {isLoading ? <SpinnerIcon /> : <UpArrowIcon />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Progress bar (loading) ── */}
        {isLoading && !isExpanded && (
          <div className="smart-bar-progress-track mt-3">
            <div className="smart-bar-progress-bar" />
          </div>
        )}

        {/* ── Inline error ── */}
        {inlineError && !isLoading && (
          <div className="flex items-center gap-1.5 mt-2 px-2">
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              className="shrink-0"
              aria-hidden="true"
            >
              <circle cx="8" cy="8" r="6.5" stroke="#EF4444" strokeWidth="1.2" />
              <path d="M8 5v3.5" stroke="#EF4444" strokeWidth="1.3" strokeLinecap="round" />
              <circle cx="8" cy="11" r="0.75" fill="#EF4444" />
            </svg>
            <span className="text-[13px] font-medium text-red-500">{inlineError}</span>
          </div>
        )}

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

      {/* ── Clipboard suggestion pill ── */}
      {showPill && (
        <div className="flex items-center rounded-full border border-stone-200 dark:border-stone-700 pl-4 pr-1.5 py-2 mt-4 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
          <button
            type="button"
            onClick={handleClipboardPaste}
            className="flex items-center text-[14px] leading-[22px]"
          >
            <span className="text-stone-400 dark:text-stone-500">Paste</span>
            <span className="text-[var(--color-blue)]">&nbsp;{clipboardDomain}</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDismissedUrl(clipboardUrl);
            }}
            className="ml-0.5 flex size-6 items-center justify-center rounded-full transition-colors hover:bg-stone-100 dark:hover:bg-stone-700"
            aria-label="Dismiss"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#78716C"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
