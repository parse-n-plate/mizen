"use client";

import { useState } from "react";
import Image from "next/image";
import ChatRoundDots from "@solar-icons/react/csr/messages/ChatRoundDots";
import { ImageLightbox } from "@/components/ImageLightbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { appVersion } from "@/lib/app-version";
import { cn } from "@/lib/utils";

type ReleaseNoticeProps = {
  badgeLabel?: string;
  bodyTitle?: string;
  compact?: boolean;
  className?: string;
  contactEmail?: string;
  contactSubject?: string;
  description?: string;
  feedbackLabel?: string;
  isNew?: boolean;
  modalAnimated?: boolean;
  title?: string;
  triggerStyle?: "button" | "badge";
  triggerBadgeLabel?: string;
  triggerLabel?: string;
};

const defaultContactEmail = "hello@mizen.recipes";
const defaultDescription =
  "This early access includes custom recipe imports and the mobile cooking view. Bugs are to be expected, and your feedback helps us make Mizen a better experience for home cooks.";

export function ReleaseNotice({
  badgeLabel = appVersion,
  bodyTitle = "Thanks for helping test Mizen!",
  compact = false,
  className,
  contactEmail = defaultContactEmail,
  contactSubject = "Mizen beta feedback",
  description = defaultDescription,
  feedbackLabel = "Share feedback",
  isNew = true,
  modalAnimated = true,
  title = "Mizen Early Access",
  triggerStyle = "button",
  triggerBadgeLabel = "New",
  triggerLabel = "Welcome to Beta",
}: ReleaseNoticeProps) {
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
          {triggerStyle === "badge" ? (
            <button
              type="button"
              aria-label={isNew ? `${triggerLabel} ${triggerBadgeLabel}` : triggerLabel}
              className={cn(
                "rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                className
              )}
            >
              <Badge variant="secondary" className="tabular-nums">
                {triggerLabel}
              </Badge>
            </button>
          ) : (
            <Button
              type="button"
              variant="notice"
              size={compact ? "notice" : "default"}
              aria-label={isNew ? `${triggerLabel} ${triggerBadgeLabel}` : triggerLabel}
              className={cn("w-full justify-start active:!scale-100", className)}
            >
              <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                <span className="min-w-0 truncate text-center font-medium">{triggerLabel}</span>
                {isNew && (
                  <Badge variant="secondary" className="text-[11px] font-semibold leading-none">
                    {triggerBadgeLabel}
                  </Badge>
                )}
              </span>
            </Button>
          )}
        </DialogTrigger>

        <DialogContent
          animated={modalAnimated}
          className="flex w-[min(584px,calc(100vw-2rem))] flex-col gap-6 overflow-hidden p-0 pb-6 sm:max-w-none"
        >
          <DialogHeader className="border-b px-6 py-4 pr-12">
            <div className="flex min-w-0 items-center gap-2 text-left">
              <Badge variant="secondary" className="tabular-nums">
                {badgeLabel}
              </Badge>
              <DialogTitle className="truncate font-sans text-base">{title}</DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex w-full flex-col items-start gap-3 px-6 text-left">
            <p className="font-serif text-2xl font-semibold leading-tight text-foreground">
              {bodyTitle}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 px-6">
            <button
              type="button"
              className="relative h-[371px] w-full shrink-0 cursor-zoom-in overflow-hidden rounded-lg bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                className="object-cover"
                sizes="(min-width: 640px) 536px, calc(100vw - 5rem)"
                priority={false}
              />
            </button>
          </div>

          <div className="flex w-full flex-col gap-6 px-6 text-left">
            <div className="flex w-full flex-col items-start gap-3">
              <DialogDescription className="text-base leading-6 text-pretty">
                {description}
              </DialogDescription>
            </div>

            <div className="flex w-full items-center justify-end">
              <Button asChild variant="primary-blue" size="sm">
                <a href={contactHref} aria-label={`Send Mizen feedback to ${contactEmail}`}>
                  <ChatRoundDots size={18} weight="Bold" className="shrink-0" />
                  {feedbackLabel}
                </a>
              </Button>
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
