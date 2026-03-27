"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Subscription, CATEGORIES, POPULAR_SUBSCRIPTIONS, getCategoryInfo } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { advancePastBillingDates } from "@/lib/billing";
import { format } from "date-fns";
import {
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Search,
  Calculator,
} from "lucide-react";
import Link from "next/link";
import AnimatedNumber from "@/components/AnimatedNumber";
import BottomSheet from "@/components/BottomSheet";
import ConfirmDialog from "@/components/ConfirmDialog";
import MoneyInput from "@/components/MoneyInput";
import { DashboardSkeleton } from "@/components/Skeleton";
import Subby from "@/components/Subby";
import { showToast } from "@/components/Toast";

export default function SubscriptionsPage() {
  const { user: authUser } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [pendingPauseSub, setPendingPauseSub] = useState<Subscription | null>(null);

  const [form, setForm] = useState({
    name: "",
    amount: 0,
    billing_cycle: "monthly" as "monthly" | "yearly" | "weekly",
    category: "other",
    next_billing_date: format(new Date(), "yyyy-MM-dd"),
    color: "#6B7280",
    memo: "",
  });

  useEffect(() => {
    if (authUser) loadSubscriptions();
  }, [authUser]);

  async function loadSubscriptions() {
    if (!authUser) return;

    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", authUser.id)
      .order("is_active", { ascending: false })
      .order("next_billing_date", { ascending: true });

    // Auto-advance past billing dates
    const subs = data || [];
    const { updatedIds } = advancePastBillingDates(subs);
    if (updatedIds.length > 0) {
      await Promise.all(
        updatedIds.map(({ id, next_billing_date }) =>
          supabase.from("subscriptions").update({ next_billing_date }).eq("id", id).then()
        )
      );
    }

    setSubscriptions(subs);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      if (!authUser) return;

      const payload = {
        user_id: authUser.id,
        name: form.name.trim(),
        amount: form.amount,
        billing_cycle: form.billing_cycle,
        category: form.category,
        next_billing_date: form.next_billing_date,
        color: form.color,
        memo: form.memo.trim(),
      };

      const { error } = editingSub
        ? await supabase.from("subscriptions").update(payload).eq("id", editingSub.id)
        : await supabase.from("subscriptions").insert(payload);

      if (error) {
        showToast("저장에 실패했습니다. 다시 시도해주세요.", "error");
        return;
      }

      setShowAdd(false);
      setEditingSub(null);
      resetForm();
      loadSubscriptions();
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(sub: Subscription) {
    setEditingSub(sub);
    setForm({
      name: sub.name,
      amount: sub.amount,
      billing_cycle: sub.billing_cycle,
      category: sub.category,
      next_billing_date: sub.next_billing_date,
      color: sub.color || "#6B7280",
      memo: sub.memo || "",
    });
    setShowAdd(true);
  }

  function resetForm() {
    setForm({
      name: "",
      amount: 0,
      billing_cycle: "monthly",
      category: "other",
      next_billing_date: format(new Date(), "yyyy-MM-dd"),
      color: "#6B7280",
      memo: "",
    });
    setSearchQuery("");
  }

  function toggleActive(sub: Subscription) {
    setPendingPauseSub(sub);
    setShowPauseConfirm(true);
  }

  async function confirmToggleActive() {
    if (!pendingPauseSub) return;
    const wasActive = pendingPauseSub.is_active;
    const { error } = await supabase
      .from("subscriptions")
      .update({ is_active: !wasActive })
      .eq("id", pendingPauseSub.id);
    setShowPauseConfirm(false);
    setPendingPauseSub(null);
    if (error) {
      showToast("변경에 실패했습니다.", "error");
      return;
    }
    showToast(
      wasActive ? "구독이 일시정지되었습니다." : "구독이 활성화되었습니다.",
      "success"
    );
    loadSubscriptions();
  }

  function deleteSub(id: string) {
    setPendingDeleteId(id);
    setShowDeleteConfirm(true);
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return;
    const { error } = await supabase.from("subscriptions").delete().eq("id", pendingDeleteId);
    setShowDeleteConfirm(false);
    setPendingDeleteId(null);
    if (error) {
      showToast("삭제에 실패했습니다.", "error");
      return;
    }
    showToast("구독이 삭제되었습니다.", "success");
    loadSubscriptions();
  }

  function selectPopular(pop: (typeof POPULAR_SUBSCRIPTIONS)[number]) {
    setForm({ ...form, name: pop.name, amount: pop.amount, category: pop.category, color: pop.color });
  }

  function getNextBillingText(sub: Subscription) {
    const d = new Date(sub.next_billing_date);
    const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return "결제일 지남";
    if (diff === 0) return "오늘 결제";
    if (diff === 1) return "내일 결제";
    if (diff <= 7) return `${diff}일 후`;
    return format(d, "M/d");
  }

  const activeSubs = subscriptions.filter((s) => s.is_active);
  const inactiveSubs = subscriptions.filter((s) => !s.is_active);

  const totalMonthly = activeSubs.reduce((sum, s) => {
    if (s.billing_cycle === "yearly") return sum + s.amount / 12;
    if (s.billing_cycle === "weekly") return sum + s.amount * 4;
    return sum + s.amount;
  }, 0);

  const filteredPopular = POPULAR_SUBSCRIPTIONS.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-7 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-text-primary">내 구독</h1>
          <p className="text-[13px] text-text-secondary mt-0.5">
            월{" "}
            <AnimatedNumber
              value={Math.round(totalMonthly)}
              suffix="원"
              className="font-semibold text-accent"
            />{" "}
            결제 중
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/simulator"
            className="flex items-center gap-1 px-3 py-2.5 bg-bg-card border border-border text-[13px] font-medium text-text-secondary rounded-[10px] pressable"
          >
            <Calculator size={14} /> 절약
          </Link>
          <button
            onClick={() => { setEditingSub(null); resetForm(); setShowAdd(true); }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-accent text-text-inverse text-[13px] font-semibold rounded-[10px] pressable"
          >
            <Plus size={16} /> 추가
          </button>
        </div>
      </div>

      {/* Active Subscriptions */}
      {activeSubs.length === 0 && inactiveSubs.length === 0 ? (
        <div className="text-center py-20">
          <div className="mx-auto mb-4">
            <Subby size={80} mood="happy" />
          </div>
          <p className="font-semibold text-[16px] text-text-primary">
            구독을 추가해보세요
          </p>
          <p className="text-[13px] text-text-tertiary mt-1.5 max-w-[240px] mx-auto">
            넷플릭스, 유튜브 프리미엄 등 구독 서비스를 관리하세요
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            {activeSubs.map((sub, i) => {
              const cat = getCategoryInfo(sub.category);
              const billingText = getNextBillingText(sub);
              const isUrgent =
                billingText.includes("오늘") ||
                billingText.includes("내일") ||
                billingText.includes("일 후");

              return (
                <div
                  key={sub.id}
                  onClick={() => openEdit(sub)}
                  className="flex items-center gap-3.5 bg-bg-card rounded-[12px] p-4 border border-border pressable stagger-item cursor-pointer"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div
                    className="w-11 h-11 rounded-[12px] flex items-center justify-center text-[18px] shrink-0"
                    style={{ backgroundColor: `${sub.color || cat.color}15` }}
                  >
                    {cat.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[14px] text-text-primary truncate">
                      {sub.name}
                    </p>
                    <p
                      className={`text-[12px] mt-0.5 ${
                        isUrgent
                          ? "text-warning font-medium"
                          : "text-text-tertiary"
                      }`}
                    >
                      {billingText} ·{" "}
                      {sub.billing_cycle === "monthly"
                        ? "월간"
                        : sub.billing_cycle === "yearly"
                        ? "연간"
                        : "주간"}
                      {sub.memo && ` · ${sub.memo}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-[15px] text-text-primary tabular-nums">
                      {sub.amount.toLocaleString()}원
                    </p>
                    <div className="flex gap-1.5 mt-1.5 justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleActive(sub);
                        }}
                        className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-tertiary hover:text-warning transition-colors"
                      >
                        <ToggleRight size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSub(sub.id);
                        }}
                        className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-tertiary hover:text-negative transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {inactiveSubs.length > 0 && (
            <div>
              <h3 className="text-[13px] text-text-tertiary font-medium mb-2.5">
                일시정지됨
              </h3>
              <div className="space-y-2.5">
                {inactiveSubs.map((sub) => {
                  const cat = getCategoryInfo(sub.category);
                  return (
                    <div
                      key={sub.id}
                      onClick={() => openEdit(sub)}
                      className="flex items-center gap-3.5 bg-bg-card rounded-[12px] p-4 border border-border opacity-60 cursor-pointer"
                    >
                      <div
                        className="w-11 h-11 rounded-[12px] flex items-center justify-center text-[18px]"
                        style={{ backgroundColor: `${sub.color || cat.color}15` }}
                      >
                        {cat.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[14px] text-text-primary truncate">
                          {sub.name}
                        </p>
                        <p className="text-[12px] text-text-tertiary">일시정지</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleActive(sub);
                          }}
                          className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-tertiary hover:text-positive"
                        >
                          <ToggleLeft size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSub(sub.id);
                          }}
                          className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-tertiary hover:text-negative"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Bottom Sheet */}
      <BottomSheet open={showAdd} onClose={() => { setShowAdd(false); setEditingSub(null); resetForm(); }} title={editingSub ? "구독 수정" : "구독 추가"}>
        {/* Popular Subscriptions - only show in add mode */}
        {!editingSub && <div className="mb-6">
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
            <input
              type="text"
              placeholder="인기 구독 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-bg-primary border border-border rounded-[10px] text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filteredPopular.map((pop) => (
              <button
                key={pop.name}
                onClick={() => selectPopular(pop)}
                className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium border transition-all pressable ${
                  form.name === pop.name
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border bg-bg-primary text-text-secondary hover:border-accent/30"
                }`}
              >
                {pop.name}
              </button>
            ))}
          </div>
        </div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[12px] text-text-tertiary block mb-1.5">서비스명</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="예: 넷플릭스"
              className="w-full px-4 py-3 bg-bg-primary border border-border rounded-[10px] text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-border-focus"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[12px] text-text-tertiary block mb-1.5">금액</label>
              <MoneyInput
                value={form.amount}
                onChange={(v) => setForm({ ...form, amount: v })}
                placeholder="17,000"
                className="px-4 py-3 bg-bg-primary border border-border rounded-[10px] text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-border-focus"
              />
            </div>
            <div className="w-[110px]">
              <label className="text-[12px] text-text-tertiary block mb-1.5">결제 주기</label>
              <select
                value={form.billing_cycle}
                onChange={(e) => setForm({ ...form, billing_cycle: e.target.value as "monthly" | "yearly" | "weekly" })}
                className="w-full px-3 py-3 bg-bg-primary border border-border rounded-[10px] text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="weekly">주간</option>
                <option value="monthly">월간</option>
                <option value="yearly">연간</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[12px] text-text-tertiary block mb-1.5">카테고리</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
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
            <label className="text-[12px] text-text-tertiary block mb-1.5">다음 결제일</label>
            <input
              type="date"
              value={form.next_billing_date}
              onChange={(e) => setForm({ ...form, next_billing_date: e.target.value })}
              required
              className="w-full px-4 py-3 bg-bg-primary border border-border rounded-[10px] text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-border-focus"
            />
          </div>

          <div>
            <label className="text-[12px] text-text-tertiary block mb-1.5">색상</label>
            <div className="flex gap-2 flex-wrap">
              {["#6B7280","#EF4444","#F59E0B","#10B981","#3B82F6","#8B5CF6","#EC4899","#E50914","#1DB954","#FF0000"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? "border-text-primary scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-[12px] text-text-tertiary block mb-1.5">메모 (선택)</label>
            <input
              type="text"
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              placeholder="예: 가족 공유 계정"
              className="w-full px-4 py-3 bg-bg-primary border border-border rounded-[10px] text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-[14px] bg-accent text-text-inverse font-semibold text-[15px] rounded-[12px] pressable hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {submitting ? "저장 중..." : editingSub ? "수정하기" : "추가하기"}
          </button>
        </form>
      </BottomSheet>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="구독 삭제"
        message="이 구독을 삭제할까요?"
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => { setShowDeleteConfirm(false); setPendingDeleteId(null); }}
      />

      <ConfirmDialog
        open={showPauseConfirm}
        title={pendingPauseSub?.is_active ? "구독 일시정지" : "구독 활성화"}
        message={
          pendingPauseSub?.is_active
            ? `${pendingPauseSub?.name} 구독을 일시정지할까요?`
            : `${pendingPauseSub?.name} 구독을 다시 활성화할까요?`
        }
        confirmText="확인"
        cancelText="취소"
        onConfirm={confirmToggleActive}
        onCancel={() => { setShowPauseConfirm(false); setPendingPauseSub(null); }}
      />
    </div>
  );
}
