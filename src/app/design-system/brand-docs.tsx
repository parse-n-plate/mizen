import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CopyPageButton } from "./copy-page-button";
import {
  BRAND_GUIDELINES_GROUPS,
  type BrandGuidelinesSlug,
  getAdjacentBrandGuidelinesSlugs,
  getBrandGuidelinesPath,
} from "./brand-nav";

type BrandGuidelinesSection = {
  title: string;
  body: ReactNode;
};

export type BrandGuidelinesDoc = {
  slug: BrandGuidelinesSlug;
  title: string;
  description: string;
  sections: BrandGuidelinesSection[];
};

const titleBySlug = Object.fromEntries(
  BRAND_GUIDELINES_GROUPS.flatMap((group) => group.items.map((item) => [item.slug, item.title]))
) as Record<BrandGuidelinesSlug, string>;

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-stone-200 bg-stone-50 p-4 font-mono text-[13px] leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-300">
      <code>{children}</code>
    </pre>
  );
}

function GuidanceList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-3 text-[15px] leading-7 text-stone-600 dark:text-stone-400"
        >
          <Check className="mt-1 h-4 w-4 shrink-0 text-[var(--color-blue)]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Example({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
      {children}
    </div>
  );
}

function AssetRow({ name, path, children }: { name: string; path: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950">
        {children}
      </div>
      <div className="min-w-0">
        <p className="font-medium text-stone-900 dark:text-stone-100">{name}</p>
        <p className="mt-1 break-all font-mono text-xs text-stone-500 dark:text-stone-400">
          {path}
        </p>
      </div>
    </div>
  );
}

const BRAND_DOCS: Record<BrandGuidelinesSlug, BrandGuidelinesDoc> = {
  overview: {
    slug: "overview",
    title: "Mizen brand guidelines",
    description:
      "A practical guide for applying Mizen's identity across product, docs, social, and partner surfaces.",
    sections: [
      {
        title: "Purpose",
        body: (
          <div className="space-y-4">
            <p>
              Brand guidelines explain how Mizen should look, sound, and present itself outside pure
              interface construction. Use the design system for product components, interaction
              patterns, and app primitives. Use brand guidelines for identity, voice, and
              communication choices.
            </p>
            <Example>
              <div className="flex items-center gap-3">
                <Image
                  src="/apple-touch-icon.png"
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 rounded-lg"
                />
                <div>
                  <p className="font-serif text-2xl font-bold text-stone-950 dark:text-stone-50">
                    Mizen
                  </p>
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    Calm recipe tools for saving, cooking, and returning to what works.
                  </p>
                </div>
              </div>
            </Example>
          </div>
        ),
      },
      {
        title: "Brand principles",
        body: (
          <GuidanceList
            items={[
              "Keep the brand calm and useful so recipes stay central.",
              "Use warmth through food context, not decorative clutter.",
              "Prefer direct language that reduces friction for home cooks.",
              "Make product identity recognizable through consistent color, typography, and icon assets.",
            ]}
          />
        ),
      },
    ],
  },
  logo: {
    slug: "logo",
    title: "Logo",
    description:
      "Use the Mizen app icon and wordmark treatment consistently across product and external surfaces.",
    sections: [
      {
        title: "Primary lockup",
        body: (
          <div className="space-y-4">
            <Example>
              <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-950">
                <Image
                  src="/apple-touch-icon.png"
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-lg"
                />
                <span className="font-serif text-3xl font-semibold text-stone-950 dark:text-stone-50">
                  Mizen
                </span>
              </div>
            </Example>
            <p>
              The default brand lockup pairs the app icon with the Domine wordmark. Use this in
              docs, simple landing surfaces, and account-adjacent UI.
            </p>
          </div>
        ),
      },
      {
        title: "Usage",
        body: (
          <GuidanceList
            items={[
              "Keep at least one icon width of clear space around the lockup.",
              "Do not redraw, recolor, skew, or crop the app icon.",
              "Use the icon alone for small square contexts like favicons, app icons, and compact nav.",
              "Use the icon plus wordmark when the audience may need brand recognition.",
            ]}
          />
        ),
      },
      {
        title: "Minimum sizes",
        body: (
          <GuidanceList
            items={[
              "Use the app icon at 16px minimum for browser and compact UI contexts.",
              "Use the icon at 28px or larger when paired with the Mizen wordmark.",
              "Keep the wordmark legible by using Domine at 18px or larger.",
            ]}
          />
        ),
      },
    ],
  },
  color: {
    slug: "color",
    title: "Color",
    description:
      "Use Mizen color to support recognition, hierarchy, and tone across brand surfaces.",
    sections: [
      {
        title: "Source of truth",
        body: (
          <div className="space-y-4">
            <p>
              The complete color inventory lives in the design-system Tokens page. That page owns
              token names, light and dark mode values, semantic aliases, and copyable color values.
            </p>
            <Button asChild variant="outline">
              <Link href="/design-system/tokens">View color tokens</Link>
            </Button>
          </div>
        ),
      },
      {
        title: "Brand usage",
        body: (
          <GuidanceList
            items={[
              "Use blue as the single strongest product signal.",
              "Use cream and warm neutrals to keep recipe content calm and readable.",
              "Keep mint, wheat, olive, and orange as supporting accents for food context.",
              "Reserve red for destructive, critical, or urgent feedback.",
              "Use the documented tokens instead of hardcoded brand hex values.",
            ]}
          />
        ),
      },
      {
        title: "Mode behavior",
        body: (
          <GuidanceList
            items={[
              "Treat light and dark values as product tokens, not separate brand palettes.",
              "Keep brand blue stable across modes for recognition.",
              "Use mode-aware surface and text tokens so brand pages remain accessible in either theme.",
            ]}
          />
        ),
      },
    ],
  },
  typography: {
    slug: "typography",
    title: "Typography",
    description: "Mizen pairs a recipe-focused serif with a restrained operational sans-serif.",
    sections: [
      {
        title: "Families",
        body: (
          <div className="space-y-4">
            <Example>
              <p className="font-serif text-4xl font-bold leading-tight text-stone-950 dark:text-stone-50">
                Domine gives Mizen its recipe voice.
              </p>
              <p className="mt-3 font-sans text-sm leading-6 text-stone-500 dark:text-stone-400">
                Albert Sans keeps controls, metadata, forms, and repeated product text clear.
              </p>
            </Example>
            <CodeBlock>{`--font-serif: "Domine", "Georgia", "Times New Roman", serif;
--font-sans: "Albert Sans", "Helvetica", "system-ui", sans-serif;`}</CodeBlock>
          </div>
        ),
      },
      {
        title: "Usage",
        body: (
          <GuidanceList
            items={[
              "Use Domine for brand marks, page titles, recipe names, and editorial moments.",
              "Use Albert Sans for controls, supporting copy, metadata, and dense UI.",
              "Avoid all-caps brand headlines unless the surface is very compact.",
              "Keep brand typography confident but not oversized inside utility surfaces.",
            ]}
          />
        ),
      },
    ],
  },
  voice: {
    slug: "voice",
    title: "Voice",
    description:
      "Mizen should sound practical, calm, and focused on helping people cook without friction.",
    sections: [
      {
        title: "Tone",
        body: (
          <GuidanceList
            items={[
              "Be direct and specific.",
              "Use cooking language when it clarifies the task.",
              "Avoid hype, jokes that get in the way, and instructional clutter.",
              "Prefer short confirmations after user actions.",
            ]}
          />
        ),
      },
      {
        title: "Examples",
        body: (
          <div className="space-y-4">
            <Example>
              <div className="space-y-3">
                <p className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm dark:border-stone-800 dark:bg-stone-950">
                  Saved to Cookbook.
                </p>
                <p className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm dark:border-stone-800 dark:bg-stone-950">
                  Paste a recipe URL or upload a photo.
                </p>
                <p className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm dark:border-stone-800 dark:bg-stone-950">
                  Some ingredients may need review.
                </p>
              </div>
            </Example>
            <p>
              The voice should help users understand what happened and what they can do next. It
              should not compete with the recipe.
            </p>
          </div>
        ),
      },
    ],
  },
  assets: {
    slug: "assets",
    title: "Assets",
    description: "The current brand asset set is small and should stay tied to real product usage.",
    sections: [
      {
        title: "Available assets",
        body: (
          <div className="space-y-3">
            <AssetRow name="App icon" path="/apple-touch-icon.png">
              <Image
                src="/apple-touch-icon.png"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 rounded"
              />
            </AssetRow>
            <AssetRow name="Prep tab icon" path="/assets/icon-prep.png">
              <Image
                src="/assets/icon-prep.png"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7"
              />
            </AssetRow>
            <AssetRow name="Cook tab icon" path="/assets/icon-cook.svg">
              <Image
                src="/assets/icon-cook.svg"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7"
              />
            </AssetRow>
          </div>
        ),
      },
      {
        title: "Rules",
        body: (
          <GuidanceList
            items={[
              "Use existing assets before creating new brand art.",
              "Keep custom icons reserved for product concepts that need distinct identity.",
              "Use empty alt text for decorative assets when nearby text names the concept.",
              "Document new assets here before using them across brand surfaces.",
            ]}
          />
        ),
      },
    ],
  },
};

