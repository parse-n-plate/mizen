import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import type { ParsedRecipe } from "@/lib/types";
import { upsertRecipeForUser } from "@/lib/recipes/save";

const log = logger.child({ module: "api/recipes" });

export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: "Saving recipes is not available right now" },
      { status: 503 }
    );
  }

  let recipe: ParsedRecipe;
  try {
    const body = (await request.json()) as { recipe?: ParsedRecipe };
    recipe = body.recipe as ParsedRecipe;
  } catch {
    return NextResponse.json({ error: "Invalid recipe" }, { status: 400 });
  }

  if (!recipe?.title) {
    return NextResponse.json({ error: "Invalid recipe" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    if (!supabase) {
      throw new Error("Supabase unavailable");
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await upsertRecipeForUser(supabase, user.id, recipe);
    return NextResponse.json(data);
  } catch (err) {
    log.error({ err }, "Failed to save recipe");
    return NextResponse.json(
      { error: "Saving recipes is temporarily unavailable" },
      { status: 503 }
    );
  }
}

export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Recipe list is not available right now" }, { status: 503 });
  }

  try {
    const supabase = await createClient();
    if (!supabase) {
      throw new Error("Supabase unavailable");
    }
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
  } catch (err) {
    log.error({ err }, "Failed to fetch recipe list");
    return NextResponse.json({ error: "Recipe list is temporarily unavailable" }, { status: 503 });
  }
}
