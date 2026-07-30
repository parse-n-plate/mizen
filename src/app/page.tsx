"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import Plain from "@solar-icons/react/csr/messages/Plain";
import { motion, AnimatePresence } from "motion/react";
import { useDialKit } from "dialkit";
import { getTheme, setTheme } from "@/lib/theme";
import { Search } from "@/components/Search";
import { RecentRecipes } from "@/components/RecentRecipes";
import { WaitlistRecipePreview } from "@/components/WaitlistRecipePreview";
import { BetaAuthModal } from "@/components/BetaAuthModal";
import { LandingAuthCta } from "@/components/LandingAuthCta";
import { WhoMadeIt } from "@/components/WhoMadeIt";
import { useRecipe } from "@/context/RecipeContext";
import { useUser } from "@/hooks/useUser";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { ParsedRecipe } from "@/lib/types";

const SOURCES = [
  { label: "Recipe Sites", shortLabel: "Sites", icon: "link", hint: "Paste any recipe URL" },
  { label: "ChatGPT", shortLabel: "ChatGPT", icon: "ai", hint: "Paste a recipe from ChatGPT" },
  { label: "Photos", shortLabel: "Photos", icon: "camera", hint: "Snap a photo of any recipe" },
] as const;

const CHATGPT_PASTED_TEXT = `Simple Homemade Chocolate

1/2 cup cocoa powder
1/4 cup melted coconut oil or cocoa butter
2-4 tbsp honey, maple syrup, or sugar (adjust to taste)
1/2 tsp vanilla extract
pinch of salt

Melt the coconut oil or cocoa butter until fully liquid. Stir in the cocoa powder until smooth and no lumps remain. Add the sweetener, vanilla, and a pinch of salt, then mix until fully combined — taste and adjust sweetness if needed. Pour into a mold or small lined container and refrigerate for 1–2 hours, until solid.`;

const LANDING_COPY = {
  sub: "One place for every recipe you find online. Clean ingredients, clear steps.",
  sourceLabel: "Bring recipes from",
};

function HeroHeadline() {
  return <>Recipes from anywhere, no clutter</>;
}

