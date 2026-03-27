import { format } from "date-fns";
import { Subscription } from "@/lib/types";

/**
 * Advances past billing dates for active subscriptions to the next future date.
 * Mutates the subscriptions in-place and returns them.
 * Also returns a list of subscription IDs whose next_billing_date was updated
 * (these need a Supabase UPDATE).
 */
export function advancePastBillingDates(subs: Subscription[]): {
  subscriptions: Subscription[];
  updatedIds: { id: string; next_billing_date: string }[];
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const updatedIds: { id: string; next_billing_date: string }[] = [];

  subs.forEach((sub) => {
    if (!sub.is_active) return;
    const billing = new Date(sub.next_billing_date);
    if (billing < today) {
      const next = new Date(billing);
      while (next < today) {
        if (sub.billing_cycle === "monthly") next.setMonth(next.getMonth() + 1);
        else if (sub.billing_cycle === "yearly") next.setFullYear(next.getFullYear() + 1);
        else next.setDate(next.getDate() + 7);
      }
      const nextDate = format(next, "yyyy-MM-dd");
      sub.next_billing_date = nextDate;
      updatedIds.push({ id: sub.id, next_billing_date: nextDate });
    }
  });

  return { subscriptions: subs, updatedIds };
}
