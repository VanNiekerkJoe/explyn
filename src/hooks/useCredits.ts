import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserCredits {
  total_credits: number;
  used_credits: number;
  plan: string;
  credits_reset_at: string;
}

const PLAN_LIMITS: Record<string, number> = {
  free: 50,
  pro: 500,
  dev: 1500,
  team: 3000,
};

export function useCredits() {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCredits = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setCredits(null); setLoading(false); return; }

    const { data, error } = await supabase
      .from("user_credits")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!data && !error) {
      // Auto-create credits row if missing (e.g. existing users)
      const { data: newRow } = await supabase
        .from("user_credits")
        .insert({ user_id: session.user.id, total_credits: 50, used_credits: 0, plan: "free" })
        .select()
        .single();
      if (newRow) setCredits(newRow);
    } else if (data) {
      setCredits(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  const remaining = credits ? credits.total_credits - credits.used_credits : 0;
  const hasCredits = remaining > 0;

  const useCredit = useCallback(async (amount = 1, description = "Code analysis") => {
    if (!credits || remaining < amount) return false;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const { error } = await supabase
      .from("user_credits")
      .update({ used_credits: credits.used_credits + amount })
      .eq("user_id", session.user.id);

    if (error) return false;

    await supabase.from("credit_transactions").insert({
      user_id: session.user.id,
      amount: -amount,
      type: "usage",
      description,
    });

    setCredits((prev) => prev ? { ...prev, used_credits: prev.used_credits + amount } : prev);
    return true;
  }, [credits, remaining]);

  const planLimit = credits ? PLAN_LIMITS[credits.plan] || 50 : 50;

  return { credits, loading, remaining, hasCredits, useCredit, refetch: fetchCredits, planLimit };
}