const EXAMPLE_RECIPES: ParsedRecipe[] = [
  {
    title: "Classic Carbonara",
    summary:
      "A rich, creamy Roman pasta made with eggs, cheese, guanciale, and black pepper — no cream needed.",
    author: "Bon Appetit",
    servings: 4,
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    totalTimeMinutes: 25,
    sourceUrl: "https://www.bonappetit.com/recipe/simple-carbonara",
    sourceSiteDescription:
      "Bon Appétit is a monthly food and entertaining magazine founded in 1956. Known for thoroughly tested recipes, restaurant reviews, and cooking videos with a loyal following.",
    commentConsensus:
      "Commenters love this recipe for its simplicity and authentic flavor. Many suggest using the full amount of pepper and reserving extra pasta water. A few note that guanciale can be hard to find — pancetta works in a pinch but changes the flavor. Consensus: a reliable weeknight go-to that tastes restaurant-quality.",
    ingredients: [
      {
        groupName: "Pasta",
        ingredients: [
          { amount: "1", units: "lb", ingredient: "spaghetti" },
          { amount: "", units: "", ingredient: "kosher salt" },
        ],
      },
      {
        groupName: "Sauce",
        ingredients: [
          { amount: "4", units: "oz", ingredient: "guanciale, cut into small pieces" },
          { amount: "4", units: "", ingredient: "large eggs" },
          { amount: "1", units: "cup", ingredient: "Pecorino Romano, finely grated" },
          { amount: "2", units: "tsp", ingredient: "freshly ground black pepper" },
        ],
      },
    ],
    instructions: [
      {
        title: "Boil pasta",
        detail:
          "Bring a large pot of salted water to a rolling boil. Cook spaghetti according to package directions until al dente. Reserve 1 cup of pasta water before draining.",
      },
      {
        title: "Crisp the guanciale",
        detail:
          "While pasta cooks, add guanciale to a cold skillet. Cook over medium heat, stirring occasionally, until the fat renders and pieces are golden and crispy, about 7 minutes.",
      },
      {
        title: "Make the sauce",
        detail:
          "In a bowl, whisk together eggs and Pecorino Romano until smooth. Season generously with black pepper.",
      },
      {
        title: "Combine",
        detail:
          "Add drained pasta to the skillet with guanciale (off heat). Pour egg mixture over pasta and toss vigorously, adding splashes of pasta water until you get a creamy, glossy coating. Serve immediately.",
      },
    ],
  },
  {
    title: "Simple Homemade Chocolate",
    summary:
      "Real chocolate from cocoa powder in about ten minutes of work — melt, mix, chill, eat.",
    author: "ChatGPT",
    servings: 6,
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    totalTimeMinutes: 75,
    ingredients: [
      {
        groupName: "Chocolate",
        ingredients: [
          { amount: "0.5", units: "cup", ingredient: "cocoa powder" },
          {
            amount: "0.25",
            units: "cup",
            ingredient: "melted coconut oil or cocoa butter",
          },
          {
            amount: "2-4",
            units: "tbsp",
            ingredient: "honey, maple syrup, or sugar (adjust to taste)",
          },
          { amount: "0.5", units: "tsp", ingredient: "vanilla extract" },
          { amount: "", units: "", ingredient: "pinch of salt" },
        ],
      },
    ],
    instructions: [
      {
        title: "Melt the fat",
        detail: "Melt the coconut oil or cocoa butter until fully liquid.",
      },
      {
        title: "Stir in cocoa",
        detail: "Stir in the cocoa powder until smooth and no lumps remain.",
      },
      {
        title: "Add sweetener and flavor",
        detail:
          "Add the sweetener, vanilla, and a pinch of salt. Mix until fully combined, then taste and adjust sweetness if needed.",
      },
      {
        title: "Pour and chill",
        detail:
          "Pour into a mold or a small lined container. Refrigerate for 1–2 hours, until solid.",
      },
    ],
  },
  {
    title: "Homemade White Bread",
    summary:
      "A classic from-scratch white bread with a soft crumb and golden crust — just flour, yeast, and a little patience.",
    author: "Grandma's Recipe Box",
    servings: 2,
    prepTimeMinutes: 30,
    cookTimeMinutes: 25,
    totalTimeMinutes: 180,
    sourceUrl: "https://recipecurio.com/handwritten-recipe-for-white-bread/",
    imageUrl: "/assets/homemade-white-bread-recipe.jpg",
    imageTranscription: `White Bread

6½ cups flour
3 tbsp sugar
1 tbsp salt
1 pkg dry yeast dissolved in ¼ cup lukewarm water
2 cups warm water
2 tbsp shortening

Measure flour into a bowl and make a well in the center. Add sugar and salt. Dissolve yeast in lukewarm water. Pour yeast and warm water into well. Stir rapidly in circular motion working outward until liquid is absorbed.

Work in shortening in small pieces. Turn onto floured surface. Knead until firm and elastic (about 10 min) using up to ½ cup more flour.

Place in greased bowl — turn to grease top. Cover with waxed paper then cloth. Let rise in warm draft-free place until doubled in bulk. Punch down. Let rise again until almost doubled.

Divide in half. Shape into loaves. Pierce each loaf about 4 times. Place in greased loaf pans. Cover. Let rise until just over double. Bake at 400° for 25 min.

Makes 2 loaves.`,
    ingredients: [
      {
        groupName: "Dough",
        ingredients: [
          { amount: "6.5", units: "cups", ingredient: "all-purpose flour, plus more for kneading" },
          { amount: "3", units: "tbsp", ingredient: "sugar" },
          { amount: "1", units: "tbsp", ingredient: "salt" },
          { amount: "1", units: "pkg", ingredient: "dry yeast" },
          { amount: "0.25", units: "cup", ingredient: "lukewarm water" },
          { amount: "2", units: "cups", ingredient: "warm water" },
          { amount: "2", units: "tbsp", ingredient: "shortening" },
        ],
      },
    ],
    instructions: [
      {
        title: "Mix the dough",
        detail:
          "Measure 6½ cups flour into a large bowl and make a well in the center. Add sugar and salt. Dissolve yeast in the lukewarm water, then pour into the well along with the warm water. Stir rapidly in a circular motion, working outward until the liquid is absorbed.",
      },
      {
        title: "Add shortening and knead",
        detail:
          "Work in the shortening in small pieces with your hands. Turn dough onto a floured surface and knead until firm and elastic, about 10 minutes, using up to ½ cup more flour as needed.",
      },
      {
        title: "First and second rise",
        detail:
          "Place dough in a greased bowl, turn to coat, and cover with waxed paper then a cloth. Let rise in a warm, draft-free spot until doubled in bulk. Punch down and let rise again until almost doubled.",
      },
      {
        title: "Shape and bake",
        detail:
          "Divide dough in half and shape into loaves. Pierce each loaf about 4 times to release air. Place in greased loaf pans, cover, and let rise until just over double. Bake in a preheated 400°F oven for 25 minutes.",
      },
    ],
  },
];

