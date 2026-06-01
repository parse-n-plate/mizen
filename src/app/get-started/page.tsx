"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
  const [showNav, setShowNav] = useState(false);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [lightbox, setLightbox] = useState<{
    src: string;
    alt: string;
    rect: DOMRect;
    el: HTMLElement;
  } | null>(null);

  useEffect(() => {
    const updateNavVisibility = () => {
      const hero = heroRef.current;
      if (!hero) return;

      const rect = hero.getBoundingClientRect();
      const threshold = window.scrollY + rect.top + rect.height / 2;
      setShowNav(window.scrollY >= threshold);
    };

    updateNavVisibility();
    window.addEventListener("scroll", updateNavVisibility, { passive: true });
    window.addEventListener("resize", updateNavVisibility);

    return () => {
      window.removeEventListener("scroll", updateNavVisibility);
      window.removeEventListener("resize", updateNavVisibility);
    };
  }, []);

  return (
    <>
      <div className="min-h-screen bg-white text-stone-900 dark:bg-stone-950 dark:text-stone-100">
        <header
          className={`fixed inset-x-0 top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur transition-[opacity,transform] duration-200 ease-out supports-[backdrop-filter]:bg-white/85 dark:border-stone-800 dark:bg-stone-950/95 dark:supports-[backdrop-filter]:bg-stone-950/85 ${
            showNav ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
          }`}
        >
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
          </section>

          <div
            ref={heroRef}
            role="img"
            aria-label="Illustration of a tomato, plate, knife, and pan on a blue background."
            className="group relative mt-8 aspect-video overflow-hidden rounded-lg border border-stone-200 bg-[#99d5f5] dark:border-stone-800"
          >
            <div className="absolute inset-0 bg-[linear-gradient(180deg,#75bef1_0%,#9ad8f4_58%,#b9e4f5_100%)] transition-transform duration-700 ease-out group-hover:scale-[1.015]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.24),transparent_34%)]" />
            <div className="relative flex h-full items-center justify-center">
              <div className="flex w-[76%] max-w-[720px] items-center justify-between gap-[clamp(20px,5vw,66px)] transition-transform duration-300 ease-out group-hover:-translate-y-1">
                <div className="relative aspect-square w-[17%] min-w-[70px] max-w-[128px] transition-transform duration-300 ease-out group-hover:rotate-[-2deg] group-hover:scale-105">
                  <div className="absolute inset-[10%] rounded-full bg-[#ff3b12] shadow-[inset_-14px_-16px_0_rgba(184,35,10,0.12),0_16px_26px_rgba(29,91,121,0.12)]" />
                  <div className="absolute left-[32%] top-[-2%] h-[36%] w-[12%] rounded-full bg-[#3f9406]" />
                  <div className="absolute left-[11%] top-[10%] h-[15%] w-[42%] rotate-[22deg] rounded-full bg-[#43a707]" />
                  <div className="absolute right-[10%] top-[11%] h-[15%] w-[42%] rotate-[-28deg] rounded-full bg-[#43a707]" />
                  <div className="absolute left-[33%] top-[7%] h-[16%] w-[34%] rounded-[70%_70%_45%_45%] bg-[#4aa90a]" />
                  <div className="absolute bottom-[22%] right-[19%] h-[42%] w-[13%] rotate-[17deg] rounded-full bg-[#cf260e]/55" />
                </div>

                <div className="relative aspect-[1.55] w-[26%] min-w-[112px] max-w-[190px] transition-transform duration-300 ease-out group-hover:translate-y-1 group-hover:scale-[1.03]">
                  <div className="absolute inset-[8%_4%] rounded-[50%] bg-[#fffdf2] shadow-[inset_0_0_0_8px_rgba(214,210,184,0.38),0_12px_22px_rgba(29,91,121,0.1)]" />
                  <div className="absolute inset-[24%_14%] rounded-[50%] bg-[#f4f0da]" />
                  <div className="absolute inset-x-[18%] top-[27%] h-[16%] rounded-full bg-white/45" />
                </div>

                <div className="relative aspect-[0.86] w-[15%] min-w-[72px] max-w-[118px] rotate-[39deg] transition-transform duration-300 ease-out group-hover:rotate-[45deg] group-hover:scale-105">
                  <div className="absolute left-[34%] top-[4%] h-[56%] w-[37%] rounded-[52%_52%_20%_20%] bg-[#dedede] shadow-[inset_-7px_0_0_rgba(132,132,132,0.24)]" />
                  <div className="absolute left-[49%] top-[12%] h-[36%] w-[5%] rounded-full bg-[#9d9d9d]" />
                  <div className="absolute left-[28%] top-[50%] h-[16%] w-[47%] rounded-[30%_30%_45%_45%] bg-[#c9c9c9]" />
                  <div className="absolute bottom-[3%] left-[25%] h-[47%] w-[34%] rounded-full bg-[#129832] shadow-[inset_-8px_-4px_0_rgba(0,101,33,0.18)]" />
                  <div className="absolute bottom-[30%] left-[37%] h-[7%] w-[7%] rounded-full bg-[#f7bd12]" />
                  <div className="absolute bottom-[16%] left-[41%] h-[7%] w-[7%] rounded-full bg-[#f7bd12]" />
                </div>

                <div className="relative aspect-[1.25] w-[22%] min-w-[96px] max-w-[164px] rotate-[8deg] transition-transform duration-300 ease-out group-hover:rotate-[3deg] group-hover:scale-105">
                  <div className="absolute bottom-[8%] left-[4%] h-[72%] w-[80%] rounded-full bg-[#075ee3] shadow-[inset_0_-10px_0_rgba(1,57,180,0.24),0_14px_24px_rgba(29,91,121,0.14)]" />
                  <div className="absolute bottom-[26%] left-[17%] h-[44%] w-[58%] rounded-full bg-[#ffba1c]" />
                  <div className="absolute right-[-4%] top-[4%] h-[24%] w-[44%] rotate-[-43deg] rounded-full bg-[#075ee3]" />
                  <div className="absolute bottom-[45%] left-[39%] h-[14%] w-[14%] rounded-full bg-[#ed7210]" />
                  <div className="absolute bottom-[39%] left-[58%] h-[13%] w-[13%] rounded-full bg-[#ed7210]" />
                  <div className="absolute bottom-[30%] left-[47%] h-[12%] w-[12%] rounded-full bg-[#ed7210]" />
                  <div className="absolute bottom-[33%] left-[22%] h-[10%] w-[12%] rounded-full bg-[#ef8b10]/75" />
                </div>
              </div>
            </div>
          </div>

          <section className="mt-[38px] max-w-[720px]">
            <p className="text-[17px] leading-[29px] text-stone-700 dark:text-stone-300">
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
                  className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-10"
                >
                  <div className="flex h-full flex-col">
                    <h3 className="font-sans text-[14px] font-medium leading-6 text-stone-500 dark:text-stone-400">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-[17px] leading-[29px] text-stone-950 dark:text-stone-50">
                      {step.description}
                    </p>
                    {index === steps.length - 1 && (
                      <p className="mt-auto pt-4 text-[13px] leading-5 text-stone-500 dark:text-stone-400">
                        If you want one to try first,{" "}
                        <a
                          href={BEEF_UDON_URL}
                          aria-label={
                            copied ? "Recipe link copied" : "Copy Just One Cookbook recipe link"
                          }
                          className={`${copied ? "copy-link-confirm " : ""}inline-block font-medium text-stone-700 underline underline-offset-4 transition-colors duration-150 ease-out hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 dark:text-stone-300 dark:hover:text-stone-50 dark:focus-visible:ring-stone-100 dark:focus-visible:ring-offset-stone-950`}
                          onClick={async (event) => {
                            event.preventDefault();
                            await navigator.clipboard.writeText(BEEF_UDON_URL);
                            setCopied(true);
                            window.setTimeout(() => setCopied(false), 1800);
                          }}
                        >
                          {copied ? "copied" : "copy Just One Cookbook"}
                        </a>{" "}
                        and credit them when you use it.
                      </p>
                    )}
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
