import { NextRequest, NextResponse } from "next/server";
import {
  APIErrorCode,
  APIResponseError,
  Client,
  RequestTimeoutError,
  isNotionClientError,
} from "@notionhq/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type LogFields = Record<string, unknown>;

function log(level: "info" | "warn" | "error", event: string, fields: LogFields = {}) {
  const payload = {
    event: `feedback.${event}`,
    level,
    timestamp: new Date().toISOString(),
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    ...fields,
  };
  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  fn(JSON.stringify(payload));
}

const RETRYABLE_NOTION_CODES = new Set<string>([
  APIErrorCode.InternalServerError,
  APIErrorCode.ServiceUnavailable,
  APIErrorCode.ConflictError,
  "request_timeout",
]);

function isRetryableError(error: unknown): boolean {
  if (error instanceof RequestTimeoutError) return true;
  if (error instanceof APIResponseError) {
    if (RETRYABLE_NOTION_CODES.has(error.code)) return true;
    if (error.status >= 500) return true;
    return false;
  }
  // Network / fetch errors (no status, not from Notion SDK)
  if (error instanceof TypeError) return true;
  return false;
}

async function createNotionPageWithRetry(
  notion: Client,
  args: Parameters<Client["pages"]["create"]>[0],
  attempts = 3
) {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await notion.pages.create(args);
    } catch (error) {
      lastError = error;
      if (i === attempts - 1 || !isRetryableError(error)) throw error;
      const delay = 250 * Math.pow(3, i); // 250ms, 750ms
      log("warn", "notion.retry", {
        attempt: i + 1,
        nextDelayMs: delay,
        errorCode: error instanceof APIResponseError ? error.code : undefined,
        status: error instanceof APIResponseError ? error.status : undefined,
        message: error instanceof Error ? error.message : String(error),
      });
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

export async function POST(req: NextRequest) {
  let userId: string | undefined;
  try {
    // Authenticate — only logged-in users can submit feedback
    const supabase = await createClient();
    if (!supabase) {
      log("error", "auth.unconfigured");
      return NextResponse.json(
        { error: "Auth not configured", code: "AUTH_UNCONFIGURED" },
        { status: 503 }
      );
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
    }
    userId = user.id;

    const formData = await req.formData();

    const description = formData.get("description") as string | null;
    if (!description || description.trim().length === 0) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }
    if (description.length > 1000) {
      return NextResponse.json(
        { error: "Description too long (max 1000 characters)" },
        { status: 400 }
      );
    }

    const feedbackType = (formData.get("feedbackType") as string) || "recipe";
    const category = (formData.get("category") as string) || "";
    const recipeTitle = (formData.get("recipeTitle") as string) || "";
    const sourceUrl = (formData.get("sourceUrl") as string) || "";
    const reporterEmail = (formData.get("reporterEmail") as string) || "";
    const deviceOS = (formData.get("deviceOS") as string) || "";
    const activeTab = (formData.get("activeTab") as string) || "";
    const unitSystem = (formData.get("unitSystem") as string) || "";
    const isGeneral = feedbackType === "general";

    // Validate images
    const images = formData.getAll("images") as File[];
    if (images.length > MAX_IMAGES) {
      return NextResponse.json({ error: `Maximum ${MAX_IMAGES} images allowed` }, { status: 400 });
    }
    for (const img of images) {
      if (!ALLOWED_TYPES.includes(img.type)) {
        return NextResponse.json({ error: `Unsupported image type: ${img.type}` }, { status: 400 });
      }
      if (img.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: "Image too large (max 5 MB)" }, { status: 400 });
      }
    }

    // Upload images to Supabase Storage (using admin client for write access)
    const imageUrls: string[] = [];
    if (images.length > 0) {
      const adminSupabase = createAdminClient();
      if (!adminSupabase) {
        log("warn", "images.admin_client_missing", { userId, imageCount: images.length });
      } else {
        for (const img of images) {
          const ext = img.name.split(".").pop() || "jpg";
          const path = `reports/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const buffer = Buffer.from(await img.arrayBuffer());
          const { error } = await adminSupabase.storage
            .from("feedback-images")
            .upload(path, buffer, { contentType: img.type });
          if (error) {
            log("error", "images.upload_failed", {
              userId,
              path,
              size: img.size,
              type: img.type,
              message: error.message,
            });
            continue;
          }
          const { data: urlData } = adminSupabase.storage
            .from("feedback-images")
            .getPublicUrl(path);
          imageUrls.push(urlData.publicUrl);
        }
      }
    }

    // Write to Notion
    const notionKey = process.env.NOTION_FEEDBACK_API_KEY || process.env.NOTION_API_KEY;
    const feedbackDbId = process.env.NOTION_FEEDBACK_DB_ID;

    if (!notionKey || !feedbackDbId) {
      log("error", "config.missing", {
        userId,
        hasNotionKey: !!notionKey,
        hasFeedbackDbId: !!feedbackDbId,
      });
      return NextResponse.json(
        { error: "Feedback is not configured", code: "CONFIG_MISSING" },
        { status: 500 }
      );
    }

    const notion = new Client({ auth: notionKey });

    const typeMap: Record<string, string> = {
      bug: "Bug",
      idea: "Feature request",
      feedback: "User feedback",
    };

    let debugInfo: Record<string, unknown> = {};
    try {
      const raw = formData.get("debugInfo") as string | null;
      if (raw) debugInfo = JSON.parse(raw);
    } catch {
      /* ignore */
    }

    // Title = user's message, truncated for Notion title field
    const title =
      description.trim().length > 100
        ? description.trim().slice(0, 97) + "..."
        : description.trim();

    const notionType = isGeneral ? typeMap[category] || "User feedback" : "Bug";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const properties: Record<string, any> = {
      Title: { title: [{ text: { content: title } }] },
      Type: { select: { name: notionType } },
      Status: { status: { name: "Triage" } },
      Source: { select: { name: "In-app" } },
      "Received At": { date: { start: new Date().toISOString() } },
    };

    if (reporterEmail) {
      properties.Reporter = { rich_text: [{ text: { content: reporterEmail } }] };
    }

    properties["App Version"] = {
      rich_text: [{ text: { content: process.env.npm_package_version || "0.1.0" } }],
    };

    if (deviceOS) {
      properties["Device/OS"] = { rich_text: [{ text: { content: deviceOS } }] };
    }

    // Build page body content
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const children: any[] = [];

    // Full message if truncated in title
    if (description.trim().length > 100) {
      children.push(
        {
          object: "block",
          type: "heading_3",
          heading_3: { rich_text: [{ text: { content: "Full Message" } }] },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: { rich_text: [{ text: { content: description.trim() } }] },
        }
      );
    }

    // Recipe context
    if (!isGeneral && recipeTitle) {
      children.push(
        {
          object: "block",
          type: "heading_3",
          heading_3: { rich_text: [{ text: { content: "Recipe" } }] },
        },
        {
          object: "block",
          type: "paragraph",
          paragraph: { rich_text: [{ text: { content: recipeTitle } }] },
        }
      );
      if (sourceUrl) {
        children.push({
          object: "block",
          type: "bookmark",
          bookmark: { url: sourceUrl },
        });
      }
    }

    if (Object.keys(debugInfo).length > 0 || activeTab || unitSystem) {
      const debugContent = JSON.stringify(
        {
          feedbackType,
          ...(category && { category }),
          ...(activeTab && { activeTab }),
          ...(unitSystem && { unitSystem }),
          ...debugInfo,
        },
        null,
        2
      );
      children.push(
        {
          object: "block",
          type: "heading_3",
          heading_3: { rich_text: [{ text: { content: "Debug Info" } }] },
        },
        {
          object: "block",
          type: "code",
          code: { rich_text: [{ text: { content: debugContent } }], language: "json" },
        }
      );
    }

    if (imageUrls.length > 0) {
      children.push({
        object: "block",
        type: "heading_3",
        heading_3: { rich_text: [{ text: { content: "Screenshots" } }] },
      });
      for (const url of imageUrls) {
        children.push({
          object: "block",
          type: "image",
          image: { type: "external", external: { url } },
        });
      }
    }

    try {
      await createNotionPageWithRetry(notion, {
        parent: { database_id: feedbackDbId },
        properties,
        children,
      });
    } catch (error) {
      const isDev = process.env.NODE_ENV === "development";
      const baseFields = {
        userId,
        feedbackType,
        category,
        notionType,
        propertyKeys: Object.keys(properties),
      };

      if (error instanceof APIResponseError) {
        const retryable = isRetryableError(error);
        log("error", retryable ? "notion.unavailable" : "notion.rejected", {
          ...baseFields,
          notionCode: error.code,
          status: error.status,
          message: error.message,
        });
        if (retryable) {
          return NextResponse.json(
            {
              error: "Couldn't reach our tracker — please try again",
              code: "NOTION_UNAVAILABLE",
              ...(isDev && { details: error.message }),
            },
            { status: 502 }
          );
        }
        return NextResponse.json(
          {
            error: "Submission failed — please try again or contact support",
            code: "NOTION_REJECTED",
            ...(isDev && { details: error.message, notionCode: error.code }),
          },
          { status: 500 }
        );
      }

      if (error instanceof RequestTimeoutError || isNotionClientError(error)) {
        log("error", "notion.unavailable", {
          ...baseFields,
          message: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json(
          {
            error: "Couldn't reach our tracker — please try again",
            code: "NOTION_UNAVAILABLE",
            ...(isDev && { details: error instanceof Error ? error.message : String(error) }),
          },
          { status: 502 }
        );
      }

      throw error;
    }

    log("info", "submitted", {
      userId,
      feedbackType,
      category,
      notionType,
      hasImages: imageUrls.length > 0,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    log("error", "unhandled", {
      userId,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    const isDev = process.env.NODE_ENV === "development";
    const message = isDev && error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message, code: "UNKNOWN" }, { status: 500 });
  }
}
