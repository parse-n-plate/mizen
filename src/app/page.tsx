"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import Plain from "@solar-icons/react/csr/messages/Plain";
import { motion, AnimatePresence } from "motion/react";
import { useDialKit } from "dialkit";
import { Search } from "@/components/Search";
import { RecentRecipes } from "@/components/RecentRecipes";
import { GettingStarted } from "@/components/GettingStarted";
import { WaitlistRecipePreview } from "@/components/WaitlistRecipePreview";
import { BetaAuthModal } from "@/components/BetaAuthModal";
import { WhoMadeIt } from "@/components/WhoMadeIt";
import { useRecipe } from "@/context/RecipeContext";
import { useUser } from "@/hooks/useUser";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { ParsedRecipe } from "@/lib/types";

const SOURCES = [
  { label: "URLs", icon: "link", hint: "Paste any recipe URL" },
  { label: "Recipe Photos", icon: "camera", hint: "Snap a photo of any recipe" },
  { label: "Text", icon: "chat", hint: "Forward a recipe from a text" },
] as const;

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
          "Measure 6\u00bd cups flour into a large bowl and make a well in the center. Add sugar and salt. Dissolve yeast in the lukewarm water, then pour into the well along with the warm water. Stir rapidly in a circular motion, working outward until the liquid is absorbed.",
      },
      {
        title: "Add shortening and knead",
        detail:
          "Work in the shortening in small pieces with your hands. Turn dough onto a floured surface and knead until firm and elastic, about 10 minutes, using up to \u00bd cup more flour as needed.",
      },
      {
        title: "First and second rise",
        detail:
          "Place dough in a greased bowl, turn to coat, and cover with waxed paper then a cloth. Let rise in a warm, draft-free spot until doubled in bulk. Punch down and let rise again until almost doubled.",
      },
      {
        title: "Shape and bake",
        detail:
          "Divide dough in half and shape into loaves. Pierce each loaf about 4 times to release air. Place in greased loaf pans, cover, and let rise until just over double. Bake in a preheated 400\u00b0F oven for 25 minutes.",
      },
    ],
  },
  {
    title: "Chocolate Chip Cookies",
    summary:
      "Thick, chewy chocolate chip cookies with crispy edges and gooey centers — the only recipe you need.",
    author: "Sally's Baking Addiction",
    servings: 36,
    prepTimeMinutes: 15,
    cookTimeMinutes: 12,
    totalTimeMinutes: 30,
    sourceUrl: "https://sallysbakingaddiction.com/chewy-chocolate-chip-cookies/",
    ingredients: [
      {
        groupName: "Dry ingredients",
        ingredients: [
          { amount: "2.25", units: "cups", ingredient: "all-purpose flour" },
          { amount: "1", units: "tsp", ingredient: "baking soda" },
          { amount: "1", units: "tsp", ingredient: "fine sea salt" },
          { amount: "1", units: "tsp", ingredient: "cornstarch" },
        ],
      },
      {
        groupName: "Wet ingredients",
        ingredients: [
          { amount: "0.75", units: "cup", ingredient: "unsalted butter, melted" },
          { amount: "0.75", units: "cup", ingredient: "packed light brown sugar" },
          { amount: "0.5", units: "cup", ingredient: "granulated sugar" },
          { amount: "2", units: "tsp", ingredient: "vanilla extract" },
          { amount: "1.25", units: "cups", ingredient: "chocolate chips" },
        ],
      },
    ],
    instructions: [
      {
        title: "Mix dry ingredients",
        detail:
          "Whisk together flour, baking soda, salt, and cornstarch in a medium bowl. Set aside.",
      },
      {
        title: "Make the dough",
        detail:
          "In a large bowl, whisk the melted butter, brown sugar, and granulated sugar until smooth. Beat in the egg and vanilla extract until combined.",
      },
      {
        title: "Combine and chill",
        detail:
          "Slowly mix the dry ingredients into the wet ingredients until just combined. Fold in the chocolate chips. Cover dough and refrigerate for at least 30 minutes (or up to 2 days).",
      },
      {
        title: "Bake",
        detail:
          "Preheat oven to 325\u00b0F (163\u00b0C). Scoop 1.5 tablespoon balls of dough onto lined baking sheets, spaced 2 inches apart. Bake for 12 minutes until edges are set but centers look undone. Cool on the pan for 10 minutes.",
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

function TextSourcePreview() {
  return (
    <div className="flex flex-col gap-2 max-w-xs w-full">
      {/* Incoming message */}
      <div className="self-start">
        <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-stone-200 dark:bg-stone-700">
          <p className="font-sans text-[13px] text-stone-800 dark:text-stone-200 leading-snug">
            You HAVE to make these cookies
          </p>
        </div>
      </div>
      {/* Incoming message — long */}
      <div className="self-start max-w-[85%]">
        <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-stone-200 dark:bg-stone-700">
          <p className="font-sans text-[13px] text-stone-800 dark:text-stone-200 leading-snug">
            2¼ cups flour, 1 tsp baking soda, 1 tsp salt, ¾ cup melted butter, ¾ cup brown sugar, ½
            cup white sugar, 2 tsp vanilla, 1¼ cups chocolate chips.
          </p>
        </div>
      </div>
      {/* Outgoing message */}
      <div className="self-end">
        <div className="px-3.5 py-2.5 rounded-2xl rounded-br-md bg-[#007AFF]">
          <p className="font-sans text-[13px] text-white leading-snug">
            perfect, saving this to mizen
          </p>
        </div>
      </div>
    </div>
  );
}

const SOURCE_PREVIEWS = [UrlSourcePreview, PhotoSourcePreview, TextSourcePreview];

function SourceIcon({ type }: { type: "link" | "camera" | "chat" }) {
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
  const { user } = useUser();

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-6">
        <div className="page-fade-in-up w-full max-w-3xl space-y-8 text-center">
          <h1 className="font-serif text-[clamp(40px,8vw,72px)] font-bold leading-[1.1] text-stone-900 dark:text-stone-100">
            Clean recipes,
            <br />
            calm cooking.
          </h1>
          <p className="page-fade-in-up page-fade-delay-1 mx-auto max-w-md font-sans text-lg text-balance text-stone-500 dark:text-stone-400">
            Paste a recipe URL. Get a focused cooking experience.
          </p>
        </div>

        <div className="page-fade-in-up page-fade-delay-2 mt-10 w-full flex justify-center">
          <Search />
        </div>

        {isLoading && (
          <p className="mt-6 font-sans text-sm text-stone-400 dark:text-stone-500 animate-pulse">
            Parsing recipe...
          </p>
        )}

        {error && (
          <p className="mt-6 max-w-md text-center font-sans text-sm text-red-500">{error}</p>
        )}

        <div className="mt-12 w-full flex justify-center">
          {user ? <RecentRecipes /> : <GettingStarted />}
        </div>
      </main>
    </div>
  );
}

export default function HomePage() {
  const { user, loading } = useUser();

  if (loading) return null;
  if (user) return <AuthenticatedHome />;
  return <WaitlistLanding />;
}

function WaitlistLanding() {
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
  const [hoveredSource, setHoveredSource] = useState<number | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const dial = useDialKit(
    "Waitlist",
    {
      source: {
        type: "select",
        options: ["URLs", "Recipe Photos", "Text"],
        default: "URLs",
      },
      replay: { type: "action", label: "Replay Animation" },
      "show success": { type: "action", label: "Show Success" },
      "reset form": { type: "action", label: "Reset Form" },
    },
    {
      onAction: (action) => {
        if (action === "replay") {
          setPhase("preview");
          setIsInitialLoad(false);
        } else if (action === "show success") {
          setSubmitted(true);
          setAlreadyOnList(false);
        } else if (action === "reset form") {
          setSubmitted(false);
          setAlreadyOnList(false);
          setEmail("");
        }
      },
    }
  );

  // Sync source selection from dial panel
  useEffect(() => {
    const sourceIndex = ["URLs", "Recipe Photos", "Text"].indexOf(dial.source as string);
    if (sourceIndex !== -1 && sourceIndex !== activeSource) {
      handleSourceChange(sourceIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dial.source]);

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
      <div className="page-reveal flex flex-col lg:flex-row min-h-screen lg:min-h-0 lg:h-screen lg:overflow-hidden flex-1">
        {/* Left panel */}
        <div className="relative flex flex-col justify-between lg:w-[38%] px-8 lg:px-12 xl:px-16 pt-12 lg:pt-5 pb-8 lg:pb-10 bg-white dark:bg-stone-950">
          {/* Top: Logo */}
          <div className="page-fade-in-up flex items-center justify-between">
            <Link
              href="/"
              className="group flex items-center gap-2 font-serif text-lg font-semibold text-stone-900 dark:text-stone-100"
            >
              <Image
                src="/assets/icons/Fish Logo.svg"
                alt=""
                aria-hidden
                width={28}
                height={28}
                className="w-7 h-7 transition-transform duration-200 ease-out group-hover:rotate-[-8deg] group-hover:scale-110 motion-reduce:transition-none"
              />
              Mizen
            </Link>
            {isSupabaseConfigured && (
              <button
                onClick={() => setAuthOpen(true)}
                className="lg:hidden px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 font-sans text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              >
                Sign in
              </button>
            )}
          </div>

          {/* Center: Hero content */}
          <div className="flex-1 flex flex-col justify-center py-12 lg:py-0 lg:pb-16 lg:items-start items-center">
            <div className="max-w-[30rem] text-center lg:text-left">
              <div className="page-fade-in-up page-fade-delay-1 mb-6">
                <span className="inline-block px-3 py-1 rounded-full border border-stone-200 dark:border-stone-700 font-sans text-xs text-stone-500 dark:text-stone-400">
                  Now in Early Access
                </span>
              </div>

              <h1 className="page-fade-in-up page-fade-delay-1 font-serif text-[clamp(36px,5vw,52px)] lg:text-[clamp(44px,3.5vw,56px)] font-bold leading-[1.08] tracking-[-0.02em] text-stone-900 dark:text-stone-100 mb-5">
                Save any recipe.
                <br />
                Cook it your way.
              </h1>

              <p className="page-fade-in-up page-fade-delay-2 font-sans text-base lg:text-[17px] text-stone-500 dark:text-stone-400 leading-relaxed mb-8 max-w-sm">
                Bring a{" "}
                <span
                  className="cursor-pointer underline decoration-transparent hover:decoration-stone-400 transition-colors"
                  onMouseEnter={() => setHoveredSource(0)}
                  onMouseLeave={() => setHoveredSource(null)}
                  onClick={() => handleSourceChange(0)}
                >
                  link
                </span>
                ,{" "}
                <span
                  className="cursor-pointer underline decoration-transparent hover:decoration-stone-400 transition-colors"
                  onMouseEnter={() => setHoveredSource(1)}
                  onMouseLeave={() => setHoveredSource(null)}
                  onClick={() => handleSourceChange(1)}
                >
                  photo
                </span>
                , or{" "}
                <span
                  className="cursor-pointer underline decoration-transparent hover:decoration-stone-400 transition-colors"
                  onMouseEnter={() => setHoveredSource(2)}
                  onMouseLeave={() => setHoveredSource(null)}
                  onClick={() => handleSourceChange(2)}
                >
                  text
                </span>
                . Get clean ingredients, clear steps, and nothing else.
              </p>

              {/* Email form */}
              <form onSubmit={handleSubmit} className="page-fade-in-up page-fade-delay-2">
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
          <div className="page-fade-in-up page-fade-delay-3 hidden lg:flex items-center justify-between">
            <span className="font-sans text-xs text-stone-400 dark:text-stone-500">
              Closed Beta v0.1.0
            </span>
            <WhoMadeIt />
          </div>
        </div>

        {/* Right panel */}
        <div className="relative flex-1 flex flex-col pt-6 lg:pt-0 bg-[#f5f5f0] dark:bg-stone-900 overflow-hidden">
          {/* Top nav */}
          <div className="page-fade-in-up hidden lg:flex items-center justify-end px-8 lg:px-10 pt-5 pb-2 relative z-20">
            {isSupabaseConfigured && (
              <button
                onClick={() => setAuthOpen(true)}
                className="hidden lg:block px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 font-sans text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              >
                Sign in
              </button>
            )}
          </div>

          {/* Source tabs */}
          <div className="page-fade-in-up page-fade-delay-1 flex flex-col items-center gap-3 px-8 lg:px-10 pt-2 lg:pt-0 pb-5">
            <span className="font-sans text-sm text-stone-400 dark:text-stone-500">
              Works with any source
            </span>
            <div className="flex items-center gap-2">
              {SOURCES.map((source, i) => (
                <button
                  key={source.label}
                  onClick={() => handleSourceChange(i)}
                  className={`press-scale flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-sans text-sm font-medium transition-[color,background-color,border-color,box-shadow] ${
                    activeSource === i
                      ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 border border-transparent"
                      : hoveredSource === i
                        ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-400 dark:border-stone-400 shadow-sm"
                        : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600"
                  }`}
                >
                  <SourceIcon type={source.icon} />
                  {source.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recipe card + source overlay */}
          <div className="page-fade-in-up page-fade-delay-3 relative flex-1 flex justify-center px-6 lg:px-10 pb-6 lg:pb-0">
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
                      ? "recipe-populate"
                      : phase === "idle"
                        ? ""
                        : "opacity-0"
                }`}
              >
                <WaitlistRecipePreview
                  key={displayedSource}
                  recipe={EXAMPLE_RECIPES[displayedSource]}
                  sourceType={(["url", "photo", "text"] as const)[displayedSource]}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile footer */}
        <div className="page-fade-in-up page-fade-delay-3 flex lg:hidden items-center justify-between px-8 py-6 bg-[#f5f5f0] dark:bg-stone-900">
          <span className="font-sans text-xs text-stone-400 dark:text-stone-500">
            Closed Beta v0.1.0
          </span>
          <WhoMadeIt borderColor="border-[#f5f5f0] dark:border-stone-900" />
        </div>
      </div>

      {isSupabaseConfigured && <BetaAuthModal open={authOpen} onOpenChange={setAuthOpen} />}
    </>
  );
}
