"use client";

import { useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/types";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "./BottomNav";
import BottomSheet from "./BottomSheet";
import MoneyInput from "./MoneyInput";
import { showToast } from "./Toast";
import OfflineBanner from "./OfflineBanner";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShellInner>{children}</AppShellInner>
    </AuthProvider>
  );
}

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAmount, setQuickAmount] = useState(0);
  const [quickCategory, setQuickCategory] = useState("food");
  const [quickSaving, setQuickSaving] = useState(false);

  function handleOpenQuickAdd() {
    setQuickAmount(0);
    setQuickCategory("food");
    setShowQuickAdd(true);
  }

  async function handleQuickAdd() {
    if (quickAmount <= 0) return;
    setQuickSaving(true);
    if (!user) { setQuickSaving(false); return; }

    const catInfo = CATEGORIES.find((c) => c.value === quickCategory) || CATEGORIES[CATEGORIES.length - 1];
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      amount: quickAmount,
      type: "expense",
      category: quickCategory,
      description: catInfo.label,
      date: format(new Date(), "yyyy-MM-dd"),
      is_recurring: false,
    });

    setQuickSaving(false);
    if (error) {
      showToast("저장 실패", "error");
    } else {
      showToast(`${quickAmount.toLocaleString()}원 지출 기록 완료`, "success");
      setShowQuickAdd(false);
      // Trigger page refresh by dispatching custom event
      window.dispatchEvent(new Event("subsmart:refresh"));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto w-full flex flex-col min-h-screen">
      <OfflineBanner />
      <main className="flex-1 pb-[86px] px-5 pt-5">{children}</main>
      <BottomNav onQuickAdd={handleOpenQuickAdd} />

      {/* Global Quick Add Bottom Sheet */}
      <BottomSheet open={showQuickAdd} onClose={() => setShowQuickAdd(false)} title="빠른 지출 기록">
        <div className="space-y-5">
          <div>
            <label className="text-[12px] text-text-tertiary mb-1.5 block">금액</label>
            <MoneyInput
              value={quickAmount}
              onChange={setQuickAmount}
              placeholder="0"
              className="w-full px-4 py-3 bg-bg-primary border border-border rounded-[12px] text-[18px] font-bold text-text-primary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex gap-2">
            {[3000, 5000, 10000, 50000].map((amt) => (
              <button
                key={amt}
                onClick={() => setQuickAmount(amt)}
                className={`flex-1 py-2 rounded-[10px] text-[13px] font-medium pressable transition-colors ${
                  quickAmount === amt
                    ? "bg-accent text-white"
                    : "bg-bg-primary text-text-secondary border border-border"
                }`}
              >
                {amt >= 10000 ? `${amt / 10000}만` : `${amt / 1000}천`}
              </button>
            ))}
          </div>

          <div>
            <label className="text-[12px] text-text-tertiary mb-2 block">카테고리</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.slice(0, 8).map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setQuickCategory(cat.value)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-[10px] pressable transition-colors ${
                    quickCategory === cat.value
                      ? "bg-accent-soft border border-accent/30"
                      : "bg-bg-primary border border-border"
                  }`}
                >
                  <span className="text-[18px]">{cat.icon}</span>
                  <span className={`text-[11px] font-medium ${
                    quickCategory === cat.value ? "text-accent" : "text-text-tertiary"
                  }`}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={quickAmount <= 0 || quickSaving}
            className="w-full py-[14px] bg-accent text-white font-semibold text-[15px] rounded-[12px] pressable hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {quickSaving ? "저장 중..." : quickAmount > 0 ? `${quickAmount.toLocaleString()}원 기록하기` : "금액을 입력하세요"}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
