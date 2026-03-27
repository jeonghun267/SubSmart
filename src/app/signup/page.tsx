"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import Subby from "@/components/Subby";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.replace("/welcome");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 bg-bg-primary">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="text-center mb-12">
          <div className="mb-5">
            <Subby size={72} mood="happy" />
          </div>
          <h1 className="text-[28px] font-bold text-text-primary">SubSmart</h1>
          <p className="text-text-secondary text-[15px] mt-1.5">
            내 구독과 지출을 한눈에
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-3.5">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
            <input
              type="text"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full pl-12 pr-4 py-[14px] bg-bg-card border border-border rounded-[12px] text-[15px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-border-focus transition-all"
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
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
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
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

          {error && (
            <div className="px-4 py-3 bg-negative-soft rounded-[10px]">
              <p className="text-negative text-[13px]">{error}</p>
            </div>
          )}

          {/* 약관 동의 체크박스 */}
          <div className="space-y-2.5 mt-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-accent"
              />
              <span className="text-[13px] text-text-secondary">
                <Link href="/terms" className="text-accent underline">이용약관</Link>에 동의합니다 <span className="text-negative">*</span>
              </span>
            </label>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreePrivacy}
                onChange={(e) => setAgreePrivacy(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-accent"
              />
              <span className="text-[13px] text-text-secondary">
                <Link href="/privacy" className="text-accent underline">개인정보처리방침</Link>에 동의합니다 <span className="text-negative">*</span>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !agreeTerms || !agreePrivacy}
            className="w-full flex items-center justify-center gap-2 py-[14px] bg-accent text-text-inverse font-semibold text-[15px] rounded-[12px] hover:bg-accent-hover disabled:opacity-50 transition-all pressable"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                시작하기
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[14px] text-text-secondary mt-8">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-accent font-semibold">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
