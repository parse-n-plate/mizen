"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "motion/react";
import AltArrowDown from "@solar-icons/react/csr/arrows/AltArrowDown";
import { BetaAuthModal } from "@/components/BetaAuthModal";
import { LandingAuthCta } from "@/components/LandingAuthCta";
import { WaitlistRecipePreview } from "@/components/WaitlistRecipePreview";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { PublicBrand, PublicFooterNav } from "@/components/PublicPage";
import { WhoMadeIt } from "@/components/WhoMadeIt";
import {
  SUNSET_COPY,
  SUNSET_NOTE,
  SUNSET_NOTE_ID,
  SUNSET_NOTE_SIGNATURE,
  type SunsetNoteSegment,
} from "@/lib/sunset";
import { cn } from "@/lib/utils";
import { developerFeedbackToolsEnabled } from "@/lib/features";
import { useNoteEntrance } from "@/hooks/useNoteEntrance";
import { NOTE_ENTRANCE_DEFAULTS, type NoteEntranceConfig } from "@/lib/sunset-note-motion";
import { SUNSET_EXAMPLE_RECIPES } from "@/lib/sunset-example-recipe";
import { sunsetPaletteStyle } from "@/lib/sunset-edge-colors";
import { useSunsetEdgeColors } from "@/hooks/useSunsetEdgeColors";

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

// Tuning controls for local dev and Vercel preview/staging builds. Both values
// are inlined at build time, so production builds drop this import entirely
// and ship only NOTE_ENTRANCE_DEFAULTS.
const SunsetNoteMotionDial =
  (process.env.NODE_ENV === "development" || process.env.MIZEN_MOTION_TUNING === "true") &&
  developerFeedbackToolsEnabled
    ? dynamic(() => import("@/components/SunsetNoteMotionDial"), { ssr: false })
    : null;

const NOTE_LINK =
  "rounded-sm font-medium text-stone-900 underline decoration-stone-300 underline-offset-4 hover:decoration-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mizen-blue dark:text-stone-100 dark:decoration-stone-600 dark:hover:decoration-stone-100 transition-none";

function ExampleRecipeCard({ className }: { className?: string }) {
  const [index] = useState(() => (Math.random() < 0.5 ? 0 : 1));

  return (
    <div className="-m-6 p-6 [mask-image:linear-gradient(to_bottom,black_calc(100%_-_4.5rem),transparent_calc(100%_-_1.5rem))] lg:[mask-image:linear-gradient(to_bottom,black_55%,transparent_calc(100%_-_3rem))]">
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
            recipe={SUNSET_EXAMPLE_RECIPES[index]}
            sourceType="url"
            showSourceAttachment={false}
          />
        </div>
      </div>
    </div>
  );
}

