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
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleSocialLogin = async (provider: "kakao" | "google") => {
    try {
      setSocialLoading(provider);
      setError("");
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + "/auth/callback",
        },
      });
      if (error) {
        setError(error.message);
      }
    } catch {
      setError("소셜 로그인 중 오류가 발생했습니다.");
    } finally {
      setSocialLoading(null);
    }
  };

  const handleKakaoLogin = () => handleSocialLogin("kakao");
  const handleGoogleLogin = () => handleSocialLogin("google");

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
            <Link
              href="/reset-password"
              className="text-accent text-[13px]"
            >
              비밀번호 찾기
            </Link>
          </div>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-7">
          <div className="flex-1 h-px bg-border" />
          <span className="text-text-tertiary text-[13px]">또는</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleKakaoLogin}
            disabled={socialLoading !== null}
            className="w-full flex items-center justify-center gap-2 py-[14px] font-semibold text-[15px] rounded-[12px] transition-all pressable disabled:opacity-50"
            style={{ backgroundColor: "#FEE500", color: "#191919" }}
          >
            {socialLoading === "kakao" ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 1C4.58 1 1 3.79 1 7.21c0 2.17 1.45 4.08 3.63 5.18l-.93 3.41c-.08.29.25.52.5.35l4.06-2.68c.24.02.49.03.74.03 4.42 0 8-2.79 8-6.21S13.42 1 9 1z" fill="#191919"/>
                </svg>
                카카오로 시작하기
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={socialLoading !== null}
            className="w-full flex items-center justify-center gap-2 py-[14px] bg-white border border-border font-semibold text-[15px] rounded-[12px] text-text-primary hover:bg-gray-50 transition-all pressable disabled:opacity-50"
          >
            {socialLoading === "google" ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Google로 시작하기
              </>
            )}
          </button>
        </div>

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
