"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { WaitlistRecipePreview } from "@/components/WaitlistRecipePreview";
import { AuthModal } from "@/components/AuthModal";
import { WhoMadeIt } from "@/components/WhoMadeIt";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { ParsedRecipe } from "@/lib/types";

const SOURCES = [
  { label: "URLs", icon: "link", hint: "Paste any recipe URL" },
  { label: "Recipe Photos", icon: "camera", hint: "Snap a photo of any recipe" },
  { label: "Text messages", icon: "chat", hint: "Forward a recipe from a text" },
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
      { title: "Boil pasta", detail: "Bring a large pot of salted water to a rolling boil. Cook spaghetti according to package directions until al dente. Reserve 1 cup of pasta water before draining." },
      { title: "Crisp the guanciale", detail: "While pasta cooks, add guanciale to a cold skillet. Cook over medium heat, stirring occasionally, until the fat renders and pieces are golden and crispy, about 7 minutes." },
      { title: "Make the sauce", detail: "In a bowl, whisk together eggs and Pecorino Romano until smooth. Season generously with black pepper." },
      { title: "Combine", detail: "Add drained pasta to the skillet with guanciale (off heat). Pour egg mixture over pasta and toss vigorously, adding splashes of pasta water until you get a creamy, glossy coating. Serve immediately." },
    ],
  },
  {
    title: "Thai Green Curry",
    summary:
      "A fragrant, coconut-based curry with tender chicken, Thai basil, and vegetables — faster than takeout.",
    author: "RecipeTin Eats",
    servings: 4,
    prepTimeMinutes: 10,
    cookTimeMinutes: 25,
    totalTimeMinutes: 35,
    sourceUrl: "https://www.recipetineats.com/thai-green-curry/",
    ingredients: [
      {
        groupName: "Curry",
        ingredients: [
          { amount: "1.5", units: "lbs", ingredient: "chicken thighs, sliced" },
          { amount: "3", units: "tbsp", ingredient: "green curry paste" },
          { amount: "1", units: "can", ingredient: "coconut milk" },
          { amount: "2", units: "tbsp", ingredient: "fish sauce" },
          { amount: "1", units: "cup", ingredient: "Thai basil leaves" },
          { amount: "1", units: "", ingredient: "red bell pepper, sliced" },
        ],
      },
      {
        groupName: "To serve",
        ingredients: [
          { amount: "3", units: "cups", ingredient: "jasmine rice, cooked" },
          { amount: "1", units: "", ingredient: "lime, cut into wedges" },
        ],
      },
    ],
    instructions: [
      { title: "Sauté the paste", detail: "Heat a large pot or wok over medium-high heat. Add 2 tablespoons of coconut cream (the thick part from the top of the can) and fry the curry paste for 1–2 minutes until fragrant." },
      { title: "Cook the chicken", detail: "Add sliced chicken thighs and stir to coat in the paste. Cook for 3–4 minutes until the outsides are sealed." },
      { title: "Simmer with coconut", detail: "Pour in the remaining coconut milk and fish sauce. Add the sliced bell pepper. Bring to a gentle boil, then reduce heat and simmer for 15 minutes until chicken is cooked through." },
      { title: "Finish and serve", detail: "Stir in Thai basil leaves and remove from heat. Serve over steamed jasmine rice with lime wedges on the side." },
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
      { title: "Mix dry ingredients", detail: "Whisk together flour, baking soda, salt, and cornstarch in a medium bowl. Set aside." },
      { title: "Make the dough", detail: "In a large bowl, whisk the melted butter, brown sugar, and granulated sugar until smooth. Beat in the egg and vanilla extract until combined." },
      { title: "Combine and chill", detail: "Slowly mix the dry ingredients into the wet ingredients until just combined. Fold in the chocolate chips. Cover dough and refrigerate for at least 30 minutes (or up to 2 days)." },
      { title: "Bake", detail: "Preheat oven to 325°F (163°C). Scoop 1.5 tablespoon balls of dough onto lined baking sheets, spaced 2 inches apart. Bake for 12 minutes until edges are set but centers look undone. Cool on the pan for 10 minutes." },
    ],
  },
];

