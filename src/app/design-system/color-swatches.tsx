"use client";

import { useState } from "react";
import { toast } from "sonner";
import SolarCopy from "@solar-icons/react/csr/ui/Copy";

type CopyValueButtonProps = {
  value: string;
};

export type ColorToken = {
  name: string;
  token: string;
  value: string;
  usage: string;
  displayColor?: string;
};

export type ModeColorToken = {
  token: string;
  usage: string;
  light: string;
  dark: string;
  lightDisplayColor?: string;
  darkDisplayColor?: string;
};

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to the legacy copy path when clipboard permissions reject the write.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Copy command failed");
  }
}

function isHex(value: string) {
  return /^#[0-9a-f]{3,8}$/i.test(value);
}

function getSwatchStyle(value: string) {
  if (value === "transparent") {
    return {
      backgroundColor: "#ffffff",
      backgroundImage:
        "linear-gradient(45deg, #d6d3d1 25%, transparent 25%), linear-gradient(-45deg, #d6d3d1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d6d3d1 75%), linear-gradient(-45deg, transparent 75%, #d6d3d1 75%)",
      backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
      backgroundSize: "16px 16px",
    };
  }

  return { backgroundColor: value };
}

function CopyValueButton({ value }: CopyValueButtonProps) {
  const [copied, setCopied] = useState(false);
  const label = isHex(value) ? "Copy hex" : "Copy value";

  const handleCopy = async () => {
    try {
      await copyText(value);
      setCopied(true);
      toast.success(`Copied ${value}`);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error("Failed to copy value");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 font-mono text-xs text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300 dark:hover:border-stone-700 dark:hover:bg-stone-900"
      aria-label={`${label} ${value}`}
    >
      <span>{value}</span>
      <SolarCopy size={14} aria-hidden="true" />
      <span className="sr-only">{copied ? "Copied" : label}</span>
    </button>
  );
}

function SwatchBox({ value }: { value: string }) {
  return (
    <span
      className="h-11 w-11 shrink-0 rounded-lg border border-stone-200 shadow-inner dark:border-stone-700"
      style={getSwatchStyle(value)}
      aria-hidden="true"
    />
  );
}

function ModeValue({
  label,
  value,
  displayColor,
}: {
  label: string;
  value: string;
  displayColor?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
      <SwatchBox value={displayColor ?? value} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-stone-500 dark:text-stone-400">
          {label}
        </p>
        <div className="mt-1">
          <CopyValueButton value={value} />
        </div>
      </div>
    </div>
  );
}

export function ColorTokenList({ colors }: { colors: ColorToken[] }) {
  return (
    <div className="space-y-3">
      {colors.map((color) => (
        <div
          key={color.token}
          className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <SwatchBox value={color.displayColor ?? color.value} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="font-medium text-stone-900 dark:text-stone-100">{color.name}</p>
                <code className="rounded-md bg-stone-100 px-1.5 py-0.5 font-mono text-[13px] text-stone-700 dark:bg-stone-800 dark:text-stone-200">
                  {color.token}
                </code>
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-500 dark:text-stone-400">
                {color.usage}
              </p>
            </div>
            <CopyValueButton value={color.value} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ModeColorTokenList({ colors }: { colors: ModeColorToken[] }) {
  return (
    <div className="space-y-3">
      {colors.map((color) => (
        <div
          key={color.token}
          className="rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
        >
          <div className="space-y-3">
            <div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="font-medium text-stone-900 dark:text-stone-100">{color.token}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-500 dark:text-stone-400">
                {color.usage}
              </p>
            </div>
            <ModeValue label="Light" value={color.light} displayColor={color.lightDisplayColor} />
            <ModeValue label="Dark" value={color.dark} displayColor={color.darkDisplayColor} />
          </div>
        </div>
      ))}
    </div>
  );
}
