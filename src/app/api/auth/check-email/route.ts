import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ exists: false });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    // Can't verify — let the OTP call handle it
    return NextResponse.json({ exists: true });
  }

  // listUsers paginates; we fetch page 1 and scan for a match.
  // For beta-sized user lists this is fine.
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    // Fail open — let the OTP call handle it
    return NextResponse.json({ exists: true });
  }

  const normalised = email.toLowerCase();
  const exists = data.users.some(
    (u) => u.email?.toLowerCase() === normalised
  );

  return NextResponse.json({ exists });
}
