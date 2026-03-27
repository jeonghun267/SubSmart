"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Subby from "@/components/Subby";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
      setChecking(false);
    });
  }, [router]);

  if (!checking) return null;

  // 로딩 스플래시
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary">
      <Subby size={72} mood="happy" />
      <h1 className="text-[24px] font-bold text-text-primary mt-4">SubSmart</h1>
      <p className="text-[14px] text-text-tertiary mt-1">구독 관리 & 스마트 가계부</p>
      <div className="mt-6 w-8 h-8 border-[3px] border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
