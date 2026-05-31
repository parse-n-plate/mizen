"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, Camera, ChevronDown, LinkIcon, MessageCircle, Upload } from "lucide-react";
import { WaitlistRecipePreview } from "@/components/WaitlistRecipePreview";
import { BetaAuthModal } from "@/components/BetaAuthModal";
import { LandingAuthCta } from "@/components/LandingAuthCta";
import { WhoMadeIt } from "@/components/WhoMadeIt";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { ParsedRecipe } from "@/lib/types";

const carbonaraRecipe: ParsedRecipe = {
  title: "Classic Carbonara",
  summary:
    "A rich, creamy Roman pasta made with eggs, cheese, guanciale, and black pepper, no cream needed.",
  author: "Bon Appetit",
  servings: 4,
  prepTimeMinutes: 10,
  cookTimeMinutes: 15,
  totalTimeMinutes: 25,
  sourceUrl: "https://www.bonappetit.com/recipe/simple-carbonara",
  imageUrl: "/assets/homemade-white-bread-recipe.jpg",
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
        "Bring salted water to a boil. Cook spaghetti until al dente, reserving 1 cup pasta water before draining.",
    },
    {
      title: "Crisp the guanciale",
      detail:
        "Cook guanciale in a skillet until the fat renders and pieces are golden, about 7 minutes.",
    },
    {
      title: "Make the sauce",
      detail: "Whisk eggs and Pecorino Romano until smooth. Season generously with black pepper.",
    },
  ],
};

const chickenRecipe: ParsedRecipe = {
  title: "Honey Garlic Chicken Thighs",
  summary: "Honey garlic chicken thighs with soy sauce and cilantro.",
  author: "Allrecipes",
  servings: 8,
  prepTimeMinutes: 10,
  cookTimeMinutes: 20,
  totalTimeMinutes: 30,
  sourceUrl: "https://www.allrecipes.com/recipe/honey-garlic-chicken-thighs",
  ingredients: [
    {
      groupName: "Chicken",
      ingredients: [
        { amount: "8", units: "", ingredient: "boneless chicken thighs" },
        { amount: "", units: "", ingredient: "salt and ground black pepper to taste" },
        { amount: "2", units: "tbsp", ingredient: "olive oil, or as needed" },
        { amount: "1/2", units: "", ingredient: "medium onion, finely chopped" },
        { amount: "7", units: "cloves", ingredient: "garlic, chopped" },
      ],
    },
  ],
  instructions: [
    {
      title: "Brown chicken",
      detail: "Season chicken thighs and brown them in olive oil on both sides.",
    },
  ],
};

type ImportMode = "url" | "text" | "photo";

const sourceTypes: {
  label: string;
  sourceType: ImportMode;
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}[] = [
  { label: "Recipe URL", sourceType: "url", icon: LinkIcon },
  { label: "Chats", sourceType: "text", icon: MessageCircle },
  { label: "Photos", sourceType: "photo", icon: Camera },
];

const faqs = [
  {
    question: "Is Mizen a recipe app or an importer?",
    answer:
      "Both. It starts by importing messy recipes, then gives you a cleaner place to cook and revisit them.",
  },
  {
    question: "What can I add?",
    answer:
      "Recipe URLs, copied recipes from chats or notes, and photos of recipe cards or cookbook pages.",
  },
  {
    question: "Does it replace the original source?",
    answer:
      "No. Mizen keeps the source attached so you can return to the original when you want context.",
  },
  {
    question: "Why early access?",
    answer:
      "The product is still small. Early cooks help tune imports, cooking details, and the cookbook experience.",
  },
];

