import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { ParsedRecipe } from "@/lib/types";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { recipe } = (await request.json()) as { recipe: ParsedRecipe };
  if (!recipe?.title) {
    return NextResponse.json({ error: "Invalid recipe" }, { status: 400 });
  }

  const sourceUrl = recipe.sourceUrl || null;

  // Deduplicate: if user already saved a recipe from this URL, update it
  if (sourceUrl) {
    const { data: existing } = await supabase
      .from("recipes")
      .select("id, slug")
      .eq("user_id", user.id)
      .eq("source_url", sourceUrl)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from("recipes")
        .update({ recipe, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select("id, slug, recipe, source_url, created_at, updated_at")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json(data);
    }
  }

  const slug = `${slugify(recipe.title)}-${crypto.randomUUID().slice(0, 8)}`;

  const { data, error } = await supabase
    .from("recipes")
    .insert({ user_id: user.id, slug, recipe, source_url: sourceUrl })
    .select("id, slug, recipe, source_url, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("recipes")
    .select("id, slug, recipe, source_url, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
