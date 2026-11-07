import type { Metadata } from "next";
import { XPostStudio } from "@/components/x-posts/XPostStudio";

export const metadata: Metadata = {
  title: "X Posts | Mizen Brand Guidelines",
  description: "Make on-brand images for X posts from Mizen templates.",
};

export default function XPostsPage() {
  return (
    <article className="pb-16">
      <header className="border-b border-stone-200 pb-8 dark:border-stone-800">
        <h1 className="font-serif text-[38px] font-bold leading-tight tracking-tight text-stone-950 dark:text-stone-50 sm:text-[48px]">
          X posts
        </h1>
        <p className="mt-4 max-w-[680px] text-[17px] leading-8 text-stone-500 dark:text-stone-400">
          Make images for X posts with Mizen&rsquo;s type, color, and real app components. Pick a
          template, edit the copy, and download a PNG sized for the timeline.
        </p>
      </header>
      <div className="pt-8">
        <XPostStudio />
      </div>
    </article>
  );
}
