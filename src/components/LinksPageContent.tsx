"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import AltArrowRight from "@solar-icons/react/csr/arrows/AltArrowRight";
import Plain from "@solar-icons/react/csr/messages/Plain";
import { BetaAuthModal } from "@/components/BetaAuthModal";
import { LandingAuthCta } from "@/components/LandingAuthCta";
import {
  PublicPage,
  PublicHeader,
  PublicPageTitle,
  PublicFooter,
  publicPageContainer,
  publicPageWidths,
} from "@/components/PublicPage";
import { cn } from "@/lib/utils";
import { favoriteRecipes } from "@/lib/favorite-recipes";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

const connectCards = [
  {
    title: "Negi Studio's Website",
    href: "https://negi.studio/",
    image: "/assets/icons/negi-studio.svg",
    imageAlt: "",
  },
  {
    title: "Gage's LinkedIn",
    href: "https://www.linkedin.com/in/gageminamoto/",
    image: "/assets/avatars/Gage_Avatar_2026.jpg",
    imageAlt: "Gage",
  },
  {
    title: "Michelle's LinkedIn",
    href: "https://www.linkedin.com/in/michelle-tran-a48a14203/",
    image: "/assets/avatars/Michelle_Avatar_2026.jpg",
    imageAlt: "Michelle",
  },
];

