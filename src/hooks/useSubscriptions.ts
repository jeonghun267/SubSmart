"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Subscription } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { advancePastBillingDates } from "@/lib/billing";

export function useSubscriptions() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSubscriptions = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("is_active", { ascending: false })
      .order("next_billing_date", { ascending: true });

    const subs = (data || []) as Subscription[];

    // Auto-advance past billing dates
    const { updatedIds } = advancePastBillingDates(subs);
    if (updatedIds.length > 0) {
      await Promise.all(
        updatedIds.map(({ id, next_billing_date }) =>
          supabase
            .from("subscriptions")
            .update({ next_billing_date })
            .eq("id", id)
            .then()
        )
      );
    }

    setSubscriptions(subs);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) loadSubscriptions();
  }, [user, loadSubscriptions]);

  // Listen for custom refresh event
  useEffect(() => {
    const handleRefresh = () => {
      loadSubscriptions();
    };
    window.addEventListener("subsmart:refresh", handleRefresh);
    return () => window.removeEventListener("subsmart:refresh", handleRefresh);
  }, [loadSubscriptions]);

  // Derived values
  const activeSubscriptions = subscriptions.filter((s) => s.is_active);
  const inactiveSubscriptions = subscriptions.filter((s) => !s.is_active);

  const totalMonthly = activeSubscriptions.reduce((sum, s) => {
    if (s.billing_cycle === "yearly") return sum + s.amount / 12;
    if (s.billing_cycle === "weekly") return sum + s.amount * 4;
    return sum + s.amount;
  }, 0);

  // Mutations

  async function addSubscription(payload: {
    name: string;
    amount: number;
    billing_cycle: "monthly" | "yearly" | "weekly";
    category: string;
    next_billing_date: string;
    color?: string;
    memo?: string;
  }) {
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("subscriptions")
      .insert({ ...payload, user_id: user.id });
    if (error) throw error;
    await loadSubscriptions();
  }

  async function updateSubscription(
    id: string,
    payload: {
      name: string;
      amount: number;
      billing_cycle: "monthly" | "yearly" | "weekly";
      category: string;
      next_billing_date: string;
      color?: string;
      memo?: string;
    }
  ) {
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("subscriptions")
      .update({ ...payload, user_id: user.id })
      .eq("id", id);
    if (error) throw error;
    await loadSubscriptions();
  }

  async function deleteSubscription(id: string) {
    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", id);
    if (error) throw error;
    await loadSubscriptions();
  }

  async function toggleActive(id: string, currentlyActive: boolean) {
    const { error } = await supabase
      .from("subscriptions")
      .update({ is_active: !currentlyActive })
      .eq("id", id);
    if (error) throw error;
    await loadSubscriptions();
  }

  return {
    subscriptions,
    activeSubscriptions,
    inactiveSubscriptions,
    totalMonthly,
    loading,
    reload: loadSubscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleActive,
  };
}
