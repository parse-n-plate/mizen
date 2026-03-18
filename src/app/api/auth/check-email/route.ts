import { NextResponse } from "next/server";
import { isEmailWhitelisted } from "@/lib/supabase/check-whitelist";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ exists: false });
  }

  const exists = await isEmailWhitelisted(email);
  return NextResponse.json({ exists });
}