function ImportSourcePreview({
  source,
  imageSrc = "/assets/homemade-white-bread-recipe.jpg",
  imageName = "Handwritten white bread recipe card",
}: {
  source: "image" | "url" | "text";
  imageSrc?: string;
  imageName?: string;
}) {
  if (source === "url") {
    return (
      <div className="flex aspect-[1.55] items-center justify-center p-6">
        <div className="flex max-w-sm items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 shadow-sm dark:border-stone-700 dark:bg-stone-900">
          <LinkIcon
            size={14}
            strokeWidth={2}
            className="shrink-0 text-stone-400 dark:text-stone-500"
          />
          <span className="truncate text-[13px] leading-5 text-stone-500 dark:text-stone-400">
            justonecookbook.com/beef-udon
          </span>
        </div>
      </div>
    );
  }

  if (source === "text") {
    return (
      <div className="flex aspect-[1.55] items-center justify-center p-6">
        <div className="flex w-full max-w-xs gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950">
            <MessageCircle size={15} strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold leading-4 text-stone-500 dark:text-stone-400">
              Messages
            </span>
            <div className="mt-1.5 rounded-2xl rounded-tl-md border border-stone-200 bg-white px-3.5 py-2.5 shadow-sm dark:border-stone-700 dark:bg-stone-900">
              <p className="text-[13px] leading-snug text-stone-700 dark:text-stone-300">
                <span className="font-semibold">White bread</span>
                <br />6 1/2 cups flour, sugar, salt, yeast, warm water, shortening...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-1 items-center justify-center p-3 sm:p-5">
      <div
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData("text/plain", "homemade-white-bread-recipe.jpg");
          event.dataTransfer.effectAllowed = "copy";
        }}
        className="relative h-[220px] w-[328px] max-w-[92%] rotate-[-2deg] cursor-grab overflow-hidden rounded-xl shadow-md active:cursor-grabbing sm:h-[250px] sm:w-[372px]"
      >
        {imageSrc.startsWith("blob:") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt={imageName} className="h-full w-full object-cover" draggable />
        ) : (
          <Image
            src={imageSrc}
            alt={imageName}
            width={500}
            height={336}
            className="h-full w-full object-cover"
            sizes="(min-width: 640px) 372px, 328px"
            draggable
          />
        )}
        <div className="absolute bottom-2 left-3 flex items-center gap-1.5 rounded-md bg-white/85 px-2 py-1 backdrop-blur-sm dark:bg-stone-950/80">
          <Camera size={12} strokeWidth={2} className="text-stone-500 dark:text-stone-400" />
          <span className="text-[11px] leading-4 text-stone-500 dark:text-stone-300">
            Handwritten recipe
          </span>
        </div>
      </div>
    </div>
  );
}

function BrowserFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`min-w-0 overflow-hidden rounded-t-[14px] border border-b-0 border-stone-200/80 bg-white shadow-[0_10px_28px_rgba(41,37,36,0.10)] dark:border-stone-800 dark:bg-stone-950 dark:shadow-[0_18px_42px_rgba(0,0,0,0.35)] ${className}`}
    >
      <div className="flex h-10 items-center gap-1.5 border-b border-stone-100 px-5 dark:border-stone-800">
        <span className="h-3 w-3 rounded-full bg-stone-200 dark:bg-stone-700" />
        <span className="h-3 w-3 rounded-full bg-stone-200 dark:bg-stone-700" />
        <span className="h-3 w-3 rounded-full bg-stone-200 dark:bg-stone-700" />
      </div>
      {children}
    </div>
  );
}

