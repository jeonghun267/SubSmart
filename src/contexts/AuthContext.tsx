"use client";

import { createContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (!authUser) {
        router.replace("/login");
      } else {
        setUser({
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.display_name,
        });
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        router.replace("/login");
      } else {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.display_name,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
