import { Subscription } from "./types";
import { Budget } from "./types";

const NOTIFIED_KEY = "subsmart_notified";

interface NotifiedRecord {
  date: string; // YYYY-MM-DD
  ids: string[]; // subscription IDs or budget category keys already notified
}

function getNotified(): NotifiedRecord {
  if (typeof window === "undefined") return { date: "", ids: [] };
  const raw = localStorage.getItem(NOTIFIED_KEY);
  if (!raw) return { date: "", ids: [] };
  try {
    const record: NotifiedRecord = JSON.parse(raw);
    const today = new Date().toISOString().split("T")[0];
    if (record.date !== today) return { date: today, ids: [] };
    return record;
  } catch {
    return { date: "", ids: [] };
  }
}

function markNotified(id: string) {
  const record = getNotified();
  const today = new Date().toISOString().split("T")[0];
  record.date = today;
  if (!record.ids.includes(id)) record.ids.push(id);
  localStorage.setItem(NOTIFIED_KEY, JSON.stringify(record));
}

function wasNotified(id: string): boolean {
  return getNotified().ids.includes(id);
}

// Check subscriptions with billing date tomorrow or today
export function checkBillingAlerts(
  subscriptions: Subscription[],
  sendNotification: (title: string, body: string) => void
) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  subscriptions
    .filter((s) => s.is_active)
    .forEach((sub) => {
      const billingDate = new Date(sub.next_billing_date);
      const diff = Math.ceil(
        (billingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diff === 1 && !wasNotified(`bill-tmr-${sub.id}`)) {
        sendNotification(
          "내일 결제 예정",
          `${sub.name} ${sub.amount.toLocaleString()}원이 내일 결제됩니다.`
        );
        markNotified(`bill-tmr-${sub.id}`);
      } else if (diff === 0 && !wasNotified(`bill-today-${sub.id}`)) {
        sendNotification(
          "오늘 결제일",
          `${sub.name} ${sub.amount.toLocaleString()}원이 오늘 결제됩니다.`
        );
        markNotified(`bill-today-${sub.id}`);
      }
    });
}

// Check budget alerts when category spending exceeds 80%
export function checkBudgetAlerts(
  budgets: Budget[],
  categoryTotals: Map<string, number>,
  sendNotification: (title: string, body: string) => void
) {
  budgets.forEach((budget) => {
    const spent = categoryTotals.get(budget.category) || 0;
    const percentage = (spent / budget.limit_amount) * 100;
    const alertKey = `budget-${budget.category}-${budget.month}`;

    if (percentage >= 80 && !wasNotified(alertKey)) {
      sendNotification(
        "예산 초과 경고",
        `${budget.category} 카테고리가 예산의 ${Math.round(percentage)}%를 사용했어요.`
      );
      markNotified(alertKey);
    }
  });
}
