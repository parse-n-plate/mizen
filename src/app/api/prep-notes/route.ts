import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

const recipeKeySchema = z.string().regex(/^[a-f0-9]{64}$/);
const updateSchema = z.object({
  recipeKey: recipeKeySchema,
  noteKey: z.string().min(1).max(1000),
  completed: z.boolean(),
});

export async function GET(request: Request) {
  const key = recipeKeySchema.safeParse(new URL(request.url).searchParams.get("recipeKey"));
  if (!key.success) return NextResponse.json({ error: "Invalid recipe key" }, { status: 400 });
  try {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data, error } = await supabase
      .from("recipe_prep_completion")
      .select("note_key, completed")
      .eq("user_id", user.id)
      .eq("recipe_key", key.data);
    if (error) throw error;
    return NextResponse.json(
      Object.fromEntries((data ?? []).map((row) => [row.note_key, row.completed])),
      {
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  } catch (err) {
    logger.error({ err }, "Failed to load prep completion");
    return NextResponse.json({ error: "Could not load prep progress" }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const body = updateSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid prep update" }, { status: 400 });
  try {
    const supabase = await createClient();
    if (!supabase) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { error } = await supabase.from("recipe_prep_completion").upsert(
      {
        user_id: user.id,
        recipe_key: body.data.recipeKey,
        note_key: body.data.noteKey,
        completed: body.data.completed,
      },
      { onConflict: "user_id,recipe_key,note_key" }
    );
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Failed to save prep completion");
    return NextResponse.json({ error: "Could not save prep progress" }, { status: 503 });
  }
}
