"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { toBlob, toPng } from "html-to-image";
import { toast } from "sonner";
import DownloadMinimalistic from "@solar-icons/react/csr/arrows-action/DownloadMinimalistic";
import Copy from "@solar-icons/react/csr/ui/Copy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SUNSET_EXAMPLE_RECIPES } from "@/lib/sunset-example-recipe";
import { SUNSET_SHUTDOWN_DATE } from "@/lib/sunset";
import { cn } from "@/lib/utils";
import {
  STAGE_BACKGROUNDS,
  StageshowTemplate,
  SunsetTemplate,
  X_POST_SIZES,
  type StageBackgroundId,
  type XPostSizeId,
} from "./templates";

type TemplateId = "sunset" | "stageshow";

const TEMPLATES: { id: TemplateId; label: string; description: string }[] = [
  {
    id: "sunset",
    label: "Sunset announcement",
    description: "The landing page hero, reframed for X with the sunsetting headline.",
  },
  {
    id: "stageshow",
    label: "Recipe stageshow",
    description: "The recipe page on mobile and desktop, staged and cropped at the edges.",
  },
];

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex flex-wrap gap-1 rounded-lg bg-stone-100 p-1 dark:bg-stone-800"
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-3 py-1.5 font-sans text-sm font-medium transition-none",
            value === option.value
              ? "bg-white text-stone-900 shadow-sm dark:bg-stone-950 dark:text-stone-100"
              : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-sans text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
        {label}
      </span>
      {children}
    </label>
  );
}

/** Scales a fixed-size canvas down to fit its container's width. */
function ScaledPreview({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(width);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = Math.min(1, containerWidth / width);

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="mx-auto overflow-hidden rounded-xl ring-1 ring-stone-200 dark:ring-stone-800"
        style={{ width: width * scale, height: height * scale }}
      >
        <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function XPostStudio() {
  const [template, setTemplate] = useState<TemplateId>("sunset");
  const [size, setSize] = useState<XPostSizeId>("landscape");
  const [recipeIndex, setRecipeIndex] = useState(0);
  const [headlineTop, setHeadlineTop] = useState("Sunsetting");
  const [headlineBottom, setHeadlineBottom] = useState("Mizen.");
  const [subhead, setSubhead] = useState(
    `Thanks for cooking with us. Save your recipes before ${SUNSET_SHUTDOWN_DATE}.`
  );
  const [showFooter, setShowFooter] = useState(false);
  const [showSunsetBrand, setShowSunsetBrand] = useState(false);
  const [showSky, setShowSky] = useState(false);
  const [background, setBackground] = useState<StageBackgroundId>("sky");
  const [showBrand, setShowBrand] = useState(false);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const dims = X_POST_SIZES[size];
  const recipe = SUNSET_EXAMPLE_RECIPES[recipeIndex];
  const fileName = `mizen-x-${template}-${size}.png`;

  async function render<T>(fn: typeof toPng | typeof toBlob): Promise<T | null> {
    const node = canvasRef.current;
    if (!node) return null;
    await document.fonts.ready;
    return (await fn(node, {
      pixelRatio: dims.exportScale,
      width: dims.width,
      height: dims.height,
      cacheBust: true,
    })) as T;
  }

  async function handleDownload() {
    setBusy(true);
    try {
      const dataUrl = await render<string>(toPng);
      if (!dataUrl) return;
      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    } catch {
      toast.error("Couldn’t export the image.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    setBusy(true);
    try {
      const blob = await render<Blob>(toBlob);
      if (!blob) return;
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("Image copied. Paste it into your post.");
    } catch {
      toast.error("Couldn’t copy the image. Try downloading it instead.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          label="Template"
          value={template}
          onChange={setTemplate}
          options={TEMPLATES.map((t) => ({ value: t.id, label: t.label }))}
        />
        <Segmented
          label="Size"
          value={size}
          onChange={setSize}
          options={(Object.keys(X_POST_SIZES) as XPostSizeId[]).map((id) => ({
            value: id,
            label: X_POST_SIZES[id].label,
          }))}
        />
      </div>

      <p className="font-sans text-sm text-stone-500 dark:text-stone-400">
        {TEMPLATES.find((t) => t.id === template)?.description} The image follows the site theme, so
        use the moon/sun toggle above for a dark version.
      </p>

      <ScaledPreview width={dims.width} height={dims.height}>
        <div ref={canvasRef} style={{ width: dims.width, height: dims.height }}>
          {template === "sunset" ? (
            <SunsetTemplate
              size={size}
              recipe={recipe}
              headlineTop={headlineTop}
              headlineBottom={headlineBottom}
              subhead={subhead}
              showFooter={showFooter}
              showBrand={showSunsetBrand}
              showSky={showSky}
            />
          ) : (
            <StageshowTemplate
              size={size}
              recipe={recipe}
              background={background}
              showBrand={showBrand}
            />
          )}
        </div>
      </ScaledPreview>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleDownload} disabled={busy}>
          <DownloadMinimalistic size={16} />
          Download PNG
        </Button>
        <Button variant="secondary" onClick={handleCopy} disabled={busy}>
          <Copy size={16} />
          Copy image
        </Button>
      </div>

      <div className="grid gap-5 rounded-xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900 sm:grid-cols-2">
        <Field label="Recipe">
          <Segmented
            label="Recipe"
            value={String(recipeIndex)}
            onChange={(value) => setRecipeIndex(Number(value))}
            options={SUNSET_EXAMPLE_RECIPES.map((r, i) => ({ value: String(i), label: r.title }))}
          />
        </Field>

        {template === "sunset" ? (
          <>
            <Field label="Headline line 1">
              <Input value={headlineTop} onChange={(e) => setHeadlineTop(e.target.value)} />
            </Field>
            <Field label="Headline line 2">
              <Input value={headlineBottom} onChange={(e) => setHeadlineBottom(e.target.value)} />
            </Field>
            <Field label="Subhead">
              <Textarea rows={2} value={subhead} onChange={(e) => setSubhead(e.target.value)} />
            </Field>
            <label className="flex items-center gap-3 font-sans text-sm text-stone-700 dark:text-stone-300">
              <Switch checked={showFooter} onCheckedChange={setShowFooter} />
              Show &ldquo;Cooked with love by&rdquo;
            </label>
            <label className="flex items-center gap-3 font-sans text-sm text-stone-700 dark:text-stone-300">
              <Switch checked={showSunsetBrand} onCheckedChange={setShowSunsetBrand} />
              Show Mizen logo
            </label>
            <label className="flex items-center gap-3 font-sans text-sm text-stone-700 dark:text-stone-300">
              <Switch checked={showSky} onCheckedChange={setShowSky} />
              Show sky gradient
            </label>
          </>
        ) : (
          <>
            <Field label="Background">
              <Segmented
                label="Background"
                value={background}
                onChange={setBackground}
                options={(Object.keys(STAGE_BACKGROUNDS) as StageBackgroundId[]).map((id) => ({
                  value: id,
                  label: STAGE_BACKGROUNDS[id].label,
                }))}
              />
            </Field>
            <label className="flex items-center gap-3 font-sans text-sm text-stone-700 dark:text-stone-300">
              <Switch checked={showBrand} onCheckedChange={setShowBrand} />
              Show Mizen logo
            </label>
          </>
        )}
      </div>
    </div>
  );
}
