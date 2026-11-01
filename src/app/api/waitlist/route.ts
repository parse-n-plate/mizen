import { NextResponse } from "next/server";
import { SIGNUPS_CLOSED_MESSAGE } from "@/lib/sunset";

// Mizen is sunsetting, so the waitlist is closed. Existing waitlist rows are left untouched;
// this route just stops adding new ones.
export async function POST() {
  return NextResponse.json({ error: SIGNUPS_CLOSED_MESSAGE }, { status: 410 });
}
