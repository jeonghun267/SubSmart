import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * 앱인토스 연결끊기 콜백
 *
 * 사용자가 토스에서 SubSmart 앱 연결을 해제하면
 * 토스 서버가 이 엔드포인트를 호출합니다.
 *
 * @see https://developers-apps-in-toss.toss.im/
 */
export async function POST(request: Request) {
  // Basic Auth 검증 (앱인토스 콘솔에서 설정한 값)
  const authHeader = request.headers.get("authorization");
  const expectedUser = process.env.TOSS_BASIC_AUTH_USER;
  const expectedPass = process.env.TOSS_BASIC_AUTH_PASS;

  if (!expectedUser || !expectedPass) {
    console.error("TOSS_BASIC_AUTH credentials not configured");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const expectedBase64 = Buffer.from(`${expectedUser}:${expectedPass}`).toString("base64");
  if (!authHeader || authHeader !== `Basic ${expectedBase64}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 토스 연동 정보가 있으면 삭제/비활성화
    // profiles 테이블에서 토스 관련 필드 초기화
    const { error } = await supabase
      .from("profiles")
      .update({
        toss_connected: false,
        toss_user_id: null,
        toss_disconnected_at: new Date().toISOString(),
      })
      .eq("toss_user_id", userId);

    if (error) {
      console.error("Toss disconnect DB error:", error);
      return NextResponse.json(
        { error: "Failed to process disconnect" },
        { status: 500 }
      );
    }

    console.log(`Toss disconnect processed for userId: ${userId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Toss disconnect error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
