import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import type { ParsedRecipe } from "@/lib/types";

const log = logger.child({ module: "api/recipes/[id]" });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: "Editing recipes is not available right now" },
      { status: 503 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Invalid recipe id" }, { status: 400 });
  }

  let recipe: ParsedRecipe | undefined;
  let isFavorite: boolean | undefined;
  try {
    const body = (await request.json()) as { recipe?: ParsedRecipe; isFavorite?: boolean };
    recipe = body.recipe;
    isFavorite = body.isFavorite;
  } catch {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  if (typeof isFavorite !== "boolean") {
    if (
      !recipe?.title?.trim() ||
      !recipe.ingredients?.some((group) => group.ingredients.length > 0) ||
      !recipe.instructions?.length
    ) {
      return NextResponse.json({ error: "Invalid recipe" }, { status: 400 });
    }
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
      .update(
        typeof isFavorite === "boolean"
          ? { is_favorite: isFavorite, updated_at: new Date().toISOString() }
          : { recipe, updated_at: new Date().toISOString() }
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, slug, recipe, source_url, created_at, updated_at, is_favorite")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    log.error({ err }, "Failed to update recipe");
    return NextResponse.json(
      { error: "Editing recipes is temporarily unavailable" },
      { status: 503 }
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: "Removing recipes is not available right now" },
      { status: 503 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Invalid recipe id" }, { status: 400 });
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

    const { error } = await supabase.from("recipes").delete().eq("id", id).eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    log.error({ err }, "Failed to delete recipe");
    return NextResponse.json(
      { error: "Removing recipes is temporarily unavailable" },
      { status: 503 }
    );
  }
}
