import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

const log = logger.child({ module: "api/meal-plan/[id]" });

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Meal plan is not available right now" }, { status: 503 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Invalid entry id" }, { status: 400 });
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

    const { error } = await supabase
      .from("meal_plan_entries")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    log.error({ err }, "Failed to delete meal plan entry");
    return NextResponse.json({ error: "Meal plan is temporarily unavailable" }, { status: 503 });
  }
}
