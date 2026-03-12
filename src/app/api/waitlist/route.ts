import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    if (!process.env.NOTION_API_KEY || !process.env.NOTION_WAITLIST_DB_ID) {
      return NextResponse.json({ error: "Waitlist is not configured" }, { status: 500 });
    }

    const notion = new Client({ auth: process.env.NOTION_API_KEY });
    const databaseId = process.env.NOTION_WAITLIST_DB_ID;

    // Check for duplicate
    const existing = await notion.dataSources.query({
      data_source_id: databaseId,
      filter: {
        property: "Email",
        email: { equals: email },
      },
    });

    if (existing.results.length > 0) {
      return NextResponse.json({ success: true, message: "Already on the waitlist" });
    }

    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Email: { email },
        "Signed Up": { date: { start: new Date().toISOString() } },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