function RecipeCardPreview({
  recipe,
  compact = false,
  sourceType = "url",
}: {
  recipe: ParsedRecipe;
  compact?: boolean;
  sourceType?: ImportMode;
}) {
  const ingredients = recipe.ingredients.flatMap((group) => group.ingredients).slice(0, 5);

  return (
    <BrowserFrame
      className={`w-full ${compact ? "max-h-[400px]" : "h-[620px] sm:h-[680px] lg:h-[660px]"}`}
    >
      <div className="block p-5 sm:hidden">
        <h3 className="font-serif text-[22px] font-bold leading-[30px] tracking-[-0.02em] text-stone-900 dark:text-stone-50">
          {recipe.title}
        </h3>
        <p className="mt-2 text-[13px] leading-[22px] text-stone-500 dark:text-stone-400">
          {recipe.summary}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[12px] leading-4 text-stone-500 dark:text-stone-400">
          <span>{recipe.author}</span>
          <span>Serves {recipe.servings}</span>
          <span>{recipe.prepTimeMinutes} min prep</span>
        </div>
        <div className="mt-5 border-t border-stone-100 pt-4 dark:border-stone-800">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-400 dark:text-stone-500">
            Ingredients
          </p>
          <div className="mt-3 divide-y divide-stone-100 dark:divide-stone-800">
            {ingredients.map((item) => (
              <div
                key={`${item.ingredient}-${item.amount}`}
                className="flex items-center gap-3 py-3"
              >
                <span className="h-4 w-4 rounded border border-stone-200 dark:border-stone-700" />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium leading-[20px] text-stone-800 dark:text-stone-200">
                  {item.ingredient}
                </span>
                <span className="shrink-0 text-[12px] leading-4 text-stone-400 dark:text-stone-500">
                  {[item.amount, item.units].filter(Boolean).join(" ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="hidden h-full w-full sm:block">
        <WaitlistRecipePreview
          recipe={recipe}
          sourceType={sourceType}
          disableScroll
          showSourceAttachment={!compact}
        />
      </div>
    </BrowserFrame>
  );
}

function ImportMockup() {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("homemade-white-bread-recipe.jpg");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    setFileName(file.name);
    setPreviewUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return URL.createObjectURL(file);
    });
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div
      className="mx-auto flex aspect-square w-full flex-col overflow-hidden rounded-[4px] bg-stone-50 p-5 sm:p-7 dark:bg-stone-900 md:max-w-[492px]"
      style={{ clipPath: "inset(0 round 4px)" }}
    >
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={`mx-auto flex h-full w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border border-dashed px-4 py-5 transition-[background-color,border-color,box-shadow] ${
          isDragging
            ? "border-stone-400 bg-white shadow-[0_0_0_4px_rgba(41,37,36,0.08)] dark:border-stone-500 dark:bg-stone-950 dark:shadow-[0_0_0_4px_rgba(255,255,255,0.08)]"
            : "border-stone-200 bg-white/70 hover:border-stone-300 hover:bg-white dark:border-stone-700 dark:bg-stone-950/70 dark:hover:border-stone-600 dark:hover:bg-stone-950"
        }`}
      >
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => handleFiles(event.target.files)}
        />
        <ImportSourcePreview
          source="image"
          imageSrc={previewUrl ?? "/assets/homemade-white-bread-recipe.jpg"}
          imageName={fileName}
        />
        <span className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-stone-100 bg-white px-3 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
            <Upload size={15} strokeWidth={2.25} />
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px] leading-[18px] text-stone-500 dark:text-stone-400">
            {isDragging ? "Drop image to import" : fileName}
          </span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950">
            <ArrowRight size={15} strokeWidth={2.5} />
          </span>
        </span>
      </label>
    </div>
  );
}

function CleaningMockup() {
  return (
    <div
      className="mx-auto flex aspect-square w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-[4px] bg-stone-50 p-6 dark:bg-stone-900 sm:p-8 md:max-w-[488px]"
      style={{ clipPath: "inset(0 round 4px)" }}
    >
      <div className="cleaning-mockup-card w-full max-w-[440px] rounded-2xl border border-stone-200 bg-white p-1 shadow-sm dark:border-stone-700 dark:bg-stone-950">
        <div className="overflow-hidden rounded-xl">
          <div className="flex h-12 items-center gap-3 px-4">
            <span className="min-w-0 flex-1 truncate text-[13px] leading-[18px] text-stone-400 dark:text-stone-500">
              https://www.justonecookbook.com/beef-udon/
            </span>
            <span className="cleaning-mockup-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950">
              <ArrowRight size={16} strokeWidth={2.5} />
            </span>
          </div>
        </div>
      </div>
      <div className="h-1 w-full max-w-[360px] overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
        <div className="cleaning-mockup-progress h-full w-full rounded-full bg-stone-900 dark:bg-stone-100" />
      </div>
    </div>
  );
}

function StepSection({
  eyebrow,
  title,
  body,
  reverse = false,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  reverse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto grid w-full max-w-[1248px] grid-cols-1 items-center gap-10 px-6 py-14 sm:px-10 md:grid-cols-2 md:gap-16 lg:px-16 lg:py-20">
      <div className={`max-w-[548px] ${reverse ? "md:order-2 md:justify-self-end" : ""}`}>
        <span className="inline-flex h-9 items-center rounded-full bg-stone-100 px-4 text-[13px] font-medium leading-[18px] text-stone-500 dark:bg-stone-900 dark:text-stone-400">
          {eyebrow}
        </span>
        <h2 className="mt-6 font-serif text-[30px] font-bold leading-[38px] tracking-[-0.02em] text-stone-900 dark:text-stone-50 sm:text-[36px] sm:leading-[44px]">
          {title}
        </h2>
        <p className="mt-5 max-w-[560px] text-[15px] leading-[25px] text-stone-600 dark:text-stone-300 sm:text-[16px] sm:leading-[26px]">
          {body}
        </p>
      </div>
      <div className={`min-w-0 ${reverse ? "md:order-1" : ""}`}>{children}</div>
    </section>
  );
}

