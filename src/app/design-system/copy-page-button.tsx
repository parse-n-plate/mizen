"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeMarkdown(value: string) {
  return value.replace(/\s+([.,;:!?])/g, "$1");
}

function serializeInline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return normalizeText(node.textContent ?? "");
  }

  if (!(node instanceof HTMLElement)) {
    return "";
  }

  if (node.matches("button, svg, img, [aria-hidden='true']")) {
    return "";
  }

  if (node.tagName === "BR") {
    return "\n";
  }

  const content = [...node.childNodes].map(serializeInline).filter(Boolean).join(" ");

  if (!content) {
    return "";
  }

  if (node.tagName === "CODE" && node.parentElement?.tagName !== "PRE") {
    return `\`${content}\``;
  }

  if (node.tagName === "A") {
    const href = node.getAttribute("href");
    return href ? `[${content}](${href})` : content;
  }

  return content;
}

function serializeBlock(node: Element): string {
  if (!(node instanceof HTMLElement)) {
    return "";
  }

  if (node.matches("button, nav, svg, img, [data-copy-page-button]")) {
    return "";
  }

  if (node.tagName === "PRE") {
    return `\`\`\`\n${node.textContent?.trim() ?? ""}\n\`\`\``;
  }

  if (node.tagName === "H1") {
    return `# ${normalizeText(node.textContent ?? "")}`;
  }

  if (node.tagName === "H2") {
    return `## ${normalizeText(node.textContent ?? "")}`;
  }

  if (node.tagName === "H3") {
    return `### ${normalizeText(node.textContent ?? "")}`;
  }

  if (node.tagName === "P") {
    return serializeInline(node);
  }

  if (node.tagName === "UL") {
    return [...node.children]
      .map((child) => `- ${serializeInline(child)}`)
      .filter((item) => item !== "- ")
      .join("\n");
  }

  if (node.tagName === "OL") {
    return [...node.children]
      .map((child, index) => `${index + 1}. ${serializeInline(child)}`)
      .filter((item) => !item.endsWith(". "))
      .join("\n");
  }

  return [...node.children].map(serializeBlock).filter(Boolean).join("\n\n");
}

function getPageMarkdown() {
  const article = document.querySelector("main article");
  if (!article) {
    return `# ${document.title}\n\n${window.location.href}`;
  }

  const header = article.querySelector("header");
  const sections = [...article.querySelectorAll("section")];
  const parts = [
    header?.querySelector("h1") ? serializeBlock(header.querySelector("h1")!) : "",
    header?.querySelector("p") ? serializeBlock(header.querySelector("p")!) : "",
    ...sections.map(serializeBlock),
  ].filter(Boolean);

  return normalizeMarkdown(`${parts.join("\n\n")}\n\nSource: ${window.location.href}`);
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to the legacy copy path when browser permissions reject clipboard writes.
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

export function CopyPageButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyText(getPageMarkdown());
      setCopied(true);
      toast.success("Page copied as Markdown");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Failed to copy page as Markdown");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="shrink-0"
      onClick={handleCopy}
      aria-label="Copy page as Markdown"
      data-copy-page-button
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      <span className="hidden sm:inline">{copied ? "Copied" : "Copy page"}</span>
    </Button>
  );
}