export function LinksPageContent() {
  const [authOpen, setAuthOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyOnList, setAlreadyOnList] = useState(false);

  const handleWaitlistSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || submitting || submitted || alreadyOnList) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.message === "Already on the waitlist") {
          setAlreadyOnList(true);
        } else {
          setSubmitted(true);
        }
        setEmail("");
      } else {
        toast.error(data.error || "Something went wrong");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PublicPage>
        <PublicHeader
          currentPath="/links"
          action={<LandingAuthCta onSignIn={() => setAuthOpen(true)} />}
        />
        <main
          className={cn(publicPageContainer, publicPageWidths.compact, "flex-1 py-10 sm:py-14")}
        >
          <section className="grid gap-5 lg:grid-cols-2 lg:items-center">
            <div>
              <PublicPageTitle>Try Mizen early.</PublicPageTitle>
              <p className="mt-2 max-w-[420px] text-pretty font-sans text-[16px] leading-7 text-stone-600 dark:text-stone-300">
                Join the waitlist for access to clean recipe imports and a calmer cooking view.
              </p>
            </div>

            <form
              onSubmit={handleWaitlistSubmit}
              className="flex h-full w-full flex-col items-start justify-end"
            >
              <div className="flex min-h-[52px] w-full flex-col overflow-hidden rounded-[14px] border border-[#E7E5E4] bg-[#F5F5F4] focus-within:border-[#18a1f7] focus-within:ring-[3px] focus-within:ring-[#18a1f7]/30 dark:border-stone-700 dark:bg-stone-900 min-[420px]:flex-row">
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required={!(submitted || alreadyOnList)}
                  disabled={submitted || alreadyOnList}
                  className="min-h-[50px] min-w-0 flex-1 bg-transparent py-0 pl-5 pr-4 font-sans text-[15px] leading-[18px] text-stone-700 outline-none placeholder:text-[#A8A29E] disabled:opacity-0 dark:text-stone-200 dark:placeholder:text-stone-500"
                />
                <button
                  type="submit"
                  disabled={submitting || submitted || alreadyOnList}
                  className="m-1.5 inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] bg-[#18A1F7] px-5 font-sans text-[14px] font-semibold leading-[18px] text-white disabled:pointer-events-none disabled:opacity-80 min-[420px]:shrink-0"
                >
                  {submitted || alreadyOnList ? (
                    <span>{alreadyOnList ? "Already on the list" : "You're on the list"}</span>
                  ) : submitting ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <Plain size={16} weight="Bold" className="shrink-0" />
                      <span>Join waitlist</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          <div className="grid gap-8">
            <div className="w-full pt-8 sm:pt-10">
              <h2 className="pb-4 font-serif text-[24px] font-semibold leading-tight text-stone-950 dark:text-stone-50 sm:text-[28px]">
                Connect With Us
              </h2>
              <section
                aria-label="Mizen links"
                className="grid grid-cols-1 gap-3 min-[640px]:grid-cols-3 sm:gap-4"
              >
                {connectCards.map((card) => {
                  return (
                    <Link
                      key={card.title}
                      href={card.href}
                      target={
                        card.href.startsWith("http") || card.href.startsWith("mailto")
                          ? "_blank"
                          : undefined
                      }
                      rel={card.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="links-link-card group relative flex min-h-[174px] min-w-0 flex-col justify-between overflow-hidden rounded-[14px] border border-stone-200 bg-white p-4 text-stone-950 outline-none ring-stone-950/10 focus-visible:ring-4 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-50 sm:min-h-[190px] sm:p-5"
                    >
                      <div className="flex min-h-20 items-start justify-center gap-4 sm:min-h-24">
                        <div className="flex min-h-20 flex-1 justify-center sm:min-h-24">
                          {card.image && (
                            <div className="links-card-media relative h-20 w-20 overflow-hidden sm:h-24 sm:w-24">
                              <Image
                                src={card.image}
                                alt={card.imageAlt}
                                fill
                                sizes="96px"
                                className={
                                  card.imageAlt ? "rounded-full object-cover" : "object-contain"
                                }
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="relative z-10 mt-4">
                        <h3 className="flex min-w-0 items-center gap-1 font-serif text-[16px] font-semibold leading-6 text-stone-950 dark:text-stone-50">
                          <span className="min-w-0 break-words">{card.title}</span>
                          <AltArrowRight
                            size={16}
                            aria-hidden
                            className="links-card-title-arrow shrink-0 text-stone-900 dark:text-stone-100"
                          />
                        </h3>
                      </div>
                    </Link>
                  );
                })}
              </section>

              <section className="mt-8 sm:mt-10">
                <h2 className="max-w-[18rem] pb-4 font-serif text-[24px] font-semibold leading-tight text-stone-950 dark:text-stone-50 min-[420px]:max-w-none sm:text-[28px]">
                  Our favorite recipes.
                </h2>
                <div className="min-w-0 rounded-lg border border-stone-200 bg-white px-3 py-4 dark:border-stone-700 dark:bg-stone-900 sm:px-6 sm:py-5">
                  {favoriteRecipes.map((favorite) => (
                    <Link
                      key={favorite.title}
                      href={favorite.href}
                      className="group flex min-w-0 cursor-pointer items-center justify-between rounded-xl px-2 py-3.5 outline-none hover:bg-stone-200/60 focus-visible:ring-2 focus-visible:ring-[var(--color-blue)] focus-visible:ring-offset-2 dark:hover:bg-stone-700/35 sm:-mx-3 sm:px-3"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <Image
                          src={`https://www.google.com/s2/favicons?domain=${favorite.domain}&sz=32`}
                          alt=""
                          width={16}
                          height={16}
                          unoptimized
                          className="shrink-0 rounded-sm"
                        />
                        <div className="flex min-w-0 flex-1 flex-col min-[420px]:flex-row min-[420px]:items-baseline">
                          <span className="truncate font-serif text-base font-semibold leading-snug text-stone-900 dark:text-stone-50">
                            {favorite.title}
                          </span>
                          <span className="min-w-0 truncate font-sans text-[13px] text-stone-400 dark:text-stone-500 min-[420px]:ml-2">
                            {favorite.domain}
                          </span>
                        </div>
                      </div>
                      <div className="ml-2 flex shrink-0 items-center gap-1.5 sm:ml-4 sm:gap-2">
                        <Image
                          src={favorite.avatar}
                          alt={favorite.avatarAlt}
                          width={24}
                          height={24}
                          className="rounded-full object-cover"
                        />
                        <AltArrowRight size={16} aria-hidden className="text-stone-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </main>
        <PublicFooter />
      </PublicPage>

      {isSupabaseConfigured && <BetaAuthModal open={authOpen} onOpenChange={setAuthOpen} />}
    </>
  );
}
