"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Transaction, Budget, CATEGORIES, CategorySummary, getCategoryInfo } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Plus,
  X,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import AnimatedNumber from "@/components/AnimatedNumber";
import ProgressBar from "@/components/ProgressBar";
import BottomSheet from "@/components/BottomSheet";
import { DashboardSkeleton } from "@/components/Skeleton";
import { useNotifications } from "@/components/NotificationManager";
import { checkBudgetAlerts } from "@/lib/notifications";
import Subby from "@/components/Subby";
import { showToast } from "@/components/Toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import MoneyInput from "@/components/MoneyInput";

export default function BudgetPage() {
  const { user: authUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deleteTxConfirm, setDeleteTxConfirm] = useState<string | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showAddTx, setShowAddTx] = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState<"all" | "expense" | "income">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), "yyyy-MM"));
  const [loading, setLoading] = useState(true);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [monthlyTrend, setMonthlyTrend] = useState<{ month: string; expense: number; income: number }[]>([]);
  const { sendNotification, enabled: notiEnabled } = useNotifications();

  const [txForm, setTxForm] = useState({
    amount: 0,
    type: "expense" as "income" | "expense",
    category: "food",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
    is_recurring: false,
  });

  const [budgetForm, setBudgetForm] = useState({
    category: "food",
    limit_amount: 0,
  });

  useEffect(() => {
    if (authUser) loadData();
  }, [currentMonth, authUser]);

  async function loadData() {
    if (!authUser) return;

    const monthStart = `${currentMonth}-01`;
    const [year, month] = currentMonth.split("-").map(Number);
    const monthEnd = format(new Date(year, month, 0), "yyyy-MM-dd");

    const [txRes, budgetRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", authUser.id)
        .gte("date", monthStart)
        .lte("date", monthEnd)
        .order("date", { ascending: false }),
      supabase
        .from("budgets")
        .select("*")
        .eq("user_id", authUser.id)
        .eq("month", currentMonth),
    ]);

    setTransactions(txRes.data || []);
    setBudgets(budgetRes.data || []);

    // Fetch 6 month trend
    const sixMonthsAgo = new Date(year, month - 7, 1);
    const trendRes = await supabase
      .from("transactions")
      .select("amount, type, date")
      .eq("user_id", authUser.id)
      .gte("date", format(sixMonthsAgo, "yyyy-MM-dd"))
      .lte("date", monthEnd);

    const trendMap = new Map<string, { expense: number; income: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const key = format(d, "yyyy-MM");
      trendMap.set(key, { expense: 0, income: 0 });
    }
    (trendRes.data || []).forEach((tx: { amount: number; type: string; date: string }) => {
      const key = tx.date.substring(0, 7);
      const entry = trendMap.get(key);
      if (entry) {
        if (tx.type === "expense") entry.expense += tx.amount;
        else entry.income += tx.amount;
      }
    });
    setMonthlyTrend(
      Array.from(trendMap.entries()).map(([m, v]) => ({ month: m, ...v }))
    );

    // Check budget alerts
    if (notiEnabled && localStorage.getItem("subsmart_budget_noti") !== "false") {
      const catTotals = new Map<string, number>();
      (txRes.data || [])
        .filter((t: { type: string }) => t.type === "expense")
        .forEach((t: { category: string; amount: number }) => {
          catTotals.set(t.category, (catTotals.get(t.category) || 0) + t.amount);
        });
      checkBudgetAlerts(budgetRes.data || [], catTotals, sendNotification);
    }

    setLoading(false);
  }

  async function handleSubmitTx(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      if (!authUser) return;

      // Use category label as default description if empty
      const descriptionText = txForm.description.trim() || getCategoryInfo(txForm.category).label;

      const payload = {
        user_id: authUser.id,
        amount: txForm.amount,
        type: txForm.type,
        category: txForm.category,
        description: descriptionText,
        date: txForm.date,
        is_recurring: txForm.is_recurring,
      };

      const { error } = editingTx
        ? await supabase.from("transactions").update(payload).eq("id", editingTx.id)
        : await supabase.from("transactions").insert(payload);

      if (error) {
        showToast("저장에 실패했습니다. 다시 시도해주세요.", "error");
        return;
      }

      showToast(editingTx ? "거래가 수정되었습니다." : "거래가 추가되었습니다.", "success");
      setShowAddTx(false);
      setEditingTx(null);
      setTxForm({
        amount: 0,
        type: "expense",
        category: "food",
        description: "",
        date: format(new Date(), "yyyy-MM-dd"),
        is_recurring: false,
      });
      loadData();
    } finally {
      setSubmitting(false);
    }
  }

  function openEditTx(tx: Transaction) {
    setEditingTx(tx);
    setTxForm({
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      description: tx.description,
      date: tx.date,
      is_recurring: tx.is_recurring || false,
    });
    setShowAddTx(true);
  }

  async function handleAddBudget(e: React.FormEvent) {
    e.preventDefault();
    if (!authUser) return;

    const { error } = await supabase.from("budgets").upsert(
      {
        user_id: authUser.id,
        category: budgetForm.category,
        limit_amount: budgetForm.limit_amount,
        month: currentMonth,
      },
      { onConflict: "user_id,category,month" }
    );

    if (error) {
      showToast("예산 설정에 실패했습니다.", "error");
      return;
    }

    showToast("예산이 설정되었습니다.", "success");
    setShowAddBudget(false);
    setBudgetForm({ category: "food", limit_amount: 0 });
    loadData();
  }

  async function confirmDeleteTx() {
    if (!deleteTxConfirm) return;
    await supabase.from("transactions").delete().eq("id", deleteTxConfirm);
    setDeleteTxConfirm(null);
    showToast("거래가 삭제되었습니다.", "success");
    loadData();
  }

  const expenseTxs = transactions.filter((t) => t.type === "expense");
  const categorySummaries: CategorySummary[] = CATEGORIES.map((cat) => {
    const catTxs = expenseTxs.filter((t) => t.category === cat.value);
    const total = catTxs.reduce((sum, t) => sum + t.amount, 0);
    const budget = budgets.find((b) => b.category === cat.value);
    return {
      category: cat.value,
      total,
      count: catTxs.length,
      budget: budget?.limit_amount,
      percentage: budget ? (total / budget.limit_amount) * 100 : undefined,
    };
  }).filter((s) => s.total > 0 || s.budget);

  const totalExpense = expenseTxs.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  // Apply type filter, category filter, and search query
  const filteredTxs = transactions
    .filter((t) => filterType === "all" || t.type === filterType)
    .filter((t) => filterCategory === "all" || t.category === filterCategory)
    .filter((t) => {
      if (!searchQuery.trim()) return true;
      return t.description.toLowerCase().includes(searchQuery.trim().toLowerCase());
    });

  // Group filtered transactions by date
  const groupedTxs: { date: string; label: string; txs: Transaction[] }[] = [];
  const dateMap = new Map<string, Transaction[]>();
  filteredTxs.forEach((tx) => {
    const existing = dateMap.get(tx.date);
    if (existing) {
      existing.push(tx);
    } else {
      dateMap.set(tx.date, [tx]);
    }
  });
  dateMap.forEach((txs, date) => {
    const d = new Date(date);
    const label = format(d, "M월 d일 (E)", { locale: ko });
    groupedTxs.push({ date, label, txs });
  });

  const isCurrentMonth = currentMonth === format(new Date(), "yyyy-MM");

  function changeMonth(delta: number) {
    if (delta > 0 && isCurrentMonth) return;
    setLoading(true);
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setCurrentMonth(format(d, "yyyy-MM"));
  }

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-7 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold text-text-primary">가계부</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddBudget(true)}
            className="px-3.5 py-2.5 bg-bg-card border border-border text-[13px] font-medium text-text-secondary rounded-[10px] pressable"
          >
            예산 설정
          </button>
          <button
            onClick={() => setShowAddTx(true)}
            className="flex items-center gap-1 px-4 py-2.5 bg-accent text-text-inverse text-[13px] font-semibold rounded-[10px] pressable"
          >
            <Plus size={16} /> 기록
          </button>
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-center gap-5">
        <button
          onClick={() => changeMonth(-1)}
          className="p-1.5 rounded-[8px] hover:bg-bg-card transition-colors pressable"
        >
          <ChevronLeft size={20} className="text-text-tertiary" />
        </button>
        <span className="text-[16px] font-semibold text-text-primary min-w-[120px] text-center">
          {format(new Date(`${currentMonth}-01`), "yyyy년 M월", { locale: ko })}
        </span>
        <button
          onClick={() => changeMonth(1)}
          disabled={isCurrentMonth}
          className={`p-1.5 rounded-[8px] transition-colors pressable ${isCurrentMonth ? "opacity-20" : "hover:bg-bg-card"}`}
        >
          <ChevronRight size={20} className="text-text-tertiary" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-bg-card rounded-[12px] p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-negative-soft flex items-center justify-center">
              <ArrowDownCircle size={14} className="text-negative" />
            </div>
            <span className="text-[12px] text-text-tertiary">지출</span>
          </div>
          <AnimatedNumber
            value={totalExpense}
            suffix="원"
            className="text-[18px] font-bold text-text-primary"
          />
        </div>
        <div className="bg-bg-card rounded-[12px] p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-positive-soft flex items-center justify-center">
              <ArrowUpCircle size={14} className="text-positive" />
            </div>
            <span className="text-[12px] text-text-tertiary">수입</span>
          </div>
          <AnimatedNumber
            value={totalIncome}
            suffix="원"
            className="text-[18px] font-bold text-text-primary"
          />
        </div>
      </div>

      {/* Monthly Trend Chart */}
      {monthlyTrend.length > 0 && (
        <section className="bg-bg-card rounded-[16px] p-5 border border-border">
          <h2 className="text-[15px] font-semibold text-text-primary mb-4">
            최근 6개월 추이
          </h2>
          {(() => {
            const maxVal = Math.max(...monthlyTrend.map((m) => Math.max(m.expense, m.income)), 1);
            return (
              <div className="flex items-end gap-2 h-[140px]">
                {monthlyTrend.map((m) => {
                  const expH = (m.expense / maxVal) * 100;
                  const incH = (m.income / maxVal) * 100;
                  const label = m.month.split("-")[1] + "월";
                  const isCurrent = m.month === currentMonth;
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <div className="flex gap-0.5 items-end flex-1 w-full justify-center">
                        <div
                          className="w-3 rounded-t-[3px] transition-all duration-500"
                          style={{
                            height: `${Math.max(expH, 2)}%`,
                            backgroundColor: isCurrent ? "#F43F5E" : "#F43F5E60",
                          }}
                        />
                        <div
                          className="w-3 rounded-t-[3px] transition-all duration-500"
                          style={{
                            height: `${Math.max(incH, 2)}%`,
                            backgroundColor: isCurrent ? "#34D399" : "#34D39960",
                          }}
                        />
                      </div>
                      <span className={`text-[10px] ${isCurrent ? "text-text-primary font-semibold" : "text-text-tertiary"}`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
          <div className="flex items-center justify-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-negative" />
              <span className="text-[11px] text-text-tertiary">지출</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-positive" />
              <span className="text-[11px] text-text-tertiary">수입</span>
            </div>
          </div>
        </section>
      )}

      {/* Category Budgets */}
      {categorySummaries.length > 0 && (
        <section>
          <h2 className="text-[15px] font-semibold text-text-primary mb-3">
            카테고리별 지출
          </h2>
          <div className="space-y-2.5">
            {categorySummaries.map((cs) => {
              const cat = getCategoryInfo(cs.category);
              return (
                <div
                  key={cs.category}
                  className="bg-bg-card rounded-[12px] p-4 border border-border"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[16px]">{cat.icon}</span>
                      <span className="text-[13px] font-semibold text-text-primary">
                        {cat.label}
                      </span>
                      <span className="text-[11px] text-text-tertiary bg-bg-primary px-1.5 py-0.5 rounded-[4px]">
                        {cs.count}건
                      </span>
                    </div>
                    <span className="text-[14px] font-bold text-text-primary tabular-nums">
                      {cs.total.toLocaleString()}원
                    </span>
                  </div>
                  {cs.budget !== undefined && cs.percentage !== undefined && (
                    <ProgressBar
                      percentage={cs.percentage}
                      height={8}
                      showLabel
                      spent={cs.total}
                      limit={cs.budget}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Income/Expense Type Filter */}
      <div className="flex bg-bg-primary rounded-[10px] p-1">
        {(["all", "expense", "income"] as const).map((type) => {
          const labels = { all: "전체", expense: "지출", income: "수입" };
          return (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex-1 py-2 text-[13px] font-semibold rounded-[8px] transition-all ${
                filterType === type
                  ? "bg-bg-card text-text-primary shadow-sm"
                  : "text-text-tertiary"
              }`}
            >
              {labels[type]}
            </button>
          );
        })}
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <Filter size={14} className="text-text-tertiary shrink-0" />
        <button
          onClick={() => setFilterCategory("all")}
          className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium shrink-0 transition-colors ${
            filterCategory === "all"
              ? "bg-accent text-text-inverse"
              : "bg-bg-card border border-border text-text-secondary"
          }`}
        >
          전체
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setFilterCategory(c.value)}
            className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium shrink-0 transition-colors ${
              filterCategory === c.value
                ? "bg-accent text-text-inverse"
                : "bg-bg-card border border-border text-text-secondary"
            }`}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="거래 내역 검색..."
          className="w-full pl-10 pr-4 py-2.5 bg-bg-card border border-border rounded-[10px] text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-border-focus"
        />
      </div>

      {/* Transactions (grouped by date) */}
      <section>
        {filteredTxs.length === 0 ? (
          <div className="text-center py-16">
            <Subby size={56} mood="happy" className="mx-auto mb-3" />
            <p className="text-[13px] text-text-tertiary">거래 내역이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-5">
            {groupedTxs.map((group) => (
              <div key={group.date}>
                <h3 className="text-[13px] font-semibold text-text-secondary mb-2 px-1">
                  {group.label}
                </h3>
                <div className="space-y-2.5">
                  {group.txs.map((tx, i) => {
                    const cat = getCategoryInfo(tx.category);
                    return (
                      <div
                        key={tx.id}
                        onClick={() => openEditTx(tx)}
                        className="flex items-center gap-3.5 bg-bg-card rounded-[12px] p-4 border border-border group pressable stagger-item cursor-pointer"
                        style={{ animationDelay: `${i * 40}ms` }}
                      >
                        <div
                          className="w-11 h-11 rounded-[12px] flex items-center justify-center text-[18px] shrink-0"
                          style={{ backgroundColor: `${cat.color}15` }}
                        >
                          {cat.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[14px] text-text-primary truncate">
                            {tx.description}
                          </p>
                          <p className="text-[12px] text-text-tertiary mt-0.5">
                            {cat.label}
                          </p>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <p
                            className={`font-bold text-[15px] tabular-nums shrink-0 ${
                              tx.type === "income" ? "text-positive" : "text-text-primary"
                            }`}
                          >
                            {tx.type === "income" ? "+" : "-"}
                            {tx.amount.toLocaleString()}원
                          </p>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteTxConfirm(tx.id); }}
                            className="p-1.5 text-text-tertiary hover:text-negative transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add Transaction Bottom Sheet */}
      <BottomSheet
        open={showAddTx}
        onClose={() => { setShowAddTx(false); setEditingTx(null); }}
        size="full"
        title={editingTx ? "거래 수정" : "거래 추가"}
      >
        <form onSubmit={handleSubmitTx} className="space-y-4">
          {/* Type Toggle */}
          <div className="flex bg-bg-primary rounded-[10px] p-1">
            <button
              type="button"
              onClick={() => setTxForm({ ...txForm, type: "expense" })}
              className={`flex-1 py-2.5 text-[14px] font-semibold rounded-[8px] transition-all ${
                txForm.type === "expense"
                  ? "bg-negative text-text-inverse shadow-sm"
                  : "text-text-tertiary"
              }`}
            >
              지출
            </button>
            <button
              type="button"
              onClick={() => setTxForm({ ...txForm, type: "income" })}
              className={`flex-1 py-2.5 text-[14px] font-semibold rounded-[8px] transition-all ${
                txForm.type === "income"
                  ? "bg-positive text-text-inverse shadow-sm"
                  : "text-text-tertiary"
              }`}
            >
              수입
            </button>
          </div>

          <div>
            <label className="text-[12px] text-text-tertiary block mb-1.5">금액</label>
            <MoneyInput
              value={txForm.amount}
              onChange={(val) => setTxForm({ ...txForm, amount: val })}
              placeholder="10,000"
              className="px-4 py-3 bg-bg-primary border border-border rounded-[10px] text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-border-focus"
            />
          </div>

          <div>
            <label className="text-[12px] text-text-tertiary block mb-1.5">내용</label>
            <input
              type="text"
              value={txForm.description}
              onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
              placeholder="예: 점심 식사 (비워두면 카테고리명 사용)"
              className="w-full px-4 py-3 bg-bg-primary border border-border rounded-[10px] text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-border-focus"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[12px] text-text-tertiary block mb-1.5">카테고리</label>
              <select
                value={txForm.category}
                onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
                className="w-full px-3 py-3 bg-bg-primary border border-border rounded-[10px] text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-[130px]">
              <label className="text-[12px] text-text-tertiary block mb-1.5">날짜</label>
              <input
                type="date"
                value={txForm.date}
                onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                className="w-full px-3 py-3 bg-bg-primary border border-border rounded-[10px] text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          {/* Recurring toggle */}
          <button
            type="button"
            onClick={() => setTxForm({ ...txForm, is_recurring: !txForm.is_recurring })}
            className="flex items-center justify-between w-full p-3 bg-bg-primary rounded-[10px] border border-border"
          >
            <span className="text-[13px] text-text-primary">반복 거래</span>
            <div className={`w-10 h-6 rounded-full transition-colors relative ${txForm.is_recurring ? "bg-accent" : "bg-border"}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${txForm.is_recurring ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
          </button>

          <button
            type="submit"
            disabled={submitting || txForm.amount === 0}
            className="w-full py-[14px] bg-accent text-text-inverse font-semibold text-[15px] rounded-[12px] pressable hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {submitting ? "저장 중..." : editingTx ? "수정하기" : "추가하기"}
          </button>
        </form>
      </BottomSheet>

      {/* Add Budget Bottom Sheet */}
      <BottomSheet
        open={showAddBudget}
        onClose={() => setShowAddBudget(false)}
        size="full"
        title="예산 설정"
      >
        <form onSubmit={handleAddBudget} className="space-y-4">
          <div>
            <label className="text-[12px] text-text-tertiary block mb-1.5">카테고리</label>
            <select
              value={budgetForm.category}
              onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
              className="w-full px-4 py-3 bg-bg-primary border border-border rounded-[10px] text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[12px] text-text-tertiary block mb-1.5">월 예산 한도</label>
            <MoneyInput
              value={budgetForm.limit_amount}
              onChange={(val) => setBudgetForm({ ...budgetForm, limit_amount: val })}
              placeholder="300,000"
              className="px-4 py-3 bg-bg-primary border border-border rounded-[10px] text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-border-focus"
            />
          </div>

          <button
            type="submit"
            disabled={budgetForm.limit_amount === 0}
            className="w-full py-[14px] bg-accent text-text-inverse font-semibold text-[15px] rounded-[12px] pressable hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            설정하기
          </button>
        </form>
      </BottomSheet>

      {/* Page connections */}
      {transactions.length >= 5 && (
        <Link
          href="/report"
          className="flex items-center gap-3 bg-bg-card rounded-[12px] p-4 border border-border pressable mt-6"
        >
          <div className="w-9 h-9 rounded-[10px] bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Sparkles size={16} className="text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-text-primary">이번 달 소비 리포트 보기</p>
            <p className="text-[11px] text-text-tertiary">AI가 분석한 내 소비 패턴</p>
          </div>
          <ChevronRight size={16} className="text-text-tertiary" />
        </Link>
      )}

      <ConfirmDialog
        open={deleteTxConfirm !== null}
        title="거래 삭제"
        message="이 거래를 삭제할까요?"
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
        onConfirm={confirmDeleteTx}
        onCancel={() => setDeleteTxConfirm(null)}
      />
    </div>
  );
}