export function getBrandGuidelinesDoc(slug: BrandGuidelinesSlug) {
  return BRAND_DOCS[slug];
}

export function getBrandGuidelinesTitle(slug: BrandGuidelinesSlug) {
  return titleBySlug[slug];
}

export function BrandGuidelinesDocPage({ doc }: { doc: BrandGuidelinesDoc }) {
  const { previous, next } = getAdjacentBrandGuidelinesSlugs(doc.slug);

  return (
    <article className="pb-16">
      <header className="border-b border-stone-200 pb-8 dark:border-stone-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="font-serif text-[38px] font-bold leading-tight tracking-tight text-stone-950 dark:text-stone-50 sm:text-[48px]">
            {doc.title}
          </h1>
          <CopyPageButton />
        </div>
        <p className="mt-4 max-w-[680px] text-[17px] leading-8 text-stone-500 dark:text-stone-400">
          {doc.description}
        </p>
      </header>

      <div className="mt-10 space-y-12">
        {doc.sections.map((section) => (
          <section key={section.title} className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold leading-8 text-stone-950 dark:text-stone-50">
              {section.title}
            </h2>
            <div className="space-y-4 text-[15px] leading-7 text-stone-600 dark:text-stone-400">
              {section.body}
            </div>
          </section>
        ))}
      </div>

      <Separator className="my-10" />

      <nav className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        {previous ? (
          <Button asChild variant="outline">
            <Link href={getBrandGuidelinesPath(previous)}>
              Previous: {getBrandGuidelinesTitle(previous)}
            </Link>
          </Button>
        ) : (
          <span />
        )}
        {next && (
          <Button asChild>
            <Link href={getBrandGuidelinesPath(next)}>Next: {getBrandGuidelinesTitle(next)}</Link>
          </Button>
        )}
      </nav>
    </article>
  );
}