function WaitlistForm({
  compact = false,
  id = compact ? "footer-email" : "hero-email",
}: {
  compact?: boolean;
  id?: string;
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || submitting) return;

    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Something went wrong");
        return;
      }

      setEmail("");
      setMessage(
        data.message === "Already on the waitlist"
          ? "You are already on the list."
          : "You are on the list."
      );
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex w-full items-center gap-2 rounded-xl bg-stone-100 p-1.5 dark:bg-stone-900 ${compact ? "max-w-[320px]" : "max-w-[430px]"}`}
    >
      <label className="sr-only" htmlFor={id}>
        Email address
      </label>
      <input
        id={id}
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Enter email address..."
        className="min-h-10 min-w-0 flex-1 bg-transparent px-3 text-[16px] text-stone-900 outline-none placeholder:text-stone-400 dark:text-stone-100 dark:placeholder:text-stone-500 sm:text-[13px]"
      />
      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-[#18A1F7] px-5 text-[13px] font-semibold leading-[18px] text-white transition-colors hover:bg-[#0f8fdf] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18A1F7] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Joining..." : "Join Waitlist"}
      </button>
      {message && (
        <span className="sr-only" role="status">
          {message}
        </span>
      )}
    </form>
  );
}

function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="divide-y divide-stone-100 dark:divide-stone-800">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;

        return (
          <div key={faq.question} className="first:pt-0">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              aria-expanded={isOpen}
              className="group flex w-full items-center justify-between gap-5 py-6 text-left transition-opacity hover:opacity-80"
            >
              <h3 className="font-sans text-base font-semibold leading-6 text-stone-900 dark:text-stone-100">
                {faq.question}
              </h3>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500 transition-colors group-hover:bg-stone-200 dark:bg-stone-900 dark:text-stone-400 dark:group-hover:bg-stone-800">
                <ChevronDown
                  size={16}
                  strokeWidth={2.25}
                  className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </span>
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <p className="pb-6 text-[16px] leading-[25px] text-stone-600 dark:text-stone-300">
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WaitlistLanding() {
  const [authOpen, setAuthOpen] = useState(false);
  const [activeSourceType, setActiveSourceType] = useState<ImportMode>("url");

  return (
    <>
      <div className="landing-scroll min-h-screen bg-white text-stone-800 dark:bg-stone-950 dark:text-stone-200">
        <main>
          <div className="bg-stone-50 dark:bg-stone-950">
            <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 dark:border-stone-800 dark:bg-stone-950/95 dark:supports-[backdrop-filter]:bg-stone-950/85">
              <nav className="mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:h-[88px] lg:px-[72px]">
                <Link href="/" className="group flex min-w-0 items-center gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <Image
                      src="/assets/icons/Fish Logo.svg"
                      alt=""
                      aria-hidden
                      width={28}
                      height={28}
                      className="h-7 w-7 shrink-0 transition-transform duration-200 ease-out group-hover:rotate-[-8deg] group-hover:scale-110 motion-reduce:transition-none"
                    />
                    <span className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-50">
                      Mizen
                    </span>
                  </span>
                  <span className="h-5 w-px bg-stone-300 dark:bg-stone-700" />
                  <span className="truncate text-[13px] font-medium leading-[18px] text-stone-500 dark:text-stone-400">
                    Early access guide
                  </span>
                </Link>
                <div className="flex items-center gap-3 sm:gap-6">
                  <LandingAuthCta onSignIn={() => setAuthOpen(true)} signedInLabel="Go to app" />
                </div>
              </nav>
            </header>

            <section className="overflow-hidden">
              <div className="mx-auto grid min-h-[720px] w-full max-w-[1440px] grid-cols-1 gap-12 px-6 pt-14 sm:px-10 lg:grid-cols-[minmax(0,413px)_minmax(0,768px)] lg:gap-[12vw] lg:px-[72px] lg:pt-[72px] xl:gap-[170px]">
                <div className="flex flex-col justify-between gap-12 pb-0 lg:pb-[72px]">
                  <div>
                    <h1 className="max-w-[340px] text-balance font-serif text-[40px] font-bold leading-[44px] tracking-[-0.02em] text-stone-900 dark:text-stone-50 sm:max-w-[520px] sm:text-[52px] sm:leading-[68px]">
                      Get started with Mizen.
                    </h1>
                    <p className="mt-5 max-w-[340px] text-pretty text-[16px] leading-[26px] text-stone-600 dark:text-stone-300 sm:max-w-[590px] sm:text-[17px] sm:leading-[28px]">
                      Use this guide when you first get access. Add a recipe, check the import, and
                      cook from one clean view.
                    </p>
                  </div>
                  <div className="flex flex-col gap-5 sm:gap-6">
                    {sourceTypes.map(({ label, sourceType, icon: Icon }) => (
                      <button
                        key={label}
                        type="button"
                        onMouseEnter={() => setActiveSourceType(sourceType)}
                        onFocus={() => setActiveSourceType(sourceType)}
                        onClick={() => setActiveSourceType(sourceType)}
                        aria-pressed={activeSourceType === sourceType}
                        className={`group flex min-h-10 cursor-default items-center gap-3 text-left transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-400 dark:focus-visible:outline-stone-500 ${
                          activeSourceType === sourceType
                            ? "text-stone-900 dark:text-stone-50"
                            : "text-stone-500 hover:text-stone-800 dark:text-stone-500 dark:hover:text-stone-200"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${
                            activeSourceType === sourceType
                              ? "text-stone-900 dark:text-stone-50"
                              : "text-stone-400 group-hover:text-stone-700 dark:text-stone-600 dark:group-hover:text-stone-300"
                          }`}
                        >
                          <Icon size={18} strokeWidth={2} />
                        </span>
                        <span className="text-base font-semibold leading-7 sm:text-lg">
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="min-w-0 self-end lg:pt-0">
                  <RecipeCardPreview recipe={carbonaraRecipe} sourceType={activeSourceType} />
                </div>
              </div>
            </section>
          </div>

          <StepSection
            eyebrow="URL"
            title="Bring the recipe in."
            body="Paste a URL, drop in copied text, or add a photo from a notebook, cookbook, or family card."
          >
            <ImportMockup />
          </StepSection>

          <StepSection
            eyebrow="Chats"
            title="Mizen cleans it up."
            body="Ingredients, timing, servings, notes, and steps are pulled into the same readable structure."
            reverse
          >
            <CleaningMockup />
          </StepSection>

          <StepSection
            eyebrow="Photos"
            title="Cook from one view."
            body="Adjust servings, check off prep, and keep the original source attached when you need it."
          >
            <div
              className="ml-auto flex aspect-square w-full items-end overflow-hidden rounded-[4px] bg-stone-50 pl-6 pt-8 dark:bg-stone-900 sm:pl-10 md:max-w-[524px]"
              style={{ clipPath: "inset(0 round 4px)" }}
            >
              <RecipeCardPreview recipe={chickenRecipe} compact />
            </div>
          </StepSection>

          <section className="mx-auto grid w-full max-w-[1248px] grid-cols-1 gap-12 px-6 py-16 sm:px-10 md:grid-cols-[392px_minmax(0,624px)] md:justify-between lg:px-16 lg:py-24">
            <h2 className="max-w-[392px] text-balance font-serif text-[30px] font-bold leading-[38px] tracking-[-0.02em] text-stone-900 dark:text-stone-50 sm:text-[36px] sm:leading-[44px]">
              Answers before you start.
            </h2>
            <FAQAccordion />
          </section>
        </main>

        <footer id="waitlist" className="bg-stone-50 dark:bg-stone-900">
          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-6 py-10 sm:px-10 md:flex-row md:items-end md:justify-between lg:px-16 xl:px-24">
            <div className="flex flex-col gap-3">
              <p className="text-sm leading-[22px] text-stone-600 dark:text-stone-300">
                Still waiting for access? Join the waitlist from the landing page.
              </p>
              <WhoMadeIt borderColor="border-stone-50 dark:border-stone-900" />
            </div>
            <WaitlistForm compact />
          </div>
        </footer>
      </div>

      {isSupabaseConfigured && <BetaAuthModal open={authOpen} onOpenChange={setAuthOpen} />}
    </>
  );
}

export default function GetStartedPage() {
  return <WaitlistLanding />;
}
