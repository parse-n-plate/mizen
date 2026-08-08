import { redirect } from "next/navigation";

export default async function SharedRecipePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Keep the short saved-recipe URL for extension redirects and existing bookmarks,
  // while loading it through the full recipe experience.
  redirect(`/recipe?slug=${encodeURIComponent(slug)}`);
}
