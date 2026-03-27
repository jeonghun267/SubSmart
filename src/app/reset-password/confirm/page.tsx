"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Lock, ArrowLeft, Check } from "lucide-react";
import Subby from "@/components/Subby";

export default function ResetPasswordConfirmPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.replace("/login"), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 bg-bg-primary">
      <div className="w-full max-w-sm animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="mb-5">
            <Subby size={72} mood="happy" />
          </div>
          <h1 className="text-[28px] font-bold text-text-primary">
            새 비밀번호 설정
          </h1>
          <p className="text-text-secondary text-[15px] mt-1.5">
            새로운 비밀번호를 입력해주세요
          </p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="px-4 py-3 bg-positive-soft rounded-[10px]">
              <p className="text-positive text-[13px]">
                비밀번호가 성공적으로 변경되었습니다. 잠시 후 로그인 페이지로
                이동합니다.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="relative">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary"
                size={18}
              />
              <input
                type="password"
                placeholder="새 비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
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
                placeholder="비밀번호 확인"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                  비밀번호 변경
                  <Check size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {!success && (
          <p className="text-center text-[14px] text-text-secondary mt-8">
            <Link href="/login" className="text-accent font-semibold">
              <span className="inline-flex items-center gap-1">
                <ArrowLeft size={14} />
                로그인으로 돌아가기
              </span>
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
