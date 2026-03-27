import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const FREE_DAILY_LIMIT = 3;

async function checkAIUsage(userId: string) {
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("user_plans")
    .select("plan, ai_usage_today, ai_usage_date")
    .eq("user_id", userId)
    .single();

  if (!data) {
    // First time user - create plan record
    await supabase.from("user_plans").insert({
      user_id: userId,
      plan: "free",
      ai_usage_today: 0,
      ai_usage_date: today,
    });
    return { allowed: true, plan: "free", remaining: FREE_DAILY_LIMIT };
  }

  if (data.plan === "premium") {
    return { allowed: true, plan: "premium", remaining: -1 };
  }

  // Reset counter if new day
  const usage = data.ai_usage_date === today ? data.ai_usage_today : 0;
  if (usage >= FREE_DAILY_LIMIT) {
    return { allowed: false, plan: "free", remaining: 0 };
  }

  return { allowed: true, plan: "free", remaining: FREE_DAILY_LIMIT - usage };
}

async function recordAIUsage(userId: string) {
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("user_plans")
    .select("ai_usage_today, ai_usage_date")
    .eq("user_id", userId)
    .single();

  const currentUsage = data?.ai_usage_date === today ? data.ai_usage_today : 0;

  await supabase
    .from("user_plans")
    .upsert({
      user_id: userId,
      ai_usage_today: currentUsage + 1,
      ai_usage_date: today,
    });
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { insight: "Gemini API 키가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  // Auth check
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  // AI usage check
  const usage = await checkAIUsage(user.id);
  if (!usage.allowed) {
    return NextResponse.json(
      { insight: "오늘의 무료 AI 분석 횟수를 모두 사용했어요. 내일 다시 시도해주세요!" },
      { status: 429 }
    );
  }

  try {
    const { subscriptions, transactions, type = "full" } = await request.json();

    const subsSummary = (subscriptions || [])
      .map(
        (s: { name: string; amount: number; billing_cycle: string; category: string }) =>
          `- ${s.name}: ${s.amount.toLocaleString()}원/${s.billing_cycle === "monthly" ? "월" : s.billing_cycle === "yearly" ? "년" : "주"} (${s.category})`
      )
      .join("\n");

    const totalSubMonthly = (subscriptions || []).reduce(
      (sum: number, s: { amount: number; billing_cycle: string }) => {
        if (s.billing_cycle === "yearly") return sum + s.amount / 12;
        if (s.billing_cycle === "weekly") return sum + s.amount * 4;
        return sum + s.amount;
      },
      0
    );

    const expenseTxs = (transactions || []).filter(
      (t: { type: string }) => t.type === "expense"
    );
    const totalExpense = expenseTxs.reduce(
      (sum: number, t: { amount: number }) => sum + t.amount,
      0
    );

    const categoryBreakdown: Record<string, number> = {};
    expenseTxs.forEach((t: { category: string; amount: number }) => {
      categoryBreakdown[t.category] =
        (categoryBreakdown[t.category] || 0) + t.amount;
    });

    const categoryText = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => `- ${cat}: ${amount.toLocaleString()}원`)
      .join("\n");

    const tipPrompt = `당신은 한국의 개인 재무 전문가입니다.

## 구독 현황 (월 총 ${Math.round(totalSubMonthly).toLocaleString()}원)
${subsSummary || "구독 없음"}

## 최근 지출 (총 ${totalExpense.toLocaleString()}원)
${categoryText || "지출 내역 없음"}

위 데이터를 바탕으로 가장 핵심적인 절약 조언을 50자 이내의 한 문장으로 작성해주세요. 반드시 완성된 문장으로 끝내세요. 이모지 1개를 앞에 붙여주세요.`;

    const fullPrompt = `당신은 한국의 개인 재무 전문가입니다. 사용자의 구독 및 지출 데이터를 분석하여 한국어로 실용적인 절약 팁과 인사이트를 제공해주세요.

## 구독 현황 (월 총 ${Math.round(totalSubMonthly).toLocaleString()}원)
${subsSummary || "구독 없음"}

## 최근 지출 (총 ${totalExpense.toLocaleString()}원)
### 카테고리별 지출
${categoryText || "지출 내역 없음"}

## 분석 요청
다음 항목을 포함하여 300자 이내로 분석해주세요:
1. 구독 최적화 제안 (불필요하거나 중복된 구독이 있는지)
2. 지출 패턴에서 발견되는 절약 포인트
3. 월 예산 추천
4. 한 줄 핵심 조언

친근하고 실용적인 톤으로 작성해주세요. 반드시 완성된 문장으로 끝내세요.`;

    const prompt = type === "tip" ? tipPrompt : fullPrompt;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: type === "tip" ? 256 : 1024,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini API error:", errText);
      return NextResponse.json(
        { insight: "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }

    // Record usage after successful call
    await recordAIUsage(user.id);

    const data = await res.json();
    const insight =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "분석 결과를 생성할 수 없습니다.";

    return NextResponse.json({ insight, remaining: usage.remaining - 1 });
  } catch (error) {
    console.error("AI insight error:", error);
    return NextResponse.json(
      { insight: "AI 분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
