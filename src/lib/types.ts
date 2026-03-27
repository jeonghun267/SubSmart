export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  currency: string;
  billing_cycle: "monthly" | "yearly" | "weekly";
  category: string;
  next_billing_date: string;
  icon_url?: string;
  color?: string;
  is_active: boolean;
  memo?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  description: string;
  date: string;
  is_recurring: boolean;
  subscription_id?: string;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  limit_amount: number;
  month: string; // YYYY-MM
  created_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  emoji: string;
  created_at: string;
}

export interface CategorySummary {
  category: string;
  total: number;
  count: number;
  budget?: number;
  percentage?: number;
}

export const CATEGORIES = [
  { value: "entertainment", label: "엔터테인먼트", icon: "🎬", color: "#EF4444" },
  { value: "music", label: "음악", icon: "🎵", color: "#F59E0B" },
  { value: "food", label: "식비", icon: "🍔", color: "#10B981" },
  { value: "transport", label: "교통", icon: "🚗", color: "#3B82F6" },
  { value: "shopping", label: "쇼핑", icon: "🛍️", color: "#8B5CF6" },
  { value: "health", label: "건강/운동", icon: "💪", color: "#EC4899" },
  { value: "education", label: "교육", icon: "📚", color: "#06B6D4" },
  { value: "cloud", label: "클라우드/스토리지", icon: "☁️", color: "#6366F1" },
  { value: "utility", label: "공과금", icon: "💡", color: "#84CC16" },
  { value: "insurance", label: "보험", icon: "🛡️", color: "#14B8A6" },
  { value: "other", label: "기타", icon: "📦", color: "#6B7280" },
] as const;

export const getCategoryInfo = (cat: string) =>
  CATEGORIES.find((c) => c.value === cat) || CATEGORIES[CATEGORIES.length - 1];

export const POPULAR_SUBSCRIPTIONS = [
  { name: "넷플릭스", category: "entertainment", amount: 17000, color: "#E50914" },
  { name: "유튜브 프리미엄", category: "entertainment", amount: 14900, color: "#FF0000" },
  { name: "스포티파이", category: "music", amount: 10900, color: "#1DB954" },
  { name: "멜론", category: "music", amount: 10900, color: "#00CD3C" },
  { name: "애플 뮤직", category: "music", amount: 11000, color: "#FC3C44" },
  { name: "쿠팡 로켓와우", category: "shopping", amount: 7890, color: "#E31837" },
  { name: "네이버 플러스", category: "shopping", amount: 4900, color: "#03C75A" },
  { name: "디즈니+", category: "entertainment", amount: 13900, color: "#113CCF" },
  { name: "웨이브", category: "entertainment", amount: 13900, color: "#1A1A2E" },
  { name: "티빙", category: "entertainment", amount: 13900, color: "#FF0558" },
  { name: "ChatGPT Plus", category: "cloud", amount: 28000, color: "#10A37F" },
  { name: "iCloud+", category: "cloud", amount: 1100, color: "#3693F3" },
  { name: "헬스장", category: "health", amount: 50000, color: "#EC4899" },
  { name: "밀리의서재", category: "education", amount: 9900, color: "#4F46E5" },
];
