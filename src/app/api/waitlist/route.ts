import { NextResponse } from "next/server";
import { SIGNUPS_CLOSED_MESSAGE } from "@/lib/sunset";

export async function POST() {
  return NextResponse.json({ error: SIGNUPS_CLOSED_MESSAGE }, { status: 410 });
}
