import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

// Lazy-initialized Supabase client (avoids build-time errors with placeholder env vars)
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabase) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      _supabase = createClient(url, key);
    }
    const value = (_supabase as unknown as Record<string, unknown>)[
      prop as string
    ];
    if (typeof value === "function") {
      return value.bind(_supabase);
    }
    return value;
  },
});