function SourceIcon({ type }: { type: "link" | "camera" | "chat" }) {
  if (type === "link") {
    return (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    );
  }
  if (type === "camera") {
    return (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
        <circle cx="12" cy="13" r="3" />
      </svg>
    );
  }
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default function HomePage() {
  const [activeSource, setActiveSource] = useState(0);
  const [displayedSource, setDisplayedSource] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSourceDropdownOpen(false);
      }
    }
    if (sourceDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [sourceDropdownOpen]);
  const handleSourceChange = (index: number) => {
    if (index === activeSource || isAnimating) return;
    setIsAnimating(true);
    setActiveSource(index);

    // After exit animation, swap content and enter
    setTimeout(() => {
      setDisplayedSource(index);
      setIsAnimating(false);
    }, 200);
  };

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
        setSubmitted(true);
        setEmail("");
        toast.success(data.message || "You're on the list!");
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
      <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen lg:overflow-hidden">
        {/* Left panel */}
        <div className="relative flex flex-col justify-between lg:w-[38%] px-8 lg:px-12 xl:px-16 pt-12 lg:pt-5 pb-8 lg:pb-10 bg-white dark:bg-stone-950">
          {/* Top: Logo */}
          <div className="page-fade-in-up flex items-center justify-between">
            <Link href="/" className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
              Mizen
            </Link>
            {isSupabaseConfigured && (
              <button
                onClick={() => {
                  setAuthMode("login");
                  setAuthOpen(true);
                }}
                className="lg:hidden px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 font-sans text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              >
                Sign in
              </button>
            )}
          </div>

          {/* Center: Hero content */}
          <div className="flex-1 flex flex-col justify-center py-12 lg:py-0 lg:pb-16 lg:items-start items-center">
            <div className="max-w-md text-center lg:text-left">
              <div className="page-fade-in-up page-fade-delay-1 mb-6">
                <span className="inline-block px-3 py-1 rounded-full border border-stone-200 dark:border-stone-700 font-sans text-xs text-stone-500 dark:text-stone-400">
                  Now in early access
                </span>
              </div>

              <h1 className="page-fade-in-up page-fade-delay-1 font-serif text-[clamp(36px,5vw,52px)] lg:text-[clamp(44px,3.5vw,56px)] font-bold leading-[1.08] tracking-[-0.02em] text-stone-900 dark:text-stone-100 mb-5">
                Save any recipe.
                <br />
                Cook it your way.
              </h1>

              <p className="page-fade-in-up page-fade-delay-2 font-sans text-base lg:text-[17px] text-stone-500 dark:text-stone-400 leading-relaxed mb-8 max-w-sm">
                Bring a link, photo, or text. Get clean ingredients, clear steps, and nothing else.
              </p>

              {/* Email form */}
              <form onSubmit={handleSubmit} className="page-fade-in-up page-fade-delay-2">
                {submitted ? (
                  <div className="flex items-center gap-2 h-[52px] px-4 rounded-full border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    <span className="font-sans text-sm text-stone-600 dark:text-stone-300">
                      You&apos;re on the list! We&apos;ll be in touch.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center h-[52px] rounded-xl border border-[#E7E5E4] bg-[#F5F5F4] dark:border-stone-700 dark:bg-stone-900 gap-3 overflow-clip shrink-0 focus-within:border-stone-400 dark:focus-within:border-stone-500 transition-colors">
                    <input
                      type="email"
                      placeholder="Enter email address..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="flex-1 bg-transparent font-sans text-[15px] text-stone-700 dark:text-stone-200 placeholder:text-[#A8A29E] dark:placeholder:text-stone-500 outline-none min-w-0 pl-5 leading-[18px]"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="press-scale flex-shrink-0 h-10 px-6 rounded-lg bg-[#18A1F7] text-white font-sans text-[14px] font-semibold leading-[18px] transition-colors hover:bg-[#1590de] disabled:opacity-60 m-1.5"
                    >
                      {submitting ? "Joining..." : "Join Waitlist"}
                    </button>
                  </div>
                )}
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
          <div className="page-fade-in-up hidden lg:flex items-center justify-between px-8 lg:px-10 py-5 relative z-20">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setSourceDropdownOpen(!sourceDropdownOpen)}
                className="flex items-center gap-1.5 font-sans text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
              >
                <SourceIcon type={SOURCES[displayedSource].icon} />
                {SOURCES[displayedSource].hint}
                <svg className={`w-3.5 h-3.5 transition-transform ${sourceDropdownOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {sourceDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 py-1 bg-white dark:bg-stone-800 rounded-lg shadow-lg border border-stone-200 dark:border-stone-700 z-50 whitespace-nowrap">
                  {SOURCES.map((source, i) => (
                    <button
                      key={source.label}
                      onClick={() => {
                        handleSourceChange(i);
                        setSourceDropdownOpen(false);
                      }}
                      className={`flex items-center gap-2.5 w-full text-left px-4 pr-8 py-2.5 font-sans text-sm transition-colors ${
                        displayedSource === i
                          ? "text-stone-900 dark:text-stone-100 bg-stone-50 dark:bg-stone-700/50"
                          : "text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700/30"
                      }`}
                    >
                      <SourceIcon type={source.icon} />
                      {source.hint}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {isSupabaseConfigured && (
              <button
                onClick={() => {
                  setAuthMode("login");
                  setAuthOpen(true);
                }}
                className="hidden lg:block font-sans text-sm font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
              >
                Sign in
              </button>
            )}
          </div>

          {/* Source tabs */}
          <div className="page-fade-in-up page-fade-delay-1 flex flex-col items-center gap-3 px-8 lg:px-10 pt-2 lg:pt-0 pb-8 lg:pb-5">
            <span className="font-sans text-sm text-stone-400 dark:text-stone-500">
              Works with any source
            </span>
            <div className="flex items-center gap-2">
              {SOURCES.map((source, i) => (
                <button
                  key={source.label}
                  onClick={() => handleSourceChange(i)}
                  className={`press-scale flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-sans text-sm transition-all ${
                    activeSource === i
                      ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-medium"
                      : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-600"
                  }`}
                >
                  <SourceIcon type={source.icon} />
                  {source.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recipe card */}
          <div className="page-fade-in-up page-fade-delay-2 flex-1 flex justify-center px-6 lg:px-10 pb-6 lg:pb-0">
            <div className="w-full max-w-2xl lg:max-w-3xl bg-white dark:bg-stone-950 rounded-xl lg:rounded-b-none shadow-lg border border-stone-200/60 dark:border-stone-700 lg:border-b-0 overflow-hidden">
              {/* Browser chrome — static, outside animation */}
              <div className="flex overflow-clip w-full h-[41px] rounded-tl-[10px] rounded-tr-[10px] items-center gap-2 py-2.5 px-5 bg-white shrink-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="rounded-full bg-[#DDDDDD] shrink-0 size-3" />
                  <div className="rounded-full bg-[#DDDDDD] shrink-0 size-3" />
                  <div className="rounded-full bg-[#DDDDDD] shrink-0 size-3" />
                </div>
              </div>
              <div
                key={displayedSource}
                className={isAnimating ? "waitlist-recipe-exit" : "waitlist-recipe-enter"}
              >
                <WaitlistRecipePreview recipe={EXAMPLE_RECIPES[displayedSource]} />
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

      {isSupabaseConfigured && (
        <AuthModal open={authOpen} onOpenChange={setAuthOpen} initialMode={authMode} />
      )}
    </>
  );
}
