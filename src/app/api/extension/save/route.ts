import { NextResponse } from "next/server";
import { parseExtensionSaveRequest } from "@/lib/extension-save";
import { logger } from "@/lib/logger";
import { upsertRecipeForUser } from "@/lib/recipes/save";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { parseRecipeFromUrl } from "@/utils/parseRecipe";

const log = logger.child({ module: "api/extension/save" });

export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: "Saving recipes is not available right now", code: "UNAVAILABLE" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Send a valid page URL and title", code: "INVALID_PAGE" },
      { status: 400 }
    );
  }

  const payload = parseExtensionSaveRequest(body);
  if (!payload) {
    return NextResponse.json(
      { error: "This page cannot be saved", code: "INVALID_PAGE" },
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
      return NextResponse.json(
        {
          error: "Sign in to Mizen before saving",
          code: "UNAUTHORIZED",
          signInUrl: new URL("/?signin=1", request.url).toString(),
        },
        { status: 401 }
      );
    }

    const parsed = await parseRecipeFromUrl(payload.url);
    if (!parsed.success || !parsed.data) {
      return NextResponse.json(
        {
          error: parsed.error || "Mizen could not find a recipe on this page",
          code: "PARSE_FAILED",
        },
        { status: 422 }
      );
    }

    const saved = await upsertRecipeForUser(supabase, user.id, parsed.data);
    return NextResponse.json({
      id: saved.id,
      slug: saved.slug,
      title: saved.recipe.title || payload.title,
      savedPageUrl: new URL(
        `/recipe?slug=${encodeURIComponent(saved.slug)}`,
        request.url
      ).toString(),
    });
  } catch (error) {
    log.error({ err: error, sourceUrl: payload.url }, "Extension recipe save failed");
    return NextResponse.json(
      {
        error: "Saving this recipe is temporarily unavailable",
        code: "UNAVAILABLE",
      },
      { status: 503 }
    );
  }
}