function ScrollCue() {
  const reduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href={`#${SUNSET_NOTE_ID}`}
      onClick={(event) => {
        const note = document.getElementById(SUNSET_NOTE_ID);
        if (!note) return;
        event.preventDefault();
        note.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        window.history.replaceState(null, "", `#${SUNSET_NOTE_ID}`);
      }}
      aria-hidden={scrolled}
      tabIndex={scrolled ? -1 : undefined}
      className={cn(
        "absolute inset-x-0 bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.5rem))] mx-auto flex w-max flex-col items-center gap-1 rounded-md px-2 py-1 font-sans text-sm font-medium text-[#226097] mix-blend-multiply hover:text-[#163F66] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mizen-blue dark:text-[rgb(255_255_255/0.5)] dark:mix-blend-plus-lighter dark:hover:text-[#fff] transition-opacity duration-300",
        scrolled && "pointer-events-none opacity-0"
      )}
    >
      {SUNSET_COPY.scrollCue}
      <motion.span
        aria-hidden
        animate={reduceMotion ? undefined : { y: [0, 4, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <AltArrowDown size={18} />
      </motion.span>
    </a>
  );
}

function NoteSegments({ segments }: { segments: SunsetNoteSegment[] }) {
  return segments.map((segment, i) =>
    typeof segment === "string" ? (
      segment
    ) : "emphasis" in segment ? (
      <em key={i}>{segment.text}</em>
    ) : (
      <a
        key={i}
        href={segment.href}
        target="_blank"
        rel="noopener noreferrer"
        className={NOTE_LINK}
      >
        {segment.text}
      </a>
    )
  );
}

export function SunsetHomepage() {
  const [authOpen, setAuthOpen] = useState(false);
  const noteRef = useRef<HTMLDivElement>(null);
  const noteConfigRef = useRef<NoteEntranceConfig>(NOTE_ENTRANCE_DEFAULTS);
  const getNoteConfig = useCallback(() => noteConfigRef.current, []);
  const setNoteConfig = useCallback((config: NoteEntranceConfig) => {
    noteConfigRef.current = config;
  }, []);
  const { replay: replayNote } = useNoteEntrance(noteRef, getNoteConfig);

  const pageRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  useSunsetEdgeColors({ page: pageRef, sky: skyRef });

  return (
    <div
      ref={pageRef}
      style={sunsetPaletteStyle}
      className="landing-scroll relative flex min-h-screen flex-1 flex-col bg-[var(--sunset-base-light)] dark:bg-[var(--sunset-base-dark)]"
    >
      <div
        ref={skyRef}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[1380px] bg-[image:var(--sunset-sky)] dark:hidden"
      />
      <div className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-6 pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:pl-[max(2rem,env(safe-area-inset-left))] sm:pr-[max(2rem,env(safe-area-inset-right))]">
          <PublicBrand />
          <LandingAuthCta onSignIn={() => setAuthOpen(true)} />
        </div>
      </div>
      <section className="relative flex min-h-[100svh] items-center">
        <div className="mx-auto grid w-full max-w-[1120px] grid-cols-[minmax(0,1fr)] items-center gap-8 pb-[calc(6rem+env(safe-area-inset-bottom))] pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))] pt-[calc(5rem+env(safe-area-inset-top))] sm:pl-[max(2rem,env(safe-area-inset-left))] sm:pr-[max(2rem,env(safe-area-inset-right))] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16 lg:py-10">
          <div className="mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none">
            <h1 className="flex flex-col items-start gap-1 font-serif text-[clamp(32px,9vw,52px)] font-bold leading-[1.25] tracking-[-0.02em] text-stone-900 dark:text-stone-100">
              <HeroHeadline />
            </h1>

            <p className="mt-4 max-w-[26rem] text-balance font-sans text-base leading-relaxed text-stone-500 dark:text-stone-400 lg:text-[17px]">
              {SUNSET_COPY.homepageSub}
            </p>
          </div>

          <div className="relative min-w-0">
            <ExampleRecipeCard className="h-[clamp(320px,calc(100svh-24rem),520px)] lg:h-[min(600px,calc(100svh-10rem))] lg:rotate-[1.5deg]" />
          </div>
        </div>

        <ScrollCue />
      </section>

      <div className="relative">
        <div className="pb-12 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-4 sm:pb-16 sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]">
          <section
            id={SUNSET_NOTE_ID}
            aria-labelledby="sunset-note-heading"
            className="mx-auto w-full max-w-2xl scroll-mt-6"
          >
            {/* The card is the animated unit; the section (and its #note anchor) never moves. */}
            <div
              ref={noteRef}
              className="rounded-2xl bg-white px-6 py-10 md:shadow-[0_8px_30px_rgb(24_161_247/0.18)] dark:shadow-none dark:border dark:border-stone-800 dark:bg-stone-900 sm:px-10 sm:py-12"
            >
              <h2
                id="sunset-note-heading"
                className="font-serif text-3xl font-bold tracking-[-0.02em] text-stone-950 dark:text-stone-50 sm:text-4xl"
              >
                {SUNSET_COPY.heading}
              </h2>

              <div className="mt-6 space-y-4 font-sans text-base leading-7 text-stone-700 dark:text-stone-300">
                {SUNSET_NOTE.map((paragraph, i) => (
                  <p key={i}>
                    <NoteSegments segments={paragraph} />
                  </p>
                ))}
                <p>
                  <NoteSegments segments={SUNSET_NOTE_SIGNATURE} />
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
            </div>
          </section>
        </div>

        <footer className="pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.75rem))] pt-6">
          <div className="mx-auto flex w-full min-w-0 max-w-[1120px] flex-wrap items-center justify-between gap-x-8 gap-y-4 pl-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] sm:pl-[max(2rem,env(safe-area-inset-left))] sm:pr-[max(2rem,env(safe-area-inset-right))]">
            <WhoMadeIt
              borderColor="border-[#7CC4F9] dark:border-stone-950"
              textClassName="font-sans text-sm font-medium text-[#226097] mix-blend-multiply dark:text-[rgb(255_255_255/0.5)] dark:mix-blend-plus-lighter"
            />
            <PublicFooterNav linkClassName="font-medium text-[#226097] mix-blend-multiply hover:text-[#163F66] dark:text-[rgb(255_255_255/0.5)] dark:mix-blend-plus-lighter dark:hover:text-[#fff]" />
          </div>
        </footer>
      </div>

      {SunsetNoteMotionDial && (
        <SunsetNoteMotionDial onConfigChange={setNoteConfig} onReplay={replayNote} />
      )}
      {isSupabaseConfigured && <BetaAuthModal open={authOpen} onOpenChange={setAuthOpen} />}
    </div>
  );
}
