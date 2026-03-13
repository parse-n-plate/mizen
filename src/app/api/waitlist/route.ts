import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const notionConfigured = process.env.NOTION_API_KEY && process.env.NOTION_WAITLIST_DB_ID;

    let supabase: Awaited<ReturnType<typeof createClient>> = null;
    try {
      supabase = await createClient();
    } catch (e) {
      console.error("Supabase client creation failed:", e);
    }

    if (!notionConfigured && !supabase) {
      return NextResponse.json({ error: "Waitlist is not configured" }, { status: 500 });
    }

    const notionTask = notionConfigured
      ? writeToNotion(email)
      : Promise.resolve({ status: "skipped" as const });

    const supabaseTask = supabase
      ? writeToSupabase(supabase, email)
      : Promise.resolve({ status: "skipped" as const });

    const [notionResult, supabaseResult] = await Promise.allSettled([notionTask, supabaseTask]);

    // Check if the email already exists in either system
    const notionValue = notionResult.status === "fulfilled" ? notionResult.value : null;
    const supabaseValue = supabaseResult.status === "fulfilled" ? supabaseResult.value : null;

    if (notionValue?.status === "duplicate" || supabaseValue?.status === "duplicate") {
      return NextResponse.json({ success: true, message: "Already on the waitlist" });
    }

    // If both failed, return error
    if (notionResult.status === "rejected" && supabaseResult.status === "rejected") {
      console.error("Notion error:", notionResult.reason);
      console.error("Supabase error:", supabaseResult.reason);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }

    // Log any single-system failure (the other succeeded, so redundancy worked)
    if (notionResult.status === "rejected") {
      const err = notionResult.reason;
      console.error("Notion write failed (Supabase succeeded):", err?.body || err?.message || err);
    }
    if (supabaseResult.status === "rejected") {
      console.error("Supabase write failed (Notion succeeded):", supabaseResult.reason);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Waitlist error:", error);
    const message = process.env.NODE_ENV === "development" && error instanceof Error
      ? error.message
      : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function writeToNotion(email: string) {
  const notion = new Client({ auth: process.env.NOTION_API_KEY });
  const databaseId = process.env.NOTION_WAITLIST_DB_ID!;

  // Check for duplicate
  const queryRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filter: {
        property: "Email",
        email: { equals: email },
      },
    }),
  });

  if (!queryRes.ok) {
    const err = await queryRes.json();
    throw new Error(`Notion query failed: ${err.message}`);
  }

  const existing = await queryRes.json() as { results: unknown[] };

  if (existing.results.length > 0) {
    return { status: "duplicate" as const };
  }

  const name = email.split("@")[0];

  await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      Name: { title: [{ text: { content: name } }] },
      Email: { email },
      Joined: { date: { start: new Date().toISOString() } },
      Status: { status: { name: "New" } },
    },
  });

  return { status: "created" as const };
}

async function writeToSupabase(supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>, email: string) {
  const { error } = await supabase
    .from("waitlist")
    .insert({ email, source: "Website" });

  if (error) {
    // Unique constraint violation = already on waitlist
    if (error.code === "23505") {
      return { status: "duplicate" as const };
    }
    throw error;
  }

  return { status: "created" as const };
}
