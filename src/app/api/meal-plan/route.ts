import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import type { MealType } from "@/lib/types";

const log = logger.child({ module: "api/meal-plan" });

const VALID_MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner"];

export async function GET(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Meal plan is not available right now" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json({ error: "start and end query params required" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    if (!supabase) throw new Error("Supabase unavailable");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: entries, error } = await supabase
      .from("meal_plan_entries")
      .select("id, recipe_id, date, meal_type, created_at")
      .eq("user_id", user.id)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch associated recipes
    const recipeIds = [...new Set(entries.map((e: { recipe_id: string }) => e.recipe_id))];
    if (recipeIds.length === 0) {
      return NextResponse.json([]);
    }

    const { data: recipes, error: recipesError } = await supabase
      .from("recipes")
      .select("id, slug, recipe, source_url, created_at, updated_at")
      .in("id", recipeIds);

    if (recipesError) {
      return NextResponse.json({ error: recipesError.message }, { status: 500 });
    }

    const recipeMap = new Map(recipes.map((r: { id: string }) => [r.id, r]));

    const result = entries.map(
      (entry: {
        recipe_id: string;
        id: string;
        date: string;
        meal_type: string;
        created_at: string;
      }) => ({
        ...entry,
        recipe: recipeMap.get(entry.recipe_id) || null,
      })
    );

    return NextResponse.json(result);
  } catch (err) {
    log.error({ err }, "Failed to fetch meal plan");
    return NextResponse.json({ error: "Meal plan is temporarily unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Meal plan is not available right now" }, { status: 503 });
  }

  let recipe_id: string;
  let date: string;
  let meal_type: MealType;

  try {
    const body = await request.json();
    recipe_id = body.recipe_id;
    date = body.date;
    meal_type = body.meal_type;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!recipe_id || !date || !VALID_MEAL_TYPES.includes(meal_type)) {
    return NextResponse.json(
      { error: "recipe_id, date, and valid meal_type required" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();
    if (!supabase) throw new Error("Supabase unavailable");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Upsert: replace existing entry for same user/date/meal_type
    const { data: existing } = await supabase
      .from("meal_plan_entries")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", date)
      .eq("meal_type", meal_type)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from("meal_plan_entries")
        .update({ recipe_id })
        .eq("id", existing.id)
        .select("id, recipe_id, date, meal_type, created_at")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json(data);
    }

    const { data, error } = await supabase
      .from("meal_plan_entries")
      .insert({ user_id: user.id, recipe_id, date, meal_type })
      .select("id, recipe_id, date, meal_type, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    log.error({ err }, "Failed to save meal plan entry");
    return NextResponse.json({ error: "Meal plan is temporarily unavailable" }, { status: 503 });
  }
}
