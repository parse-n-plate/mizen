import { NextResponse } from "next/server";
import {
  parseRecipeFromUrl,
  parseRecipeFromImage,
} from "@/utils/parseRecipe";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, image, mimeType } = body;

    // Image path
    if (image && typeof image === "string") {
      if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
        return NextResponse.json(
          { success: false, error: "Unsupported image type" },
          { status: 400 }
        );
      }

      // Rough base64 size check (~4/3 ratio)
      if (image.length > MAX_IMAGE_BYTES * 1.37) {
        return NextResponse.json(
          { success: false, error: "Image too large (max 10 MB)" },
          { status: 400 }
        );
      }

      const result = await parseRecipeFromImage(image, mimeType);
      return NextResponse.json(result, {
        status: result.success ? 200 : 422,
      });
    }

    // URL path
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, error: "URL or image is required" },
        { status: 400 }
      );
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const result = await parseRecipeFromUrl(url);
    return NextResponse.json(result, {
      status: result.success ? 200 : 422,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
