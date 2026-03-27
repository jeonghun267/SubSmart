import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const FREE_DAILY_LIMIT = 3;

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

async function checkAndRecordUsage(userId: string): Promise<{ allowed: boolean }> {
  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("user_plans")
    .select("plan, ai_usage_today, ai_usage_date")
    .eq("user_id", userId)
    .single();

  if (!data) {
    await supabase.from("user_plans").insert({
      user_id: userId, plan: "free", ai_usage_today: 1, ai_usage_date: today,
    });
    return { allowed: true };
  }

  if (data.plan === "premium") return { allowed: true };

  const usage = data.ai_usage_date === today ? data.ai_usage_today : 0;
  if (usage >= FREE_DAILY_LIMIT) return { allowed: false };

  await supabase.from("user_plans").upsert({
    user_id: userId, ai_usage_today: usage + 1, ai_usage_date: today,
  });
  return { allowed: true };
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { allowed } = await checkAndRecordUsage(user.id);
  if (!allowed) {
    return NextResponse.json({ error: "오늘의 무료 AI 분석 횟수를 모두 사용했어요." }, { status: 429 });
  }

  try {
    const { subscriptions, transactions, currentMonth, previousMonth } = await request.json();

    // Current month expenses
    const curExpenses = (transactions || []).filter(
      (t: { type: string; date: string }) =>
        t.type === "expense" && t.date.startsWith(currentMonth)
    );
    const prevExpenses = (transactions || []).filter(
      (t: { type: string; date: string }) =>
        t.type === "expense" && t.date.startsWith(previousMonth)
    );

    const curTotal = curExpenses.reduce((s: number, t: { amount: number }) => s + t.amount, 0);
    const prevTotal = prevExpenses.reduce((s: number, t: { amount: number }) => s + t.amount, 0);

    // Category breakdown
    const catBreakdown: Record<string, number> = {};
    curExpenses.forEach((t: { category: string; amount: number }) => {
      catBreakdown[t.category] = (catBreakdown[t.category] || 0) + t.amount;
    });
    const catText = Object.entries(catBreakdown)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => `- ${cat}: ${amt.toLocaleString()}원`)
      .join("\n");

    // Subscription summary
    const totalSubMonthly = (subscriptions || []).reduce(
      (sum: number, s: { amount: number; billing_cycle: string; is_active: boolean }) => {
        if (!s.is_active) return sum;
        if (s.billing_cycle === "yearly") return sum + s.amount / 12;
        if (s.billing_cycle === "weekly") return sum + s.amount * 4;
        return sum + s.amount;
      },
      0
    );

    const subNames = (subscriptions || [])
      .filter((s: { is_active: boolean }) => s.is_active)
      .map((s: { name: string; amount: number; category: string }) =>
        `${s.name}(${s.amount.toLocaleString()}원/${s.category})`
      )
      .join(", ");

    const prompt = `당신은 한국의 개인 재무 분석 전문가입니다. 아래 데이터로 월간 소비 리포트를 JSON 형식으로 작성해주세요.

## 데이터
- 이번 달 총 지출: ${curTotal.toLocaleString()}원
- 지난 달 총 지출: ${prevTotal.toLocaleString()}원
- 월간 구독료: ${Math.round(totalSubMonthly).toLocaleString()}원
- 활성 구독: ${subNames || "없음"}
- 카테고리별 지출:
${catText || "없음"}

## 요청
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요:
{
  "personality": "소비 성격을 나타내는 한국어 별명 (예: 알뜰살뜰형, 구독 마니아, 식도락 챔피언, 계획적 소비왕 등)",
  "personality_emoji": "성격에 맞는 이모지 1개",
  "month_change_percent": ${prevTotal > 0 ? Math.round(((curTotal - prevTotal) / prevTotal) * 100) : 0},
  "month_summary": "이번 달 소비를 지난 달과 비교한 한 줄 요약 (30자 이내)",
  "top_category": "가장 많이 쓴 카테고리명",
  "savings_tips": [
    "구체적인 절약 팁 1 (금액 포함, 20자 이내)",
    "구체적인 절약 팁 2 (금액 포함, 20자 이내)",
    "구체적인 절약 팁 3 (금액 포함, 20자 이내)"
  ],
  "subscription_alert": "구독 관련 조언 (중복 구독이 있으면 지적, 없으면 긍정적 코멘트. 25자 이내)",
  "score": 1에서 100 사이의 소비 건전성 점수 (숫자만),
  "one_line": "한 줄 핵심 조언 (20자 이내)"
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );

    if (!res.ok) {
      console.error("Gemini API error:", await res.text());
      return NextResponse.json({ error: "AI 분석 실패" }, { status: 500 });
    }

    const data = await res.json();
    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON from response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "리포트 생성 실패" }, { status: 500 });
    }

    const report = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ report });
  } catch (error) {
    console.error("AI report error:", error);
    return NextResponse.json({ error: "리포트 생성 중 오류" }, { status: 500 });
  }
}
