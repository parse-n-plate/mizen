import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  try {
    // Authenticate — only logged-in users can submit feedback
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();

    const description = formData.get("description") as string | null;
    if (!description || description.trim().length === 0) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }
    if (description.length > 1000) {
      return NextResponse.json({ error: "Description too long (max 1000 characters)" }, { status: 400 });
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
      const supabase = createAdminClient();
      if (!supabase) {
        console.warn("Feedback: Supabase admin client not configured, skipping image uploads");
      } else {
        for (const img of images) {
          const ext = img.name.split(".").pop() || "jpg";
          const path = `reports/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const buffer = Buffer.from(await img.arrayBuffer());
          const { error } = await supabase.storage
            .from("feedback-images")
            .upload(path, buffer, { contentType: img.type });
          if (error) {
            console.error("Feedback image upload failed:", error.message);
            continue;
          }
          const { data: urlData } = supabase.storage
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
      return NextResponse.json({ error: "Feedback is not configured" }, { status: 500 });
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
    } catch { /* ignore */ }

    // Title = user's message, truncated for Notion title field
    const title = description.trim().length > 100
      ? description.trim().slice(0, 97) + "..."
      : description.trim();

    const notionType = isGeneral
      ? (typeMap[category] || "User feedback")
      : "Bug";

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

    properties["App Version"] = { rich_text: [{ text: { content: process.env.npm_package_version || "0.1.0" } }] };

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
        },
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
        },
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
      const debugContent = JSON.stringify({
        feedbackType,
        ...(category && { category }),
        ...(activeTab && { activeTab }),
        ...(unitSystem && { unitSystem }),
        ...debugInfo,
      }, null, 2);
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
        },
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

    await notion.pages.create({
      parent: { database_id: feedbackDbId },
      properties,
      children,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback error:", error);
    const message =
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
