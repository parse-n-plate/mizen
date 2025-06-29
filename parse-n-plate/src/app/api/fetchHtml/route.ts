import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "No URL provided" }, { status: 400 });

  try {
    const htmlRes = await fetch(url);
    const fullHtml = await htmlRes.text();

    const $ = cheerio.load(fullHtml);
    // .topper, .topper-inset, .subnav, .shell, .no-subnav, .has-subnav, .authgor, .single-post
    // Remove scripts, styles, and all the fluff
    $("script, style, noscript, link, meta, head, svg, symbol, img, button, gcse, lite-youtube, .comments, .nav, .rmp-rating-widget, .rmp-widgets-container, .topper, .topper-inset, .subnav, .entry-metadata--date, .copyright, .network-icons, .thumb-grid, .entry-title, .hero-video-container").remove();

    // Grab just the visible body content
    const cleanHtml = $("body").html() || "";

    return NextResponse.json({ html: cleanHtml });

  } catch (err) {
    console.error("Error parsing HTML:", err);
    return NextResponse.json({ error: "Failed to fetch or clean HTML" }, { status: 500 });
  }
}
