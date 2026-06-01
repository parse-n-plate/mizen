"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { BetaAuthModal } from "@/components/BetaAuthModal";
import { ImageLightbox } from "@/components/ImageLightbox";
import { LandingAuthCta } from "@/components/LandingAuthCta";
import { ReleaseNotice } from "@/components/ReleaseNotice";
import { WhoMadeIt } from "@/components/WhoMadeIt";
import { appVersion } from "@/lib/app-version";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

const DISCORD_URL = "https://discord.gg/Pt4t8K8h9";
const BEEF_UDON_URL = "https://www.justonecookbook.com/beef-udon/";

const steps = [
  {
    title: "Source",
    description: "Find a recipe you want to save.",
    imageSrc: "/assets/get-started/find-recipe.gif",
    imageAlt: "Beef udon recipe page on Just One Cookbook.",
    width: 1338,
    height: 1048,
  },
  {
    title: "Import",
    description:
      "Add it to Mizen by pasting a recipe URL, uploading a recipe photo, or pasting in a recipe from ChatGPT.",
    imageSrc: "/assets/get-started/add-recipe.gif",
    imageAlt: "Mizen import screen with URL, image, and attachment controls.",
    width: 706,
    height: 564,
  },
  {
    title: "Cookbook",
    description: "Save it to your cookbook by tapping the heart in the top right.",
    imageSrc: "/assets/get-started/save-recipe.gif",
    imageAlt: "Recipe screen showing the heart save button in the top right.",
    width: 360,
    height: 288,
  },
];

function GetStartedPageContent() {
  const [authOpen, setAuthOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lightbox, setLightbox] = useState<{
    src: string;
    alt: string;
    rect: DOMRect;
    el: HTMLElement;
  } | null>(null);

  return (
    <>
      <div className="min-h-screen bg-white text-stone-900 dark:bg-stone-950 dark:text-stone-100">
        <header className="border-b border-stone-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 dark:border-stone-800 dark:bg-stone-950/95 dark:supports-[backdrop-filter]:bg-stone-950/85">
          <nav className="mx-auto flex h-20 w-full max-w-[1120px] items-center justify-between px-5 sm:px-8">
            <Link href="/" className="flex min-w-0 items-center gap-2">
              <Image
                src="/assets/icons/Fish Logo.svg"
                alt=""
                aria-hidden
                width={28}
                height={28}
                className="h-7 w-7 shrink-0"
              />
              <span className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-50">
                Mizen
              </span>
            </Link>
            <LandingAuthCta onSignIn={() => setAuthOpen(true)} signedInLabel="Go to app" />
          </nav>
        </header>

        <main className="mx-auto w-full max-w-[1120px] px-5 py-10 sm:px-8 sm:py-14">
          <section className="max-w-[720px]">
            <h1 className="font-serif text-[36px] font-bold leading-[42px] tracking-[-0.02em] text-stone-950 dark:text-stone-50 sm:text-[48px] sm:leading-[58px]">
              Get started with Mizen.
            </h1>
            <p className="mt-5 text-[17px] leading-[29px] text-stone-700 dark:text-stone-300">
              Mizen is a recipe app for saving recipes and coming back to them later. If anything is
              confusing, broken, or missing, send feedback in{" "}
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-stone-950 underline underline-offset-4 dark:text-stone-50"
              >
                Discord
              </a>{" "}
              or text directly.
            </p>
          </section>

          <section className="mt-12">
            <h2 className="sr-only">Start here</h2>
            <ol className="mt-6 grid gap-10">
              {steps.map((step, index) => (
                <li
                  key={step.description}
                  className="grid grid-cols-1 gap-5 border-t border-stone-200 pt-8 dark:border-stone-800 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-10"
                >
                  <div>
                    <h3 className="text-[14px] font-medium leading-6 text-stone-500 dark:text-stone-400">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-[17px] leading-[29px] text-stone-950 dark:text-stone-50">
                      {step.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="overflow-hidden rounded-lg border border-stone-200 bg-stone-50 text-left cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 dark:border-stone-800 dark:bg-stone-900 dark:focus-visible:ring-stone-100 dark:focus-visible:ring-offset-stone-950"
                    aria-label={`Open image: ${step.imageAlt}`}
                    onClick={(event) => {
                      setLightbox({
                        src: step.imageSrc,
                        alt: step.imageAlt,
                        rect: event.currentTarget.getBoundingClientRect(),
                        el: event.currentTarget,
                      });
                    }}
                  >
                    <Image
                      src={step.imageSrc}
                      alt={step.imageAlt}
                      width={step.width}
                      height={step.height}
                      className="h-auto w-full"
                      sizes="(min-width: 1024px) 720px, calc(100vw - 40px)"
                      priority={index === 0}
                    />
                  </button>
                </li>
              ))}
            </ol>
          </section>

          <section className="mt-12 rounded-lg border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-900 sm:p-6">
            <p className="text-[17px] leading-[29px] text-stone-700 dark:text-stone-300">
              If you want one to try first, copy this recipe URL and credit Just One Cookbook when
              you use it.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <code className="min-w-0 flex-1 overflow-hidden text-ellipsis rounded-md border border-stone-200 bg-white px-3 py-2 text-[13px] leading-5 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
                {BEEF_UDON_URL}
              </code>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-[14px] font-medium text-white transition-colors hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 dark:bg-stone-100 dark:text-stone-950 dark:hover:bg-stone-200 dark:focus-visible:ring-stone-100 dark:focus-visible:ring-offset-stone-950"
                onClick={async () => {
                  await navigator.clipboard.writeText(BEEF_UDON_URL);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1800);
                }}
              >
                {copied ? (
                  <Check className="size-4" strokeWidth={2} aria-hidden />
                ) : (
                  <Copy className="size-4" strokeWidth={2} aria-hidden />
                )}
                {copied ? "Copied" : "Copy URL"}
              </button>
            </div>
          </section>
        </main>

        <footer className="mx-auto flex w-full max-w-[1120px] items-center justify-between px-5 pb-8 pt-2 sm:px-8">
          <ReleaseNotice
            compact
            triggerLabel={appVersion}
            triggerStyle="badge"
            triggerBadgeLabel="Beta"
            className="shrink-0"
          />
          <WhoMadeIt />
        </footer>
      </div>

      {isSupabaseConfigured && <BetaAuthModal open={authOpen} onOpenChange={setAuthOpen} />}
      {lightbox && (
        <ImageLightbox
          src={lightbox.src}
          alt={lightbox.alt}
          sourceRect={lightbox.rect}
          sourceEl={lightbox.el}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}

export default function GetStartedPage() {
  return <GetStartedPageContent />;
}
