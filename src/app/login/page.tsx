"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import Subby from "@/components/Subby";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // 먼저 로그인 시도
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    if (!loginError) {
      router.replace("/dashboard");
      return;
    }

    // 로그인 실패 → 계정이 없는 경우 회원가입 모드로 전환
    if (loginError.message === "Invalid login credentials") {
      if (!isNewUser) {
        // 첫 시도: 이름 입력 필드 보여주기
        setIsNewUser(true);
        setError("");
        setLoading(false);
        return;
      }

      // 이름까지 입력한 상태: 회원가입 진행
      if (!name.trim()) {
        setError("이름을 입력해주세요.");
        setLoading(false);
        return;
      }

      const { error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name } },
      });

      if (signupError) {
        setError(signupError.message);
        setLoading(false);
        return;
      }

      router.replace("/welcome");
      return;
    }

    setError(loginError.message);
    setLoading(false);
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
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* 이름 (새 유저일 때만 표시) */}
          {isNewUser && (
            <div className="relative animate-fade-in-up">
              <User
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary"
                size={18}
              />
              <input
                type="text"
                placeholder="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="w-full pl-12 pr-4 py-[14px] bg-bg-card border border-border rounded-[12px] text-[15px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-border-focus transition-all"
              />
            </div>
          )}

          <div className="relative">
            <Mail
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary"
              size={18}
            />
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setIsNewUser(false); }}
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
              placeholder="비밀번호 (6자 이상)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-12 pr-4 py-[14px] bg-bg-card border border-border rounded-[12px] text-[15px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-border-focus transition-all"
            />
          </div>

          {isNewUser && !error && (
            <p className="text-[13px] text-accent px-1">
              처음이시네요! 이름을 입력하고 시작하세요.
            </p>
          )}

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
                {isNewUser ? "시작하기" : "시작하기"}
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

        <p className="text-center text-[12px] text-text-tertiary mt-8 leading-relaxed">
          시작하기를 누르면{" "}
          <Link href="/terms" className="underline">이용약관</Link> 및{" "}
          <Link href="/privacy" className="underline">개인정보처리방침</Link>에 동의합니다.
        </p>
      </div>
    </div>
  );
}
