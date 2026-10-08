import { NextResponse } from "next/server";
import {
  parseRecipeFromDocument,
  parseRecipeFromImage,
  parseRecipeFromText,
  parseRecipeFromUrl,
} from "@/utils/parseRecipe";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB (Groq base64 limit)
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.oasis.opendocument.text",
  "application/rtf",
  "text/rtf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/html",
];
const DOCUMENT_NAME_PATTERN = /\.(?:pdf|docx?|odt|rtf|xlsx?|html?|htm)$/i;
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const DATA_URL_MIME_PATTERN = /^data:([^;,]+)(?:;[^,]*)?,/i;

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let file: File | null = null;
    let url: string | null = null;
    let text: string | null = null;
    let legacyImage: string | null = null;
    let legacyMimeType: string | null = null;

    if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      const formData = await request.formData();
      const fileField = formData.get("file");
      const urlField = formData.get("url");

      if (fileField instanceof File) {
        file = fileField;
      } else if (typeof fileField === "string" && fileField.length > 0) {
        return NextResponse.json(
          { success: false, error: "Invalid file payload" },
          { status: 400 }
        );
      }

      if (typeof urlField === "string") {
        url = urlField;
      } else if (urlField instanceof File) {
        return NextResponse.json({ success: false, error: "Invalid URL payload" }, { status: 400 });
      }

      const textField = formData.get("text");
      if (typeof textField === "string" && textField.length > 0) {
        text = textField;
      }
    } else if (contentType.includes("application/json")) {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
      }

      if (!body || typeof body !== "object") {
        return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
      }

      const payload = body as {
        url?: unknown;
        image?: unknown;
        mimeType?: unknown;
      };

      if (typeof payload.url === "string") {
        url = payload.url;
      }
      if (typeof payload.image === "string") {
        legacyImage = payload.image;
      }
      if (typeof payload.mimeType === "string") {
        legacyMimeType = payload.mimeType;
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Unsupported content type" },
        { status: 400 }
      );
    }

    // Image path
    if (file) {
      if (ALLOWED_MIME_TYPES.includes(file.type)) {
        if (file.size > MAX_IMAGE_BYTES) {
          return NextResponse.json(
            { success: false, error: "Image too large (max 4 MB)" },
            { status: 400 }
          );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

        const result = await parseRecipeFromImage(base64);
        return NextResponse.json(result, {
          status: result.success ? 200 : 422,
        });
      }

      if (
        !ALLOWED_DOCUMENT_MIME_TYPES.includes(file.type) &&
        !DOCUMENT_NAME_PATTERN.test(file.name)
      ) {
        return NextResponse.json(
          { success: false, error: "Unsupported file type" },
          { status: 400 }
        );
      }

      if (file.size > MAX_DOCUMENT_BYTES) {
        return NextResponse.json(
          { success: false, error: "Document too large (max 10 MB)" },
          { status: 400 }
        );
      }

      const result = await parseRecipeFromDocument(file);
      return NextResponse.json(result, {
        status: result.success ? 200 : 422,
      });
    }

    // Legacy JSON image path
    if (legacyImage) {
      if (!legacyMimeType || !ALLOWED_MIME_TYPES.includes(legacyMimeType)) {
        return NextResponse.json(
          { success: false, error: "Unsupported image type" },
          { status: 400 }
        );
      }

      if (legacyImage.length > MAX_IMAGE_BYTES * 1.37) {
        return NextResponse.json(
          { success: false, error: "Image too large (max 4 MB)" },
          { status: 400 }
        );
      }

      let dataUrl: string;
      if (legacyImage.startsWith("data:")) {
        const mimeMatch = legacyImage.match(DATA_URL_MIME_PATTERN);
        const embeddedMimeType = mimeMatch?.[1];

        if (!embeddedMimeType || embeddedMimeType !== legacyMimeType) {
          return NextResponse.json(
            { success: false, error: "MIME type does not match image data" },
            { status: 400 }
          );
        }

        if (!ALLOWED_MIME_TYPES.includes(embeddedMimeType)) {
          return NextResponse.json(
            { success: false, error: "Unsupported image type" },
            { status: 400 }
          );
        }

        dataUrl = legacyImage;
      } else {
        dataUrl = `data:${legacyMimeType};base64,${legacyImage}`;
      }

      const result = await parseRecipeFromImage(dataUrl);
      return NextResponse.json(result, {
        status: result.success ? 200 : 422,
      });
    }

    // Text path
    if (text) {
      if (text.length > 50_000) {
        return NextResponse.json(
          { success: false, error: "Text too long (max 50,000 characters)" },
          { status: 400 }
        );
      }

      const result = await parseRecipeFromText(text);
      return NextResponse.json(result, {
        status: result.success ? 200 : 422,
      });
    }

    // URL path
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, error: "URL, file, or image is required" },
        { status: 400 }
      );
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid URL format" }, { status: 400 });
    }

    const result = await parseRecipeFromUrl(url);
    return NextResponse.json(result, {
      status: result.success ? 200 : 422,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
