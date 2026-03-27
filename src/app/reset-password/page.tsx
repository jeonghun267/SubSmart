"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Mail, ArrowLeft, Send } from "lucide-react";
import Subby from "@/components/Subby";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password/confirm",
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 bg-bg-primary">
      <div className="w-full max-w-sm animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="mb-5">
            <Subby size={72} mood="thinking" />
          </div>
          <h1 className="text-[28px] font-bold text-text-primary">
            비밀번호 찾기
          </h1>
          <p className="text-text-secondary text-[15px] mt-1.5">
            가입한 이메일로 재설정 링크를 보내드립니다
          </p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="px-4 py-3 bg-positive-soft rounded-[10px]">
              <p className="text-positive text-[13px]">
                비밀번호 재설정 링크가 이메일로 전송되었습니다. 메일함을
                확인해주세요.
              </p>
            </div>
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 py-[14px] bg-accent text-text-inverse font-semibold text-[15px] rounded-[12px] hover:bg-accent-hover transition-all pressable"
            >
              <ArrowLeft size={18} />
              로그인으로 돌아가기
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
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
                  재설정 링크 보내기
                  <Send size={18} />
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
