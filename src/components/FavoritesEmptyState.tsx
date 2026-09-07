import { Inter } from "next/font/google";
import Link from "next/link";
import { Heart } from "lucide-react";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500"] });

export function FavoritesEmptyState({ unavailable = false }: { unavailable?: boolean }) {
  return (
    <section
      role={unavailable ? "alert" : undefined}
      aria-labelledby="favorites-empty-title"
      className={`${inter.className} flex min-h-80 flex-col items-center justify-center gap-6 rounded-3xl border border-stone-200 bg-white p-6 text-center font-normal dark:border-stone-700 dark:bg-stone-900`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-stone-100 dark:bg-stone-800">
        <Heart
          className="h-8 w-8 text-stone-500 dark:text-stone-400"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </div>
      <div className="flex max-w-sm flex-col gap-2">
        <h2 id="favorites-empty-title" className="font-serif text-2xl leading-8 font-normal">
          {unavailable ? "Favorites are unavailable" : "Your favorites start here"}
        </h2>
        <p className="text-sm leading-6 text-stone-600 dark:text-stone-400">
          {unavailable
            ? "We couldn’t load your favorites. Please try again."
            : "Tap the heart on any recipe to keep it here. It stays in your Cookbook, too."}
        </p>
      </div>
      <Link
        href={unavailable ? "/favorites" : "/cookbook"}
        prefetch={unavailable ? false : undefined}
        className="inline-flex items-center justify-center rounded-3xl bg-stone-800 p-6 text-sm leading-6 font-medium text-white transition-colors hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-600 dark:bg-stone-200 dark:text-stone-900 dark:hover:bg-stone-300"
      >
        {unavailable ? "Try again" : "Browse Cookbook"}
      </Link>
    </section>
  );
}