function UrlSourcePreview() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shadow-sm max-w-sm">
      <svg
        className="w-3.5 h-3.5 text-stone-400 flex-shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
      <span className="font-sans text-[13px] text-stone-500 dark:text-stone-400 truncate">
        bonappetit.com/recipe/simple-spaghetti-carbonara
      </span>
    </div>
  );
}

function PhotoSourcePreview() {
  return (
    <div className="flex flex-col items-center gap-3 max-w-[280px]">
      <div className="relative w-[240px] h-[160px] rounded-xl shadow-md overflow-hidden rotate-[-2deg]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/homemade-white-bread-recipe.jpg"
          alt="Handwritten recipe card"
          className="w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute bottom-2 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm">
          <svg
            className="w-3 h-3 text-stone-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
          <span className="font-sans text-[11px] text-stone-500 dark:text-stone-400">
            Handwritten recipe
          </span>
        </div>
      </div>
      <span className="font-serif text-xl italic text-stone-700 dark:text-stone-300 rotate-[-1deg]">
        Homemade White Bread
      </span>
    </div>
  );
}

function ChatGPTSourcePreview() {
  return (
    <div className="flex flex-col gap-3 max-w-xs w-full">
      {/* ChatGPT-style conversation bubble */}
      <div className="flex gap-2.5 items-start">
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#10a37f] flex items-center justify-center">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
          </svg>
        </div>
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="font-sans text-[11px] font-semibold text-stone-500 dark:text-stone-400">
            ChatGPT
          </span>
          <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-md bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
            <p className="font-sans text-[13px] text-stone-700 dark:text-stone-200 leading-snug">
              <span className="font-semibold">Simple Homemade Chocolate</span>
              <br />½ cup cocoa powder, ¼ cup coconut oil or cocoa butter, 2–4 tbsp honey, vanilla,
              pinch of salt...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const SOURCE_PREVIEWS = [UrlSourcePreview, ChatGPTSourcePreview, PhotoSourcePreview];

function SourceIcon({ type }: { type: "link" | "camera" | "chat" | "ai" }) {
  if (type === "link") {
    return (
      <svg
        className="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    );
  }
  if (type === "ai") {
    return (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
      </svg>
    );
  }
  if (type === "camera") {
    return (
      <svg
        className="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
        <circle cx="12" cy="13" r="3" />
      </svg>
    );
  }
  return (
    <svg
      className="w-3.5 h-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function AuthenticatedHome() {
  const { error, isLoading } = useRecipe();

  useEffect(() => {
    if (window.location.hash !== "#search") return;

    const searchSection = document.getElementById("search");
    searchSection?.scrollIntoView({ block: "center" });

    const input = searchSection?.querySelector("input");
    if (input instanceof HTMLInputElement) {
      input.focus();
    }
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-3xl flex-col gap-12">
        {/* Hero */}
        <div className="text-center">
          <h1 className="mb-8 font-serif text-[clamp(40px,8vw,72px)] font-bold leading-[1.1] text-stone-900 dark:text-stone-100">
            Clean recipes,
            <br />
            calm cooking.
          </h1>
          <p className="mx-auto max-w-md font-sans text-lg text-balance text-stone-500 dark:text-stone-400">
            Paste a recipe URL. Get a focused cooking experience.
          </p>
        </div>

        {/* Search */}
        <div id="search" className="w-full scroll-mt-24 flex flex-col items-center">
          <Search />

          {isLoading && (
            <p className="mt-6 font-sans text-sm text-center text-stone-400 dark:text-stone-500 animate-pulse">
              Parsing recipe...
            </p>
          )}

          {error && (
            <p className="mt-6 max-w-md mx-auto text-center font-sans text-sm text-red-500">
              {error}
            </p>
          )}
        </div>

        {/* Recent recipes */}
        <div className="w-full">
          <RecentRecipes />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { user, loading } = useUser();

  // Show toast for auth errors from /auth/callback redirects (query params)
  // or from Supabase error fragments (hash params, per Supabase docs).
  // Deferred to next frame so Sonner's <Toaster> is mounted before we fire.
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace("#", ""));
    const error = query.get("error") || hash.get("error_code");

    if (!error) return;

    // Clean up the URL immediately so a refresh doesn't re-trigger
    query.delete("error");
    const clean = query.toString();
    window.history.replaceState(null, "", clean ? `/?${clean}` : "/");

    // Defer toast so Sonner's Toaster is ready
    requestAnimationFrame(() => {
      if (error === "not-approved" || error === "signup_disabled") {
        toast.error("Your Google account isn\u2019t part of the beta yet.");
      } else if (error === "auth" || error.startsWith("4")) {
        toast.error("Sign-in failed. Please try again.");
      }
    });
  }, []);

  if (loading) return null;
  if (user) return <AuthenticatedHome />;
  return <WaitlistLanding />;
}

export function WaitlistLanding() {
  const [activeSource, setActiveSource] = useState(0);
  const [displayedSource, setDisplayedSource] = useState(0);
  const [displayedPreview, setDisplayedPreview] = useState(0);
  // Animation phases: "preview" → "absorb" → "populate" → "idle"
  // On exit: "exit" → then swap to "preview"
  const [phase, setPhase] = useState<"preview" | "absorb" | "populate" | "idle" | "exit">(
    "preview"
  );
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyOnList, setAlreadyOnList] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const dial = useDialKit("Theme", {
    mode: {
      type: "select",
      options: ["System", "Light", "Dark"],
      default: getTheme() === "dark" ? "Dark" : getTheme() === "light" ? "Light" : "System",
    },
  });

  // Sync theme from dial panel
  useEffect(() => {
    const map: Record<string, "system" | "light" | "dark"> = {
      System: "system",
      Light: "light",
      Dark: "dark",
    };
    const theme = map[dial.mode as string];
    if (theme) setTheme(theme);
  }, [dial.mode]);

  // Run the animation sequence whenever phase changes
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (phase === "preview") {
      // Source preview is visible, after a beat it absorbs into the card
      // On initial load, wait longer to account for page-fade-in delay
      timer = setTimeout(() => setPhase("absorb"), isInitialLoad ? 1200 : 650);
    } else if (phase === "absorb") {
      // Absorb animation plays, then recipe populates
      timer = setTimeout(() => setPhase("populate"), 300);
    } else if (phase === "populate") {
      // Stagger animation plays, then settle to idle
      timer = setTimeout(() => {
        setPhase("idle");
        setIsInitialLoad(false);
      }, 450);
    }
    return () => clearTimeout(timer);
  }, [phase, isInitialLoad]);

  const handleSourceChange = useCallback(
    (index: number) => {
      if (index === activeSource || phase === "exit") return;
      setPhase("exit");
      setActiveSource(index);
      // Swap source preview immediately — new one cross-fades in on top
      setDisplayedPreview(index);

      // Swap recipe content after exit animation completes (hidden behind overlay)
      setTimeout(() => {
        setDisplayedSource(index);
        setPhase("preview");
      }, 180);
    },
    [activeSource, phase]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;

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
      <div className="flex flex-col lg:flex-row min-h-screen lg:min-h-0 lg:h-screen lg:overflow-hidden flex-1">
        {/* Left panel */}
        <div className="relative flex flex-col justify-between lg:w-[38%] px-8 lg:px-12 xl:px-16 pt-12 lg:pt-5 pb-8 lg:pb-10 bg-white dark:bg-stone-950">
          {/* Top: Logo */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="group flex items-center gap-2 font-serif text-lg font-semibold text-stone-900 dark:text-stone-100"
            >
              <Image
                src="/apple-touch-icon.png"
                alt=""
                aria-hidden
                width={28}
                height={28}
                className="w-7 h-7 transition-transform duration-200 ease-out group-hover:rotate-[-8deg] group-hover:scale-110 motion-reduce:transition-none"
              />
              Mizen
            </Link>
            <LandingAuthCta onSignIn={() => setAuthOpen(true)} className="lg:hidden" />
          </div>

          {/* Center: Hero content */}
          <div className="flex-1 flex flex-col justify-center py-12 lg:py-0 lg:pb-16 lg:items-start items-center">
            <div className="w-full text-center lg:text-left">
              <h1 className="flex flex-col items-center gap-1 lg:items-start font-serif text-[clamp(32px,9vw,56px)] lg:text-[clamp(24px,2.6vw,44px)] xl:text-[clamp(32px,2.8vw,52px)] font-bold leading-[1.3] tracking-[-0.02em] text-stone-900 dark:text-stone-100 mb-5">
                <HeroHeadline />
              </h1>

              <p className="font-sans text-base lg:text-[17px] text-stone-500 dark:text-stone-400 leading-relaxed mb-8 max-w-[26rem] mx-auto lg:mx-0 text-balance">
                {LANDING_COPY.sub}
              </p>

              {/* Email form */}
              <form onSubmit={handleSubmit} className="max-w-md mx-auto lg:mx-0">
                <div className="flex items-center h-[52px] rounded-xl border border-[#E7E5E4] bg-[#F5F5F4] dark:border-stone-700 dark:bg-stone-900 overflow-clip shrink-0 focus-within:border-[#18a1f7] focus-within:ring-[3px] focus-within:ring-[#18a1f7]/30 transition-[border-color,box-shadow]">
                  {/* Input — collapses on success */}
                  <motion.div
                    initial={false}
                    animate={{
                      flex: submitted || alreadyOnList ? "0 0 0px" : "1 1 0%",
                      opacity: submitted || alreadyOnList ? 0 : 1,
                    }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    className="overflow-hidden min-w-0"
                  >
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required={!(submitted || alreadyOnList)}
                      disabled={submitted || alreadyOnList}
                      className="w-full bg-transparent font-sans text-[15px] text-stone-700 dark:text-stone-200 placeholder:text-[#A8A29E] dark:placeholder:text-stone-500 outline-none pl-5 leading-[18px] whitespace-nowrap"
                    />
                  </motion.div>

                  {/* Button — expands to fill, then shows success */}
                  <motion.button
                    type="submit"
                    disabled={submitting || submitted || alreadyOnList}
                    initial={false}
                    animate={{
                      flex: submitted || alreadyOnList ? "1 1 0%" : "0 0 auto",
                    }}
                    whileTap={
                      submitted || alreadyOnList || submitting ? undefined : { scale: 0.96 }
                    }
                    transition={{ duration: 0.25, ease: [0.77, 0, 0.175, 1] }}
                    className={`px-5 h-10 rounded-lg bg-[#18A1F7] font-sans text-[14px] text-[#ffffff] font-semibold leading-[18px] m-1.5 flex items-center justify-center gap-1.5 transition-[opacity] overflow-hidden ${
                      submitted || alreadyOnList
                        ? "!opacity-100 pointer-events-none"
                        : "hover:bg-[#1590de] disabled:opacity-60"
                    }`}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {submitted || alreadyOnList ? (
                        <motion.span
                          key="success"
                          initial={{ opacity: 0, scale: 0.96, y: 4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{
                            delay: 0.1,
                            duration: 0.2,
                            ease: [0.23, 1, 0.32, 1],
                          }}
                          className="flex items-center gap-2 whitespace-nowrap"
                        >
                          <svg
                            className="w-4 h-4 flex-shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          <span className="font-medium">
                            {alreadyOnList
                              ? "You\u2019re already on the list!"
                              : "You\u2019re on the list!"}
                          </span>
                        </motion.span>
                      ) : submitting ? (
                        <motion.span
                          key="sending"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
                          transition={{ duration: 0.1, ease: [0.23, 1, 0.32, 1] }}
                        >
                          Sending...
                        </motion.span>
                      ) : (
                        <motion.span
                          key="cta"
                          exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
                          transition={{ duration: 0.1, ease: [0.23, 1, 0.32, 1] }}
                          className="flex items-center gap-1.5"
                        >
                          <Plain size={16} weight="Bold" className="shrink-0" /> Notify Me
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </form>
            </div>
          </div>

          {/* Bottom: Free + Who made it (desktop only — on mobile this is a page footer) */}
          <div className="hidden lg:flex items-center justify-between">
            <span className="font-sans text-xs text-stone-400 dark:text-stone-500">
              Closed Beta v0.1.0
            </span>
            <WhoMadeIt />
          </div>
        </div>

        {/* Right panel */}
        <div className="relative flex-1 flex flex-col pt-6 lg:pt-0 bg-[#FAFAF9] dark:bg-stone-900 overflow-hidden">
          {/* Top nav */}
          <div className="hidden lg:flex items-center justify-end px-8 lg:px-10 pt-5 pb-2 relative z-20">
            <LandingAuthCta
              onSignIn={() => setAuthOpen(true)}
              className="hidden bg-white hover:bg-stone-50 lg:block"
            />
          </div>

          {/* Source tabs */}
          <div className="flex flex-col items-center gap-3 px-8 lg:px-10 pt-2 lg:pt-0 pb-5">
            <span className="font-sans text-sm text-stone-400 dark:text-stone-500">
              {LANDING_COPY.sourceLabel}
            </span>
            <div className="flex items-center gap-2">
              {SOURCES.map((source, i) => (
                <button
                  key={source.label}
                  onClick={() => handleSourceChange(i)}
                  className={`press-scale flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-sans text-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] ${
                    activeSource === i
                      ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border border-transparent"
                      : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600"
                  }`}
                >
                  <SourceIcon type={source.icon} />
                  <span className="sm:hidden whitespace-nowrap">{source.shortLabel}</span>
                  <span className="hidden sm:inline whitespace-nowrap">{source.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recipe card + source overlay */}
          <div className="relative flex-1 flex justify-center px-6 lg:px-10 pb-6 lg:pb-0">
            {/* Source input preview — overlaid on the recipe card */}
            {(phase === "preview" || phase === "absorb" || phase === "exit") && (
              <div className="absolute inset-x-6 lg:inset-x-10 top-0 bottom-6 lg:bottom-0 z-10 flex justify-center items-start pt-20 pointer-events-none">
                <div
                  key={`preview-${displayedPreview}`}
                  className={`flex justify-center items-center ${
                    phase === "absorb"
                      ? "source-absorb"
                      : isInitialLoad
                        ? "source-preview-enter-initial"
                        : "source-preview-enter"
                  }`}
                >
                  {(() => {
                    const Preview = SOURCE_PREVIEWS[displayedPreview];
                    return <Preview />;
                  })()}
                </div>
              </div>
            )}
            <div className="w-full max-w-2xl lg:max-w-3xl flex flex-col bg-white dark:bg-stone-950 rounded-xl lg:rounded-b-none shadow-lg border border-stone-200/60 dark:border-stone-700 lg:border-b-0 overflow-hidden">
              {/* Browser chrome — always visible */}
              <div className="flex overflow-clip w-full h-[41px] rounded-tl-[10px] rounded-tr-[10px] items-center gap-2 py-2.5 px-5 bg-white dark:bg-stone-900 shrink-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="rounded-full bg-[#DDDDDD] dark:bg-stone-700 shrink-0 size-3" />
                  <div className="rounded-full bg-[#DDDDDD] dark:bg-stone-700 shrink-0 size-3" />
                  <div className="rounded-full bg-[#DDDDDD] dark:bg-stone-700 shrink-0 size-3" />
                </div>
              </div>
              <div
                className={`flex-1 ${
                  phase === "exit"
                    ? "waitlist-recipe-exit"
                    : phase === "populate"
                      ? "waitlist-recipe-enter"
                      : phase === "idle"
                        ? ""
                        : "opacity-0"
                }`}
              >
                <WaitlistRecipePreview
                  key={displayedSource}
                  recipe={EXAMPLE_RECIPES[displayedSource]}
                  sourceType={(["url", "text", "photo"] as const)[displayedSource]}
                  pastedText={displayedSource === 1 ? CHATGPT_PASTED_TEXT : undefined}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile footer */}
        <div className="flex lg:hidden items-center justify-between px-8 py-6 bg-[#FAFAF9] dark:bg-stone-900">
          <span className="font-sans text-xs text-stone-400 dark:text-stone-500">
            Closed Beta v0.1.0
          </span>
          <WhoMadeIt borderColor="border-[#FAFAF9] dark:border-stone-900" />
        </div>
      </div>

      {isSupabaseConfigured && <BetaAuthModal open={authOpen} onOpenChange={setAuthOpen} />}
    </>
  );
}
