import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: "Removing recipes is not available right now" },
      { status: 503 }
    );
  }

  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase!.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase!
      .from("recipes")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Removing recipes is temporarily unavailable" },
      { status: 503 }
    );
  }
}
