"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { BetaAuthModal } from "@/components/BetaAuthModal";
import { LandingAuthCta } from "@/components/LandingAuthCta";
import { WaitlistRecipePreview } from "@/components/WaitlistRecipePreview";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { PublicFooterNav } from "@/components/PublicPage";
import { WhoMadeIt } from "@/components/WhoMadeIt";
import { SUNSET_COPY, SUNSET_NOTE, SUNSET_NOTE_ID, SUNSET_NOTE_SIGNATURE } from "@/lib/sunset";
import { cn } from "@/lib/utils";
import { SUNSET_EXAMPLE_RECIPE } from "@/lib/sunset-example-recipe";

// The book and pot wiggle on hover and squish on tap, as on the original landing page.
function HeroBook() {
  return (
    <motion.img
      src="/assets/hero-book.svg"
      alt=""
      aria-hidden
      className="h-[1.05em] w-auto shrink-0 cursor-pointer"
      draggable={false}
      whileHover={{
        rotate: [0, -4, 4, -4, 0],
        scale: 1.05,
        transition: {
          rotate: { duration: 0.6, ease: "easeInOut" },
          scale: { duration: 0.2, ease: "easeOut" },
        },
      }}
      whileTap={{ scale: 0.95 }}
    />
  );
}

function HeroPot() {
  return (
    <motion.img
      src="/assets/hero-pot.svg"
      alt=""
      aria-hidden
      className="h-[1.2em] w-auto shrink-0 cursor-pointer"
      draggable={false}
      whileHover={{
        rotate: [0, -3, 3, -3, 2, -1, 0],
        transition: { duration: 0.5, ease: "easeInOut" },
      }}
      whileTap={{ scale: 0.95 }}
    />
  );
}

function HeroHeadline() {
  return (
    <>
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <span>Every recipe,</span>
        <HeroBook />
      </span>
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <span>same</span>
        <HeroPot />
        <span>format.</span>
      </span>
    </>
  );
}

const NOTE_LINK =
  "rounded-sm font-medium text-stone-900 underline decoration-stone-300 underline-offset-4 hover:decoration-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mizen-blue dark:text-stone-100 dark:decoration-stone-600 dark:hover:decoration-stone-100 transition-none";

/**
 * A live Mizen recipe view (tick ingredients, switch Prep/Cook, change servings, scroll). It fades
 * out toward the bottom so it reads as a picture of Mizen rather than something to study.
 */
function ExampleRecipeCard({ className }: { className?: string }) {
  return (
    // Padding gives the shadow room inside the fade mask, so it isn't clipped at the sides.
    <div className="-m-6 p-6 [mask-image:linear-gradient(to_bottom,black_65%,transparent_98%)]">
      <div
        className={cn(
          "relative mx-auto flex max-w-xl flex-col overflow-hidden rounded-xl border border-stone-200/60 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-950",
          className
        )}
      >
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
      </div>
    </div>
  );
}

/**
 * Signed-out homepage while Mizen is sunsetting. The first screen is the hero; a soft light-blue
 * glow at its bottom edge hints at the note, which sits below the fold on a light-blue gradient.
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
      {/* Dark mode: a soft Mizen-blue glow from the top center (a light wash looks washed out on dark). */}
      <section className="relative flex min-h-[100svh] items-center dark:bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgb(24_161_247/0.22),transparent_70%)]">
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
          </div>

          <div className="relative hidden lg:block">
            <ExampleRecipeCard className="h-[min(600px,calc(100svh-10rem))] rotate-[1.5deg]" />
          </div>
        </div>

        {/* A soft hint of the blue section below, rising from the bottom edge of the first screen. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-[#B2E3FE] dark:bg-[radial-gradient(ellipse_60%_100%_at_50%_100%,rgb(24_161_247/0.16),transparent_70%)]"
        />
      </section>

      {/* Below the fold: the note on a white card over a light-blue gradient. */}
      {/* Light mode: light-blue gradient. Dark mode: the glow continues from the fold, then dark. */}
      <div className="bg-gradient-to-b from-[#B2E3FE] to-[#7CC4F9] dark:bg-[radial-gradient(ellipse_60%_420px_at_50%_0%,rgb(24_161_247/0.16),transparent_70%)]">
        <div className="px-4 pb-12 pt-4 sm:px-6 sm:pb-16">
          <section
            id={SUNSET_NOTE_ID}
            aria-labelledby="sunset-note-heading"
            className="mx-auto w-full max-w-2xl scroll-mt-6 rounded-2xl bg-white px-6 py-10 shadow-[0_8px_30px_rgb(24_161_247/0.18)] dark:border dark:border-stone-800 dark:bg-stone-900 sm:px-10 sm:py-12"
          >
            <h2
              id="sunset-note-heading"
              className="font-serif text-3xl font-bold tracking-[-0.02em] text-stone-950 dark:text-stone-50 sm:text-4xl"
            >
              {SUNSET_COPY.heading}
            </h2>

            {/* Gage's note: edit SUNSET_NOTE in src/lib/sunset.ts */}
            <div className="mt-6 space-y-4 font-sans text-base leading-7 text-stone-700 dark:text-stone-300">
              {SUNSET_NOTE.map((paragraph, i) => (
                <p key={i}>
                  {paragraph.map((segment, j) =>
                    typeof segment === "string" ? (
                      segment
                    ) : (
                      <a
                        key={j}
                        href={segment.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={NOTE_LINK}
                      >
                        {segment.text}
                      </a>
                    )
                  )}
                </p>
              ))}
              <p>{SUNSET_NOTE_SIGNATURE}</p>
            </div>

            <h3 className="mt-10 font-serif text-2xl font-semibold text-stone-950 dark:text-stone-50">
              {SUNSET_COPY.whatHappensNowHeading}
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 font-sans text-base leading-7 text-stone-600 dark:text-stone-400">
              {SUNSET_COPY.whatHappensNow.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          {/* On phones the example sits under the note, as on the original landing page. */}
          <div className="mt-8 px-2 lg:hidden">
            <ExampleRecipeCard className="h-[520px]" />
          </div>
        </div>

        {/* Footer sits on the blue: transparent, with white text. Exact white is used because the
            theme redefines "white" as a dark color in dark mode. */}
        <footer className="py-6">
          <div className="mx-auto flex w-full min-w-0 max-w-[1120px] flex-wrap items-center justify-between gap-x-8 gap-y-4 px-5 sm:px-8">
            <WhoMadeIt
              borderColor="border-[#7CC4F9] dark:border-stone-950"
              textClassName="font-sans text-sm font-medium text-[rgb(255_255_255/0.7)] mix-blend-plus-lighter"
            />
            <PublicFooterNav linkClassName="font-medium text-[rgb(255_255_255/0.7)] mix-blend-plus-lighter hover:text-[#fff] dark:text-[rgb(255_255_255/0.7)] dark:hover:text-[#fff]" />
          </div>
        </footer>
      </div>

      {isSupabaseConfigured && <BetaAuthModal open={authOpen} onOpenChange={setAuthOpen} />}
    </div>
  );
}
