// Premium plan utilities
// Free tier: 3 AI analyses per day
// Premium: unlimited (to be unlocked via Toss Payments later)

const AI_USAGE_KEY = "subsmart_ai_usage";
const PLAN_KEY = "subsmart_plan";
const FREE_DAILY_LIMIT = 3;

interface AIUsage {
  date: string; // YYYY-MM-DD
  count: number;
}

export function isPremium(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PLAN_KEY) === "premium";
}

export function getAIUsageToday(): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(AI_USAGE_KEY);
  if (!raw) return 0;
  try {
    const usage: AIUsage = JSON.parse(raw);
    const today = new Date().toISOString().split("T")[0];
    if (usage.date !== today) return 0;
    return usage.count;
  } catch {
    return 0;
  }
}

export function canUseAI(): boolean {
  if (isPremium()) return true;
  return getAIUsageToday() < FREE_DAILY_LIMIT;
}

export function getRemainingAIUses(): number {
  if (isPremium()) return Infinity;
  return Math.max(0, FREE_DAILY_LIMIT - getAIUsageToday());
}

export function recordAIUsage(): void {
  if (typeof window === "undefined") return;
  const today = new Date().toISOString().split("T")[0];
  const current = getAIUsageToday();
  const usage: AIUsage = {
    date: today,
    count: current + 1,
  };
  localStorage.setItem(AI_USAGE_KEY, JSON.stringify(usage));
}

// Temporary: for testing premium features
export function setPlan(plan: "free" | "premium"): void {
  if (typeof window === "undefined") return;
  if (plan === "premium") {
    localStorage.setItem(PLAN_KEY, "premium");
  } else {
    localStorage.removeItem(PLAN_KEY);
  }
}
