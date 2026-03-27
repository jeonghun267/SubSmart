"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Budget, Transaction } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

export function useBudgets(month: string) {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBudgets = useCallback(async () => {
    if (!user) return;

    const monthStart = `${month}-01`;
    const [year, m] = month.split("-").map(Number);
    const monthEnd = format(new Date(year, m, 0), "yyyy-MM-dd");

    const [budgetRes, txRes] = await Promise.all([
      supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .eq("month", month),
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "expense")
        .gte("date", monthStart)
        .lte("date", monthEnd),
    ]);

    setBudgets((budgetRes.data || []) as Budget[]);
    setExpenses((txRes.data || []) as Transaction[]);
    setLoading(false);
  }, [user, month]);

  useEffect(() => {
    if (user) loadBudgets();
  }, [user, month, loadBudgets]);

  // Listen for custom refresh event
  useEffect(() => {
    const handleRefresh = () => {
      loadBudgets();
    };
    window.addEventListener("subsmart:refresh", handleRefresh);
    return () => window.removeEventListener("subsmart:refresh", handleRefresh);
  }, [loadBudgets]);

  // Derived values
  const totalBudget = budgets.reduce((sum, b) => sum + b.limit_amount, 0);

  const categoryExpenseMap = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((t) => {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    });
    return map;
  }, [expenses]);

  // Mutations

  async function setBudget(payload: {
    category: string;
    limit_amount: number;
  }) {
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase.from("budgets").upsert(
      {
        user_id: user.id,
        category: payload.category,
        limit_amount: payload.limit_amount,
        month,
      },
      { onConflict: "user_id,category,month" }
    );
    if (error) throw error;
    await loadBudgets();
  }

  return {
    budgets,
    totalBudget,
    categoryExpenseMap,
    loading,
    reload: loadBudgets,
    setBudget,
  };
}
