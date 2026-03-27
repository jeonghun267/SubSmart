"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, ArrowRight } from "lucide-react";
import Subby from "@/components/Subby";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "이메일 또는 비밀번호가 올바르지 않습니다."
          : error.message
      );
      setLoading(false);
      return;
    }
    router.replace("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 bg-bg-primary">
      <div className="w-full max-w-sm animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="mb-5">
            <Subby size={72} mood="wink" />
          </div>
          <h1 className="text-[28px] font-bold text-text-primary">SubSmart</h1>
          <p className="text-text-secondary text-[15px] mt-1.5">
            구독 관리 & 스마트 가계부
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-3.5">
          <div className="relative">
            <Mail
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary"
              size={18}
            />
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-12 pr-4 py-[14px] bg-bg-card border border-border rounded-[12px] text-[15px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-border-focus transition-all"
            />
          </div>

          <div className="relative">
            <Lock
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary"
              size={18}
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-12 pr-4 py-[14px] bg-bg-card border border-border rounded-[12px] text-[15px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-border-focus transition-all"
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-negative-soft rounded-[10px]">
              <p className="text-negative text-[13px]">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-[14px] bg-accent text-text-inverse font-semibold text-[15px] rounded-[12px] hover:bg-accent-hover disabled:opacity-50 transition-all pressable"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                로그인
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <div className="text-right mt-2">
            <Link href="/reset-password" className="text-accent text-[13px]">
              비밀번호 찾기
            </Link>
          </div>
        </form>

        {/* TODO: 소셜 로그인 - 카카오/구글 OAuth 연동 후 활성화 */}

        <p className="text-center text-[14px] text-text-secondary mt-8">
          계정이 없으신가요?{" "}
          <Link href="/signup" className="text-accent font-semibold">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
