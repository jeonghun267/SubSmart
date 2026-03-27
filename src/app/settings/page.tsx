"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/ThemeProvider";
import { useNotifications } from "@/components/NotificationManager";
import BottomSheet from "@/components/BottomSheet";
import ConfirmDialog from "@/components/ConfirmDialog";
import { showToast } from "@/components/Toast";
import {
  User,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Bell,
  BellOff,
  Shield,
  HelpCircle,
  ChevronRight,
  Download,
  Sparkles,
  MessageSquare,
  ExternalLink,
  Check,
  Crown,
} from "lucide-react";
import { canUseAI, recordAIUsage, getRemainingAIUses, isPremium } from "@/lib/premium";
import { authFetch } from "@/lib/api";
import Subby from "@/components/Subby";

export default function SettingsPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { enabled: notiEnabled, enableNotifications, disableNotifications } = useNotifications();

  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [showTheme, setShowTheme] = useState(false);
  const [showNoti, setShowNoti] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteFinal, setShowDeleteFinal] = useState(false);
  const [userIsPremium, setUserIsPremium] = useState(false);
  const [billingNoti, setBillingNoti] = useState(true);
  const [budgetNoti, setBudgetNoti] = useState(true);

  useEffect(() => {
    setUserIsPremium(isPremium());
    setBillingNoti(localStorage.getItem("subsmart_billing_noti") !== "false");
    setBudgetNoti(localStorage.getItem("subsmart_budget_noti") !== "false");
  }, []);

  useEffect(() => {
    if (authUser) {
      setUser({
        email: authUser.email,
        name: authUser.name,
      });
    }
  }, [authUser]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function executeDeleteAccount() {
    try {
      if (!authUser) return;

      await Promise.all([
        supabase.from("subscriptions").delete().eq("user_id", authUser.id),
        supabase.from("transactions").delete().eq("user_id", authUser.id),
        supabase.from("budgets").delete().eq("user_id", authUser.id),
        supabase.from("savings_goals").delete().eq("user_id", authUser.id),
      ]);

      await supabase.auth.signOut();
      localStorage.clear();
      router.replace("/login");
    } catch {
      showToast("탈퇴 처리 중 오류가 발생했습니다.", "error");
    }
  }

  async function handleExportData() {
    if (!authUser) return;

    const [subsRes, txRes, budgetRes] = await Promise.all([
      supabase.from("subscriptions").select("*").eq("user_id", authUser.id),
      supabase.from("transactions").select("*").eq("user_id", authUser.id),
      supabase.from("budgets").select("*").eq("user_id", authUser.id),
    ]);

    const data = {
      exported_at: new Date().toISOString(),
      user_email: authUser.email,
      subscriptions: subsRes.data,
      transactions: txRes.data,
      budgets: budgetRes.data,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subsmart-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExportDone(true);
    setTimeout(() => setExportDone(false), 2000);
  }

  async function handleAIInsight() {
    if (!canUseAI()) {
      setAiInsight(`오늘의 무료 AI 분석 횟수를 모두 사용했어요. 프리미엄으로 업그레이드하면 무제한으로 이용할 수 있어요!`);
      return;
    }

    setAiLoading(true);
    setAiInsight("");

    try {
      if (!authUser) return;

      const [subsRes, txRes] = await Promise.all([
        supabase.from("subscriptions").select("*").eq("user_id", authUser.id).eq("is_active", true),
        supabase.from("transactions").select("*").eq("user_id", authUser.id).order("date", { ascending: false }).limit(50),
      ]);

      const res = await authFetch("/api/ai-insight", {
        method: "POST",
        body: JSON.stringify({
          subscriptions: subsRes.data,
          transactions: txRes.data,
        }),
      });

      const result = await res.json();
      setAiInsight(result.insight || "분석 결과를 가져올 수 없습니다.");
      recordAIUsage();
    } catch {
      setAiInsight("AI 분석 중 오류가 발생했습니다. 나중에 다시 시도해주세요.");
    } finally {
      setAiLoading(false);
    }
  }

  const themeOptions = [
    { value: "system" as const, label: "시스템 설정", icon: Monitor, desc: "기기 설정에 따라 자동 전환" },
    { value: "light" as const, label: "라이트 모드", icon: Sun, desc: "항상 밝은 테마 사용" },
    { value: "dark" as const, label: "다크 모드", icon: Moon, desc: "항상 어두운 테마 사용" },
  ];

  return (
    <div className="space-y-7 animate-fade-in-up">
      <h1 className="text-[22px] font-bold text-text-primary">설정</h1>

      {/* Profile */}
      <div className="bg-bg-card rounded-[16px] p-5 border border-border flex items-center gap-4">
        <div className="w-[52px] h-[52px] bg-accent-soft rounded-full flex items-center justify-center shrink-0">
          <User size={24} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-[16px] text-text-primary">
              {user?.name || "사용자"}
            </p>
            {userIsPremium && (
              <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-[4px] flex items-center gap-0.5">
                <Crown size={10} /> PRO
              </span>
            )}
          </div>
          <p className="text-[13px] text-text-secondary truncate mt-0.5">
            {user?.email}
          </p>
        </div>
      </div>

      {/* Menu */}
      <div className="bg-bg-card rounded-[16px] border border-border overflow-hidden">
        {/* Dark Mode */}
        <button
          onClick={() => setShowTheme(true)}
          className="w-full flex items-center gap-3.5 px-5 py-4 text-left hover:bg-bg-primary/50 transition-colors pressable border-b border-border"
        >
          <div className="w-8 h-8 rounded-[8px] bg-bg-primary flex items-center justify-center shrink-0">
            {resolvedTheme === "dark" ? (
              <Moon size={16} className="text-accent" />
            ) : (
              <Sun size={16} className="text-warning" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-text-primary">테마</p>
            <p className="text-[12px] text-text-tertiary mt-0.5">
              {theme === "system" ? "시스템 설정" : theme === "dark" ? "다크 모드" : "라이트 모드"}
            </p>
          </div>
          <ChevronRight size={16} className="text-text-tertiary shrink-0" />
        </button>

        {/* Notifications */}
        <button
          onClick={() => setShowNoti(true)}
          className="w-full flex items-center gap-3.5 px-5 py-4 text-left hover:bg-bg-primary/50 transition-colors pressable border-b border-border"
        >
          <div className="w-8 h-8 rounded-[8px] bg-bg-primary flex items-center justify-center shrink-0">
            {notiEnabled ? (
              <Bell size={16} className="text-positive" />
            ) : (
              <BellOff size={16} className="text-text-secondary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-text-primary">알림 설정</p>
            <p className="text-[12px] text-text-tertiary mt-0.5">
              {notiEnabled ? "알림 켜짐" : "알림 꺼짐"}
            </p>
          </div>
          <ChevronRight size={16} className="text-text-tertiary shrink-0" />
        </button>

        {/* AI Insight */}
        <button
          onClick={() => setShowAI(true)}
          className="w-full flex items-center gap-3.5 px-5 py-4 text-left hover:bg-bg-primary/50 transition-colors pressable border-b border-border"
        >
          <div className="w-8 h-8 rounded-[8px] bg-accent-soft flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-text-primary">AI 지출 분석</p>
            <p className="text-[12px] text-text-tertiary mt-0.5">Gemini AI로 내 소비 패턴 분석</p>
          </div>
          <ChevronRight size={16} className="text-text-tertiary shrink-0" />
        </button>

        {/* Premium */}
        {!userIsPremium && (
          <button
            onClick={() => setShowPremium(true)}
            className="w-full flex items-center gap-3.5 px-5 py-4 text-left hover:bg-bg-primary/50 transition-colors pressable border-b border-border"
          >
            <div className="w-8 h-8 rounded-[8px] bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <Crown size={16} className="text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-medium text-text-primary">프리미엄 업그레이드</p>
              <p className="text-[12px] text-text-tertiary mt-0.5">무제한 AI 분석 & 더 많은 기능</p>
            </div>
            <ChevronRight size={16} className="text-text-tertiary shrink-0" />
          </button>
        )}

        {/* Export */}
        <button
          onClick={handleExportData}
          className="w-full flex items-center gap-3.5 px-5 py-4 text-left hover:bg-bg-primary/50 transition-colors pressable border-b border-border"
        >
          <div className="w-8 h-8 rounded-[8px] bg-bg-primary flex items-center justify-center shrink-0">
            {exportDone ? (
              <Check size={16} className="text-positive" />
            ) : (
              <Download size={16} className="text-text-secondary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-text-primary">
              {exportDone ? "다운로드 완료!" : "데이터 내보내기"}
            </p>
            <p className="text-[12px] text-text-tertiary mt-0.5">JSON 형식으로 내 데이터 다운로드</p>
          </div>
          <ChevronRight size={16} className="text-text-tertiary shrink-0" />
        </button>

        {/* Privacy */}
        <button
          onClick={() => setShowPrivacy(true)}
          className="w-full flex items-center gap-3.5 px-5 py-4 text-left hover:bg-bg-primary/50 transition-colors pressable border-b border-border"
        >
          <div className="w-8 h-8 rounded-[8px] bg-bg-primary flex items-center justify-center shrink-0">
            <Shield size={16} className="text-text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-text-primary">개인정보 처리방침</p>
          </div>
          <ChevronRight size={16} className="text-text-tertiary shrink-0" />
        </button>

        {/* Help */}
        <button
          onClick={() => setShowHelp(true)}
          className="w-full flex items-center gap-3.5 px-5 py-4 text-left hover:bg-bg-primary/50 transition-colors pressable"
        >
          <div className="w-8 h-8 rounded-[8px] bg-bg-primary flex items-center justify-center shrink-0">
            <HelpCircle size={16} className="text-text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-text-primary">도움말 & 피드백</p>
          </div>
          <ChevronRight size={16} className="text-text-tertiary shrink-0" />
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-[14px] bg-bg-card border border-negative/15 text-negative font-semibold text-[15px] rounded-[12px] pressable hover:bg-negative-soft transition-colors"
      >
        <LogOut size={18} />
        로그아웃
      </button>

      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="w-full text-center py-3 text-text-tertiary text-[12px] pressable"
      >
        회원탈퇴
      </button>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="정말 탈퇴하시겠어요?"
        message="모든 구독, 거래 내역, 예산 데이터가 삭제되며 복구할 수 없습니다."
        confirmText="탈퇴하기"
        cancelText="취소"
        variant="danger"
        onConfirm={() => { setShowDeleteConfirm(false); setShowDeleteFinal(true); }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      <ConfirmDialog
        open={showDeleteFinal}
        title="마지막 확인"
        message="모든 데이터가 영구 삭제됩니다. 정말 계속할까요?"
        confirmText="영구 삭제"
        cancelText="돌아가기"
        variant="danger"
        onConfirm={() => { setShowDeleteFinal(false); executeDeleteAccount(); }}
        onCancel={() => setShowDeleteFinal(false)}
      />

      <p className="text-center text-[11px] text-text-tertiary pb-4">SubSmart v1.0.0</p>

      {/* Theme Bottom Sheet */}
      <BottomSheet open={showTheme} onClose={() => setShowTheme(false)} title="테마 설정">
        <div className="space-y-2">
          {themeOptions.map(({ value, label, icon: Icon, desc }) => (
            <button
              key={value}
              onClick={() => { setTheme(value); setShowTheme(false); }}
              className={`w-full flex items-center gap-3.5 p-4 rounded-[12px] border transition-all pressable ${
                theme === value
                  ? "border-accent bg-accent-soft"
                  : "border-border bg-bg-primary hover:border-accent/30"
              }`}
            >
              <Icon size={20} className={theme === value ? "text-accent" : "text-text-secondary"} />
              <div className="flex-1 text-left">
                <p className={`text-[14px] font-medium ${theme === value ? "text-accent" : "text-text-primary"}`}>
                  {label}
                </p>
                <p className="text-[12px] text-text-tertiary mt-0.5">{desc}</p>
              </div>
              {theme === value && <Check size={18} className="text-accent" />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Notification Bottom Sheet */}
      <BottomSheet open={showNoti} onClose={() => setShowNoti(false)} title="알림 설정">
        <div className="space-y-5">
          <div className="flex items-center justify-between p-4 bg-bg-primary rounded-[12px] border border-border">
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-text-secondary" />
              <div>
                <p className="text-[14px] font-medium text-text-primary">결제일 알림</p>
                <p className="text-[12px] text-text-tertiary mt-0.5">구독 결제 1일 전 알림</p>
              </div>
            </div>
            <button
              onClick={async () => {
                if (!notiEnabled) await enableNotifications();
                const next = !billingNoti;
                setBillingNoti(next);
                localStorage.setItem("subsmart_billing_noti", String(next));
              }}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                notiEnabled && billingNoti ? "bg-accent" : "bg-border"
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                  notiEnabled && billingNoti ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-bg-primary rounded-[12px] border border-border">
            <div className="flex items-center gap-3">
              <MessageSquare size={20} className="text-text-secondary" />
              <div>
                <p className="text-[14px] font-medium text-text-primary">예산 초과 알림</p>
                <p className="text-[12px] text-text-tertiary mt-0.5">카테고리 예산 80% 초과 시</p>
              </div>
            </div>
            <button
              onClick={async () => {
                if (!notiEnabled) await enableNotifications();
                const next = !budgetNoti;
                setBudgetNoti(next);
                localStorage.setItem("subsmart_budget_noti", String(next));
              }}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                notiEnabled && budgetNoti ? "bg-accent" : "bg-border"
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                  notiEnabled && budgetNoti ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {!notiEnabled && (
            <p className="text-[12px] text-text-tertiary text-center px-4">
              알림을 켜면 브라우저 알림 권한을 요청합니다
            </p>
          )}
        </div>
      </BottomSheet>

      {/* AI Insight Bottom Sheet */}
      <BottomSheet open={showAI} onClose={() => setShowAI(false)} title="AI 지출 분석">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-[12px] text-text-tertiary">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-accent" />
              <span>Gemini AI 기반 분석</span>
            </div>
            {!userIsPremium && (
              <span className="text-accent font-medium">
                오늘 {getRemainingAIUses()}회 남음
              </span>
            )}
          </div>

          {aiLoading ? (
            <div className="flex flex-col items-center py-10 gap-3">
              <Subby size={56} mood="thinking" className="animate-bounce" />
              <p className="text-[13px] text-text-secondary">써비가 소비 패턴을 분석하고 있어요...</p>
            </div>
          ) : (
            <div className="bg-bg-primary rounded-[12px] p-4 border border-border">
              <div className="text-[14px] text-text-primary leading-relaxed whitespace-pre-wrap">
                {aiInsight}
              </div>
            </div>
          )}

          <button
            onClick={handleAIInsight}
            disabled={aiLoading}
            className="w-full py-[14px] bg-accent text-text-inverse font-semibold text-[15px] rounded-[12px] pressable hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {aiLoading ? "분석 중..." : "다시 분석하기"}
          </button>
        </div>
      </BottomSheet>

      {/* Privacy Bottom Sheet */}
      <BottomSheet open={showPrivacy} onClose={() => setShowPrivacy(false)} title="개인정보 처리방침">
        <div className="space-y-4 text-[14px] text-text-secondary leading-relaxed">
          <section>
            <h3 className="font-semibold text-text-primary mb-2">1. 수집하는 개인정보</h3>
            <p>SubSmart는 서비스 제공을 위해 다음 정보를 수집합니다:</p>
            <ul className="list-disc list-inside mt-1.5 space-y-1 text-[13px]">
              <li>이메일 주소 (회원가입 및 로그인)</li>
              <li>이름 (사용자 식별)</li>
              <li>구독 정보 (서비스명, 금액, 결제일)</li>
              <li>거래 내역 (수입/지출 기록)</li>
            </ul>
          </section>
          <section>
            <h3 className="font-semibold text-text-primary mb-2">2. 정보의 이용 목적</h3>
            <p>수집된 정보는 구독 관리, 지출 분석, AI 인사이트 제공 등 서비스 운영 목적으로만 사용됩니다.</p>
          </section>
          <section>
            <h3 className="font-semibold text-text-primary mb-2">3. 정보의 보관 및 파기</h3>
            <p>회원 탈퇴 시 모든 개인정보는 즉시 파기됩니다. 데이터는 Supabase 클라우드에 암호화되어 안전하게 보관됩니다.</p>
          </section>
          <section>
            <h3 className="font-semibold text-text-primary mb-2">4. 제3자 제공</h3>
            <p>AI 분석 기능 이용 시, 익명화된 지출 데이터가 Google Gemini API로 전송될 수 있습니다. 개인 식별 정보는 포함되지 않습니다.</p>
          </section>
          <section>
            <h3 className="font-semibold text-text-primary mb-2">5. 문의</h3>
            <p>개인정보 관련 문의는 앱 내 도움말에서 연락해주세요.</p>
          </section>
        </div>
      </BottomSheet>

      {/* Help Bottom Sheet */}
      <BottomSheet open={showHelp} onClose={() => setShowHelp(false)} title="도움말 & 피드백">
        <div className="space-y-3">
          <div className="bg-bg-primary rounded-[12px] p-4 border border-border">
            <h3 className="font-semibold text-[14px] text-text-primary mb-2">자주 묻는 질문</h3>
            <div className="space-y-3 text-[13px]">
              <div>
                <p className="font-medium text-text-primary">Q. 구독은 어떻게 추가하나요?</p>
                <p className="text-text-secondary mt-0.5">하단 메뉴에서 구독 탭 &gt; 우측 상단 추가 버튼을 눌러주세요. 인기 구독 서비스를 빠르게 선택할 수 있습니다.</p>
              </div>
              <div>
                <p className="font-medium text-text-primary">Q. 예산은 어떻게 설정하나요?</p>
                <p className="text-text-secondary mt-0.5">가계부 탭 &gt; 예산 설정 버튼을 눌러 카테고리별 월 예산을 설정하세요.</p>
              </div>
              <div>
                <p className="font-medium text-text-primary">Q. 데이터 백업은 어떻게 하나요?</p>
                <p className="text-text-secondary mt-0.5">설정 &gt; 데이터 내보내기를 통해 JSON 파일로 다운로드할 수 있습니다.</p>
              </div>
              <div>
                <p className="font-medium text-text-primary">Q. AI 분석은 어떤 원리인가요?</p>
                <p className="text-text-secondary mt-0.5">Google Gemini AI가 구독 목록과 지출 패턴을 분석하여 절약 팁과 인사이트를 제공합니다.</p>
              </div>
            </div>
          </div>

          <div className="bg-bg-primary rounded-[12px] p-4 border border-border">
            <h3 className="font-semibold text-[14px] text-text-primary mb-2">피드백 보내기</h3>
            <p className="text-[13px] text-text-secondary mb-3">
              버그 제보, 기능 제안, 불편 사항을 알려주세요.
            </p>
            <a
              href="mailto:support@subsmart.app"
              className="flex items-center justify-center gap-2 py-3 bg-accent text-text-inverse font-semibold text-[14px] rounded-[10px] pressable"
            >
              <ExternalLink size={16} />
              이메일로 피드백 보내기
            </a>
          </div>
        </div>
      </BottomSheet>

      {/* Premium Bottom Sheet */}
      <BottomSheet open={showPremium} onClose={() => setShowPremium(false)} title="프리미엄 플랜" size="large">
        <div className="space-y-5">
          {/* Hero */}
          <div className="text-center py-4">
            <Subby size={56} mood="wink" className="mx-auto mb-2" />
            <h3 className="text-[18px] font-bold text-text-primary">SubSmart Pro</h3>
            <p className="text-[13px] text-text-secondary mt-1">스타벅스 아메리카노 반 잔 가격으로</p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {[
              { icon: "📊", title: "AI 소비 리포트", desc: "나만의 소비 성격 분석 + 맞춤 절약 팁" },
              { icon: "🧮", title: "구독 절약 시뮬레이터", desc: "해지하면 치킨 몇 마리? 실시간 계산" },
              { icon: "🎯", title: "목표 저축 + AI 챌린지", desc: "목표 설정하고 매주 AI 절약 챌린지" },
              { icon: "✨", title: "무제한 AI 분석", desc: "하루 제한 없이 언제든 소비 분석" },
            ].map((f) => (
              <div key={f.title} className="flex items-center gap-3 p-3 bg-bg-primary rounded-[10px] border border-border">
                <span className="text-[20px]">{f.icon}</span>
                <div>
                  <p className="text-[13px] font-semibold text-text-primary">{f.title}</p>
                  <p className="text-[11px] text-text-tertiary">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Price */}
          <div className="text-center py-2">
            <p className="text-[28px] font-bold text-text-primary">
              2,900<span className="text-[14px] font-normal text-text-secondary">원/월</span>
            </p>
            <p className="text-[12px] text-text-tertiary mt-1">연간 결제 시 24,900원 (월 2,075원)</p>
          </div>

          <button
            className="w-full py-[14px] bg-amber-500 text-white font-semibold text-[15px] rounded-[12px] pressable hover:bg-amber-600 transition-colors"
            onClick={() => { setShowPremium(false); }}
          >
            곧 출시 예정이에요
          </button>
          <p className="text-center text-[11px] text-text-tertiary">결제는 토스페이먼츠를 통해 안전하게 처리됩니다</p>
        </div>
      </BottomSheet>
    </div>
  );
}
