"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { SavingsGoal } from "@/lib/types";
import { ArrowLeft, Plus, Trash2, Crown, Sparkles, PiggyBank } from "lucide-react";
import Link from "next/link";
import Subby from "@/components/Subby";
import { DashboardSkeleton } from "@/components/Skeleton";
import { isPremium } from "@/lib/premium";
import { authFetch } from "@/lib/api";
import MoneyInput from "@/components/MoneyInput";
import ConfirmDialog from "@/components/ConfirmDialog";
import { showToast } from "@/components/Toast";
import BottomSheet from "@/components/BottomSheet";

const GOAL_EMOJIS = ["🎯", "✈️", "🏠", "🚗", "💰", "🎓", "💻", "👜", "🎁", "🏖️"];

export default function GoalsPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <GoalsPageInner />
    </Suspense>
  );
}

function GoalsPageInner() {
  const searchParams = useSearchParams();
  const { user: authUser } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [challenge, setChallenge] = useState("");
  const [challengeLoading, setChallengeLoading] = useState(false);

  // Quick deposit state
  const [depositGoal, setDepositGoal] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositLoading, setDepositLoading] = useState(false);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmGoalId, setConfirmGoalId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    target_amount: 0,
    current_amount: 0,
    deadline: "",
    emoji: "🎯",
  });

  // Handle ?suggest= query parameter from simulator page
  useEffect(() => {
    const suggest = searchParams.get("suggest");
    if (suggest) {
      const amount = Number(suggest);
      if (!isNaN(amount) && amount > 0) {
        setForm((prev) => ({ ...prev, target_amount: amount }));
        setShowAdd(true);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authUser) return;
    loadGoals();
    // Auto-generate challenge on first load
    const cached = localStorage.getItem("subsmart_challenge");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const today = new Date().toISOString().split("T")[0];
        if (parsed.date === today) {
          setChallenge(parsed.text);
          return;
        }
      } catch { /* ignore */ }
    }
    generateChallenge();
  }, [authUser]);

  async function loadGoals() {
    if (!authUser) return;
    const { data } = await supabase
      .from("savings_goals")
      .select("*")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false });
    setGoals(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!authUser) return;

    const payload = {
      user_id: authUser.id,
      name: form.name.trim(),
      target_amount: form.target_amount,
      current_amount: form.current_amount || 0,
      deadline: form.deadline || null,
      emoji: form.emoji,
    };

    if (editingGoal) {
      await supabase.from("savings_goals").update(payload).eq("id", editingGoal.id);
      showToast("목표가 수정되었어요", "success");
    } else {
      await supabase.from("savings_goals").insert(payload);
      showToast("새 목표가 추가되었어요", "success");
    }

    setShowAdd(false);
    setEditingGoal(null);
    resetForm();
    loadGoals();
  }

  function resetForm() {
    setForm({ name: "", target_amount: 0, current_amount: 0, deadline: "", emoji: "🎯" });
  }

  function openEdit(goal: SavingsGoal) {
    setEditingGoal(goal);
    setForm({
      name: goal.name,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      deadline: goal.deadline || "",
      emoji: goal.emoji,
    });
    setShowAdd(true);
  }

  function requestDeleteGoal(id: string) {
    setConfirmGoalId(id);
    setConfirmOpen(true);
  }

  async function confirmDeleteGoal() {
    if (!confirmGoalId) return;
    await supabase.from("savings_goals").delete().eq("id", confirmGoalId);
    setConfirmOpen(false);
    setConfirmGoalId(null);
    showToast("목표가 삭제되었어요", "success");
    loadGoals();
  }

  // Quick deposit
  function openDeposit(goal: SavingsGoal) {
    setDepositGoal(goal);
    setDepositAmount(0);
  }

  async function handleDeposit() {
    if (!depositGoal || depositAmount <= 0) {
      showToast("입금할 금액을 선택해주세요", "error");
      return;
    }
    setDepositLoading(true);
    const newAmount = depositGoal.current_amount + depositAmount;
    const { error } = await supabase
      .from("savings_goals")
      .update({ current_amount: newAmount })
      .eq("id", depositGoal.id);

    if (error) {
      showToast("저축에 실패했어요. 다시 시도해주세요.", "error");
    } else {
      const isNowComplete = newAmount >= depositGoal.target_amount;
      showToast(
        isNowComplete
          ? `${depositGoal.name} 목표 달성! 축하해요!`
          : `${depositAmount.toLocaleString()}원 저축 완료!`,
        "success"
      );
    }
    setDepositLoading(false);
    setDepositGoal(null);
    setDepositAmount(0);
    loadGoals();
  }

  async function generateChallenge() {
    setChallengeLoading(true);
    try {
      if (!authUser) return;

      const [subsRes, txRes] = await Promise.all([
        supabase.from("subscriptions").select("name,amount").eq("user_id", authUser.id).eq("is_active", true),
        supabase.from("transactions").select("amount,category,type").eq("user_id", authUser.id)
          .order("date", { ascending: false }).limit(30),
      ]);

      const res = await authFetch("/api/ai-insight", {
        method: "POST",
        body: JSON.stringify({
          subscriptions: subsRes.data,
          transactions: txRes.data,
          type: "tip",
        }),
      });
      const data = await res.json();
      const text = data.insight || "이번 주는 배달 대신 집밥을 도전해보세요!";
      setChallenge(text);
      localStorage.setItem("subsmart_challenge", JSON.stringify({ date: new Date().toISOString().split("T")[0], text }));
    } catch {
      setChallenge("이번 주는 커피 대신 텀블러를 사용해보세요! ☕");
    } finally {
      setChallengeLoading(false);
    }
  }

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-1 pressable">
            <ArrowLeft size={20} className="text-text-secondary" />
          </Link>
          <h1 className="text-[20px] font-bold text-text-primary">목표 저축</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* TODO: 프리미엄 결제 연동 후 PRO 뱃지 활성화 */}
          <button
            onClick={() => { setEditingGoal(null); resetForm(); setShowAdd(true); }}
            className="flex items-center gap-1 px-3 py-2 bg-accent text-text-inverse text-[13px] font-semibold rounded-[10px] pressable"
          >
            <Plus size={14} /> 추가
          </button>
        </div>
      </div>

      {/* Weekly Challenge */}
      <div className="bg-accent-soft rounded-[14px] p-4 border border-accent/10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={14} className="text-accent" />
          <span className="text-[12px] font-semibold text-accent">이번 주 챌린지</span>
        </div>
        {challenge ? (
          <p className="text-[13px] text-text-primary leading-snug">{challenge}</p>
        ) : (
          <button
            onClick={generateChallenge}
            disabled={challengeLoading}
            className="text-[13px] text-accent font-medium pressable"
          >
            {challengeLoading ? "생성 중..." : "AI 챌린지 받기 →"}
          </button>
        )}
      </div>

      {/* Goals */}
      {goals.length === 0 && !showAdd ? (
        <div className="text-center py-16">
          <Subby size={72} mood="happy" className="mx-auto mb-4" />
          <p className="font-semibold text-[16px] text-text-primary">저축 목표를 만들어보세요</p>
          <p className="text-[13px] text-text-tertiary mt-1.5 max-w-[240px] mx-auto">
            여행, 전자기기, 비상금 등 목표를 설정하고 달성해보세요
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const pct = goal.target_amount > 0
              ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
              : 0;
            const remaining = Math.max(0, goal.target_amount - goal.current_amount);
            const isComplete = pct >= 100;

            return (
              <div
                key={goal.id}
                onClick={() => openEdit(goal)}
                className="bg-bg-card rounded-[14px] p-4 border border-border pressable cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[24px]">{goal.emoji}</span>
                    <div>
                      <p className="font-semibold text-[14px] text-text-primary">{goal.name}</p>
                      {goal.deadline && (
                        <p className="text-[11px] text-text-tertiary mt-0.5">
                          D-{Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000))}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isComplete && <span className="text-[11px] bg-positive-soft text-positive font-bold px-2 py-0.5 rounded-full">달성!</span>}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeposit(goal);
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                      title="빠른 저축"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); requestDeleteGoal(goal.id); }}
                      className="p-1 text-text-tertiary hover:text-negative"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2.5 bg-bg-primary rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isComplete ? "#10B981" : "#3182F6",
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-text-tertiary">
                    {goal.current_amount.toLocaleString()}원
                  </span>
                  <span className="font-medium text-text-primary">
                    {pct}% · 남은 금액 {remaining.toLocaleString()}원
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Form (inline, not BottomSheet) */}
      {showAdd && (
        <div className="bg-bg-card rounded-[14px] p-5 border border-border">
          <h3 className="text-[15px] font-semibold text-text-primary mb-4">
            {editingGoal ? "목표 수정" : "새 목표"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Emoji picker */}
            <div className="flex gap-2 flex-wrap">
              {GOAL_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setForm({ ...form, emoji: e })}
                  className={`w-10 h-10 rounded-[10px] text-[20px] flex items-center justify-center border-2 transition-all ${
                    form.emoji === e ? "border-accent bg-accent-soft" : "border-border"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>

            <div>
              <label className="text-[12px] text-text-tertiary block mb-1.5">목표 이름</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="예: 제주도 여행"
                className="w-full px-4 py-3 bg-bg-primary border border-border rounded-[10px] text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[12px] text-text-tertiary block mb-1.5">목표 금액</label>
                <MoneyInput
                  value={form.target_amount}
                  onChange={(v) => setForm({ ...form, target_amount: v })}
                  placeholder="2,000,000"
                  className="px-4 py-3 bg-bg-primary border border-border rounded-[10px] text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div className="flex-1">
                <label className="text-[12px] text-text-tertiary block mb-1.5">현재 모은 금액</label>
                <MoneyInput
                  value={form.current_amount}
                  onChange={(v) => setForm({ ...form, current_amount: v })}
                  placeholder="0"
                  className="px-4 py-3 bg-bg-primary border border-border rounded-[10px] text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>

            <div>
              <label className="text-[12px] text-text-tertiary block mb-1.5">목표 날짜 (선택)</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full px-4 py-3 bg-bg-primary border border-border rounded-[10px] text-[14px] text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowAdd(false); setEditingGoal(null); resetForm(); }}
                className="flex-1 py-[12px] bg-bg-primary border border-border text-text-secondary font-semibold text-[14px] rounded-[10px] pressable"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 py-[12px] bg-accent text-text-inverse font-semibold text-[14px] rounded-[10px] pressable"
              >
                {editingGoal ? "수정하기" : "추가하기"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Simulator link */}
      <Link
        href="/simulator"
        className="block bg-bg-card rounded-[14px] p-4 border border-border pressable text-center"
      >
        <div className="flex items-center justify-center gap-2">
          <PiggyBank size={18} className="text-accent" />
          <span className="text-[14px] font-semibold text-accent">
            구독 절약하면 얼마나 모을 수 있을까?
          </span>
        </div>
        <p className="text-[12px] text-text-tertiary mt-1">
          시뮬레이터로 절약 효과를 확인해보세요 →
        </p>
      </Link>

      {/* Quick Deposit BottomSheet */}
      <BottomSheet
        open={!!depositGoal}
        onClose={() => { setDepositGoal(null); setDepositAmount(0); }}
        title="빠른 저축"
      >
        {depositGoal && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="text-[28px]">{depositGoal.emoji}</span>
              <div>
                <p className="font-semibold text-[15px] text-text-primary">{depositGoal.name}</p>
                <p className="text-[12px] text-text-tertiary">
                  현재 {depositGoal.current_amount.toLocaleString()}원 / {depositGoal.target_amount.toLocaleString()}원
                </p>
              </div>
            </div>

            {/* Quick amount buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "+1만", value: 10000 },
                { label: "+5만", value: 50000 },
                { label: "+10만", value: 100000 },
              ].map((btn) => (
                <button
                  key={btn.value}
                  type="button"
                  onClick={() => setDepositAmount(btn.value)}
                  className={`py-3 rounded-[10px] text-[14px] font-semibold transition-all pressable ${
                    depositAmount === btn.value
                      ? "bg-accent text-white"
                      : "bg-bg-primary border border-border text-text-primary"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div>
              <label className="text-[12px] text-text-tertiary block mb-1.5">직접 입력</label>
              <MoneyInput
                value={depositAmount}
                onChange={(v) => setDepositAmount(v)}
                placeholder="금액을 입력하세요"
                className="px-4 py-3 bg-bg-primary border border-border rounded-[10px] text-[14px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            {depositAmount > 0 && (
              <p className="text-[12px] text-text-secondary text-center">
                저축 후 금액: <span className="font-semibold text-accent">{(depositGoal.current_amount + depositAmount).toLocaleString()}원</span>
              </p>
            )}

            <button
              onClick={handleDeposit}
              disabled={depositLoading || depositAmount <= 0}
              className="w-full py-[14px] bg-accent text-text-inverse font-semibold text-[15px] rounded-[12px] pressable disabled:opacity-50"
            >
              {depositLoading ? "저축 중..." : `${depositAmount > 0 ? depositAmount.toLocaleString() + "원 " : ""}저축하기`}
            </button>
          </div>
        )}
      </BottomSheet>

      {/* Confirm Dialog for delete */}
      <ConfirmDialog
        open={confirmOpen}
        title="목표 삭제"
        message="이 목표를 삭제할까요? 삭제하면 되돌릴 수 없어요."
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
        onConfirm={confirmDeleteGoal}
        onCancel={() => { setConfirmOpen(false); setConfirmGoalId(null); }}
      />
    </div>
  );
}
