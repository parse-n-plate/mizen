import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { addDays, calendarDateSchema, dateKey, parseDate, startOfWeek } from "@/lib/meal-plan";

const addSchema = z.object({ recipeId: z.uuid(), date: calendarDateSchema });
const removeSchema = z.object({ id: z.uuid() });
const fields = "id, recipe_id, planned_date, created_at";
const headers = { "Cache-Control": "private, no-store" };

async function session() {
  const client = await createClient();
  if (!client)
    return {
      response: NextResponse.json({ error: "Meal plans are unavailable" }, { status: 503 }),
    };
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (isAuthRetryableFetchError(error)) return { response: failure(error) };
  if (error || !user)
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { client, user };
}

function failure(error: unknown) {
  logger.error({ err: error }, "Meal plan request failed");
  return NextResponse.json(
    { error: "Meal plans are temporarily unavailable. Please try again." },
    { status: 503 }
  );
}

export async function GET(request: Request) {
  const week = calendarDateSchema.safeParse(new URL(request.url).searchParams.get("week"));
  if (!week.success || dateKey(startOfWeek(parseDate(week.data))) !== week.data) {
    return NextResponse.json({ error: "Choose a week starting on Monday" }, { status: 400 });
  }
  try {
    const auth = await session();
    if (auth.response) return auth.response;
    const { data, error } = await auth.client
      .from("meal_plan_entries")
      .select(fields)
      .eq("user_id", auth.user.id)
      .gte("planned_date", week.data)
      .lte("planned_date", dateKey(addDays(parseDate(week.data), 6)))
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });
    if (error) throw error;
    return NextResponse.json(data ?? [], { headers });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  const body = addSchema.safeParse(await request.json().catch(() => null));
  if (!body.success)
    return NextResponse.json({ error: "Choose a saved recipe and a valid date" }, { status: 400 });
  try {
    const auth = await session();
    if (auth.response) return auth.response;
    const recipe = await auth.client
      .from("recipes")
      .select("id")
      .eq("id", body.data.recipeId)
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (recipe.error) throw recipe.error;
    if (!recipe.data)
      return NextResponse.json({ error: "Saved recipe not found" }, { status: 404 });
    const { data, error } = await auth.client
      .from("meal_plan_entries")
      .upsert(
        { user_id: auth.user.id, recipe_id: body.data.recipeId, planned_date: body.data.date },
        { onConflict: "user_id,recipe_id,planned_date", ignoreDuplicates: true }
      )
      .select(fields)
      .maybeSingle();
    if (error) throw error;
    // An existing meal is a successful no-op. Return it without changing its order.
    if (!data) {
      const existing = await auth.client
        .from("meal_plan_entries")
        .select(fields)
        .eq("user_id", auth.user.id)
        .eq("recipe_id", body.data.recipeId)
        .eq("planned_date", body.data.date)
        .single();
      if (existing.error) throw existing.error;
      return NextResponse.json(existing.data, { headers });
    }
    return NextResponse.json(data, { status: 201, headers });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(request: Request) {
  const body = removeSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid planned meal" }, { status: 400 });
  try {
    const auth = await session();
    if (auth.response) return auth.response;
    const { error } = await auth.client
      .from("meal_plan_entries")
      .delete()
      .eq("user_id", auth.user.id)
      .eq("id", body.data.id);
    if (error) throw error;
    return NextResponse.json({ success: true }, { headers });
  } catch (error) {
    return failure(error);
  }
}
