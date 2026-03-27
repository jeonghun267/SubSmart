"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Transaction } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

export function useTransactions(month: string) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    if (!user) return;

    const monthStart = `${month}-01`;
    const [year, m] = month.split("-").map(Number);
    const monthEnd = format(new Date(year, m, 0), "yyyy-MM-dd");

    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", monthStart)
      .lte("date", monthEnd)
      .order("date", { ascending: false });

    setTransactions((data || []) as Transaction[]);
    setLoading(false);
  }, [user, month]);

  useEffect(() => {
    if (user) loadTransactions();
  }, [user, month, loadTransactions]);

  // Listen for custom refresh event
  useEffect(() => {
    const handleRefresh = () => {
      loadTransactions();
    };
    window.addEventListener("subsmart:refresh", handleRefresh);
    return () => window.removeEventListener("subsmart:refresh", handleRefresh);
  }, [loadTransactions]);

  // Derived values
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  // Mutations

  async function addTransaction(payload: {
    amount: number;
    type: "income" | "expense";
    category: string;
    description: string;
    date: string;
    is_recurring?: boolean;
    subscription_id?: string;
  }) {
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("transactions")
      .insert({ ...payload, user_id: user.id });
    if (error) throw error;
    await loadTransactions();
  }

  async function updateTransaction(
    id: string,
    payload: {
      amount: number;
      type: "income" | "expense";
      category: string;
      description: string;
      date: string;
      is_recurring?: boolean;
    }
  ) {
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("transactions")
      .update({ ...payload, user_id: user.id })
      .eq("id", id);
    if (error) throw error;
    await loadTransactions();
  }

  async function deleteTransaction(id: string) {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);
    if (error) throw error;
    await loadTransactions();
  }

  return {
    transactions,
    totalExpense,
    totalIncome,
    loading,
    reload: loadTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
