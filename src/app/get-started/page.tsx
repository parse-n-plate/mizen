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

const heroItems = [
  {
    src: "/assets/get-started/tomato-slice.png",
    alt: "Tomato slice.",
    width: 1024,
    height: 1024,
    className: "rotate-[-10deg] scale-[0.82] group-hover:rotate-[-14deg] group-hover:scale-[0.9]",
  },
  {
    src: "/assets/get-started/hero-pot.svg",
    alt: "Plate.",
    width: 248,
    height: 204,
    className:
      "rotate-[1deg] scale-[1.06] group-hover:translate-y-1 group-hover:rotate-[-1deg] group-hover:scale-[1.12]",
  },
  {
    src: "/assets/get-started/icon-prep.png",
    alt: "Knife.",
    width: 360,
    height: 360,
    className: "rotate-[4deg] scale-[0.92] group-hover:rotate-[10deg] group-hover:scale-100",
  },
  {
    src: "/assets/get-started/icon-cook.svg",
    alt: "Pan.",
    width: 1200,
    height: 1200,
    className: "rotate-[8deg] scale-[0.9] group-hover:rotate-[13deg] group-hover:scale-[0.98]",
  },
];

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
            aria-label="Mizen icons on a blue background."
            className="group relative mt-8 aspect-video overflow-hidden rounded-lg border border-stone-200 bg-[#99d5f5] dark:border-stone-800"
          >
            <div className="absolute inset-0 bg-[linear-gradient(180deg,#75bef1_0%,#9ad8f4_58%,#b9e4f5_100%)] transition-transform duration-700 ease-out group-hover:scale-[1.015]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.24),transparent_34%)]" />
            <div className="relative flex h-full items-center justify-center">
              <div className="flex w-[76%] max-w-[720px] items-center justify-between gap-[clamp(20px,5vw,66px)] transition-transform duration-300 ease-out group-hover:-translate-y-1">
                {heroItems.map((item, index) => (
                  <div
                    key={item.src}
                    className={`relative aspect-square w-[20%] min-w-[76px] max-w-[150px] transition-transform duration-300 ease-out ${item.className}`}
                  >
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      className="object-contain drop-shadow-[0_18px_24px_rgba(29,91,121,0.16)]"
                      sizes="(min-width: 1120px) 150px, 20vw"
                      priority={index === 0}
                    />
                  </div>
                ))}
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
