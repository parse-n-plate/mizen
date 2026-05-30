"use client";

import { useState } from "react";
import Image from "next/image";
import { XIcon } from "lucide-react";
import ChatRoundDots from "@solar-icons/react/csr/messages/ChatRoundDots";
import { ImageLightbox } from "@/components/ImageLightbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ChangelogNoticeProps = {
  badgeLabel?: string;
  bodyTitle?: string;
  compact?: boolean;
  className?: string;
  contactEmail?: string;
  contactSubject?: string;
  description?: string;
  feedbackLabel?: string;
  isNew?: boolean;
  title?: string;
  triggerBadgeLabel?: string;
  triggerLabel?: string;
};

const defaultContactEmail = "hello@mizen.recipes";
const defaultDescription =
  "This early access includes custom recipe imports and the mobile cooking view. Bugs are to be expected, and your feedback helps us make Mizen a better experience for home cooks.";

export function ChangelogNotice({
  badgeLabel = "0.1.0",
  bodyTitle = "Thanks for helping test Mizen!",
  compact = false,
  className,
  contactEmail = defaultContactEmail,
  contactSubject = "Mizen beta feedback",
  description = defaultDescription,
  feedbackLabel = "Share feedback",
  isNew = true,
  title = "Mizen Early Access",
  triggerBadgeLabel = "New",
  triggerLabel = "Welcome to Beta",
}: ChangelogNoticeProps) {
  const contactHref = `mailto:${contactEmail}?subject=${encodeURIComponent(
    contactSubject
  )}&body=${encodeURIComponent("Hi Mizen,\n\nI wanted to share:\n")}`;
  const previewSrc = "/assets/changelog-notice-header.png";
  const [open, setOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{
    rect: DOMRect;
    el: HTMLElement;
  } | null>(null);
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && lightbox) {
      return;
    }
    setOpen(nextOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size={compact ? "sm" : "default"}
            aria-label={isNew ? `${triggerLabel} ${triggerBadgeLabel}` : triggerLabel}
            className={cn(
              "w-full justify-start gap-1.5 rounded-lg border-[#E7E5E4] bg-white px-2 py-1.5 font-sans text-[#44403C] shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-white hover:text-[#44403C] dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-900 dark:hover:text-stone-100",
              compact && "h-auto",
              className
            )}
          >
            <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
              <span className="flex min-w-0 flex-wrap justify-center text-center text-[13px] font-medium leading-none text-[#44403C] dark:text-stone-300">
                {triggerLabel}
              </span>
              {isNew && (
                <Badge
                  variant="secondary"
                  className="h-[22px] shrink-0 rounded-full border-transparent bg-[#F5F5F5] px-2 py-0.5 font-sans text-[11px] font-semibold leading-none text-[#44403C] shadow-none hover:bg-[#F5F5F5] dark:border-transparent dark:bg-stone-800 dark:text-stone-300"
                >
                  {triggerBadgeLabel}
                </Badge>
              )}
            </span>
          </Button>
        </DialogTrigger>

        <DialogContent
          animated={false}
          showCloseButton={false}
          className="changelog-notice-dialog flex w-[min(584px,calc(100vw-2rem))] flex-col items-center gap-6 overflow-hidden rounded-lg border border-stone-200 bg-white p-0 pb-6 shadow-[0_24px_60px_rgba(28,25,23,0.18)] sm:max-w-none dark:border-stone-800 dark:bg-stone-950"
        >
          <div className="flex w-full items-center justify-center border-b border-stone-200 px-[18px] py-3 dark:border-stone-800">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Badge
                variant="secondary"
                className="h-[22px] bg-stone-100 px-2 py-0.5 font-sans text-[11px] font-semibold leading-none text-stone-700 tabular-nums dark:bg-stone-800 dark:text-stone-300"
              >
                {badgeLabel}
              </Badge>
              <DialogTitle className="font-sans text-base font-semibold leading-none text-stone-700 dark:text-stone-300">
                {title}
              </DialogTitle>
            </div>

            <DialogClose
              className="flex size-7 shrink-0 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-300 dark:focus-visible:ring-stone-100"
              aria-label="Close changelog notice"
            >
              <XIcon className="size-3.5" />
            </DialogClose>
          </div>

          <div className="flex w-full flex-col gap-3 px-6">
            <button
              type="button"
              className="relative h-[371px] w-full shrink-0 overflow-hidden rounded-[10px] bg-sky-100 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 dark:focus-visible:ring-stone-100"
              aria-label="Open recipe preview image"
              onClick={(event) => {
                setLightbox({
                  rect: event.currentTarget.getBoundingClientRect(),
                  el: event.currentTarget,
                });
              }}
            >
              <Image
                src={previewSrc}
                alt="Recipe view preview"
                fill
                className="rounded-[10px] object-cover"
                sizes="(min-width: 640px) 536px, calc(100vw - 5rem)"
                priority={false}
              />
            </button>
          </div>

          <div className="flex w-full flex-col gap-6 px-6 text-left">
            <div className="flex w-full flex-col items-start gap-3">
              <p className="font-sans text-2xl font-semibold leading-none text-stone-700 dark:text-stone-300">
                {bodyTitle}
              </p>
              <DialogDescription className="font-sans text-base leading-6 text-stone-600 text-pretty dark:text-stone-400">
                {description}
              </DialogDescription>
            </div>

            <div className="flex w-full items-center justify-end">
              <a
                href={contactHref}
                aria-label={`Send Mizen feedback to ${contactEmail}`}
                className="inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-[var(--color-blue)] px-3 py-1 font-sans text-base font-medium leading-none text-stone-50 transition-colors hover:bg-[#0d8de0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 dark:focus-visible:ring-stone-100"
              >
                <span className="flex size-7 items-center justify-center">
                  <ChatRoundDots size={18} weight="Bold" className="shrink-0" />
                </span>
                {feedbackLabel}
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {lightbox && (
        <ImageLightbox
          src={previewSrc}
          alt="Recipe view preview"
          sourceRect={lightbox.rect}
          sourceEl={lightbox.el}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
