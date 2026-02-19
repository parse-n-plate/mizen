import { notFound } from "next/navigation";

export default async function SharedRecipePage() {
  // Supabase not connected — shared recipes unavailable
  notFound();
}
