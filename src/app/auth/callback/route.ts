import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // If code is missing or exchange failed, redirect to login with error
  return NextResponse.redirect(`${origin}/login`);
}
