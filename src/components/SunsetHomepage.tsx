"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AltArrowDown from "@solar-icons/react/csr/arrows/AltArrowDown";
import { BetaAuthModal } from "@/components/BetaAuthModal";
import { LandingAuthCta } from "@/components/LandingAuthCta";
import { WaitlistRecipePreview } from "@/components/WaitlistRecipePreview";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { PublicFooter, publicPageContainer, publicPageWidths } from "@/components/PublicPage";
import { SUNSET_COPY, SUNSET_NOTE_ID } from "@/lib/sunset";
import { cn } from "@/lib/utils";
import { SUNSET_EXAMPLE_RECIPE } from "@/lib/sunset-example-recipe";

const SMALL_LINK =
  "rounded-md font-sans text-xs text-stone-400 hover:text-stone-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mizen-blue dark:text-stone-500 dark:hover:text-stone-300 transition-none";

function HeroHeadline() {
  return (
    <>
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <span>Every recipe,</span>
        <Image
          src="/assets/hero-book.svg"
          alt=""
          aria-hidden
          width={48}
          height={48}
          className="h-[1.05em] w-auto shrink-0"
        />
      </span>
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <span>same</span>
        <Image
          src="/assets/hero-pot.svg"
          alt=""
          aria-hidden
          width={56}
          height={56}
          className="h-[1.2em] w-auto shrink-0"
        />
        <span>format.</span>
      </span>
    </>
  );
}

/**
 * Signed-out homepage while Mizen is sunsetting. The first screen is the hero with an announcement
 * card; it stops just short of the fold so the top of the note below peeks into view.
 */
export function SunsetHomepage() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <div className="landing-scroll relative flex min-h-screen flex-1 flex-col bg-white dark:bg-stone-950">
      {/* Sign-in for existing beta users. Absolutely placed so it doesn't push the note below the fold. */}
      <div className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex w-full max-w-[1120px] justify-end px-6 pt-5 sm:px-8">
          <LandingAuthCta onSignIn={() => setAuthOpen(true)} />
        </div>
      </div>
      <section className="flex min-h-[calc(100svh-5.5rem)] items-center">
        <div className="mx-auto grid w-full max-w-[1120px] items-center gap-12 px-6 py-14 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16 lg:py-10">
          <div>
            <Image
              src="/apple-touch-icon.png"
              alt="Mizen"
              width={48}
              height={48}
              priority
              className="h-12 w-12"
            />

            <h1 className="mt-8 flex flex-col items-start gap-1 font-serif text-[clamp(32px,9vw,52px)] font-bold leading-[1.25] tracking-[-0.02em] text-stone-900 dark:text-stone-100">
              <HeroHeadline />
            </h1>

            <p className="mt-4 max-w-[26rem] text-balance font-sans text-base leading-relaxed text-stone-500 dark:text-stone-400 lg:text-[17px]">
              {SUNSET_COPY.homepageSub}
            </p>

            <a
              href={`#${SUNSET_NOTE_ID}`}
              className="group mt-8 flex w-full max-w-[22rem] items-center justify-between gap-4 rounded-xl bg-stone-100 px-4 py-3 hover:bg-stone-200/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mizen-blue dark:bg-stone-900 dark:hover:bg-stone-800 transition-none"
            >
              <span className="min-w-0">
                <span className="block font-sans text-xs font-medium text-stone-500 dark:text-stone-400">
                  {SUNSET_COPY.announcementEyebrow}
                </span>
                <span className="mt-0.5 block font-sans text-base font-semibold text-stone-900 dark:text-stone-100">
                  {SUNSET_COPY.heading}
                </span>
              </span>
              <AltArrowDown
                size={18}
                aria-hidden
                className="shrink-0 text-stone-400 group-hover:text-stone-700 dark:group-hover:text-stone-200"
              />
            </a>

            <nav aria-label="Footer" className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link href="/faq" className={SMALL_LINK}>
                FAQ
              </Link>
              <Link href="/privacy" className={SMALL_LINK}>
                Privacy
              </Link>
              <Link href="/terms" className={SMALL_LINK}>
                Terms
              </Link>
            </nav>
          </div>

          {/* A live Mizen recipe view: tick ingredients, switch Prep/Cook, change servings, scroll. */}
          <div className="relative hidden lg:block">
            <div className="relative mx-auto flex h-[min(600px,calc(100svh-10rem))] max-w-xl rotate-[1.5deg] flex-col overflow-hidden rounded-xl border border-stone-200/60 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-950">
              <div
                aria-hidden
                className="flex h-[41px] shrink-0 items-center gap-1.5 bg-white px-5 dark:bg-stone-900"
              >
                <div className="size-3 rounded-full bg-[#DDDDDD] dark:bg-stone-700" />
                <div className="size-3 rounded-full bg-[#DDDDDD] dark:bg-stone-700" />
                <div className="size-3 rounded-full bg-[#DDDDDD] dark:bg-stone-700" />
              </div>
              <div className="min-h-0 flex-1">
                <WaitlistRecipePreview
                  recipe={SUNSET_EXAMPLE_RECIPE}
                  sourceType="url"
                  showSourceAttachment={false}
                />
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white dark:from-stone-900" />
            </div>
          </div>
        </div>
      </section>

      <section
        id={SUNSET_NOTE_ID}
        aria-labelledby="sunset-note-heading"
        className={cn(publicPageContainer, publicPageWidths.document, "pb-16 pt-4 sm:pb-20")}
      >
        <h2
          id="sunset-note-heading"
          className="font-serif text-3xl font-bold tracking-[-0.02em] text-stone-950 dark:text-stone-50 sm:text-4xl"
        >
          {SUNSET_COPY.heading}
        </h2>

        {/* Gage's note: edit SUNSET_COPY.note in src/lib/sunset.ts */}
        <div className="mt-6 rounded-xl border border-dashed border-stone-300 bg-[#FAFAF9] px-5 py-6 dark:border-stone-700 dark:bg-stone-900">
          <p className="whitespace-pre-line font-sans text-base font-semibold leading-7 tracking-wide text-stone-500 dark:text-stone-400">
            {SUNSET_COPY.note}
          </p>
        </div>

        <h3 className="mt-10 font-serif text-2xl font-semibold text-stone-950 dark:text-stone-50">
          {SUNSET_COPY.whatHappensNowHeading}
        </h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 font-sans text-base leading-7 text-stone-600 dark:text-stone-400">
          {SUNSET_COPY.whatHappensNow.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <p className="mt-10 font-sans text-base leading-7 text-stone-600 dark:text-stone-400">
          {SUNSET_COPY.thanks}
        </p>
      </section>

      <PublicFooter />

      {isSupabaseConfigured && <BetaAuthModal open={authOpen} onOpenChange={setAuthOpen} />}
    </div>
  );
}
