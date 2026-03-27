"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-lg mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/settings" className="p-1 pressable">
            <ArrowLeft size={20} className="text-text-secondary" />
          </Link>
          <h1 className="text-[20px] font-bold text-text-primary">이용약관</h1>
        </div>

        <div className="space-y-6 text-[14px] text-text-secondary leading-relaxed">
          <p className="text-[12px] text-text-tertiary">시행일: 2026년 3월 26일</p>

          <section>
            <h2 className="font-semibold text-text-primary mb-2 text-[15px]">제1조 (목적)</h2>
            <p>이 약관은 SubSmart(이하 &quot;서비스&quot;)의 이용에 관한 조건 및 절차를 규정함을 목적으로 합니다.</p>
          </section>

          <section>
            <h2 className="font-semibold text-text-primary mb-2 text-[15px]">제2조 (서비스의 내용)</h2>
            <p>서비스는 다음 기능을 제공합니다:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-[13px]">
              <li>구독 서비스 관리 (등록, 수정, 해지 추적)</li>
              <li>수입/지출 기록 및 가계부 기능</li>
              <li>카테고리별 예산 설정 및 추적</li>
              <li>AI 기반 소비 분석 및 절약 인사이트</li>
              <li>저축 목표 관리</li>
              <li>절약 시뮬레이션</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-text-primary mb-2 text-[15px]">제3조 (회원가입 및 탈퇴)</h2>
            <ul className="list-disc list-inside space-y-1 text-[13px]">
              <li>만 14세 이상의 개인이 가입할 수 있습니다.</li>
              <li>이메일 또는 소셜 로그인(카카오, 구글)으로 가입합니다.</li>
              <li>회원은 언제든지 설정 메뉴에서 탈퇴할 수 있으며, 탈퇴 시 모든 데이터가 즉시 삭제됩니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-text-primary mb-2 text-[15px]">제4조 (서비스 이용)</h2>
            <ul className="list-disc list-inside space-y-1 text-[13px]">
              <li>서비스는 무료로 제공되며, 일부 프리미엄 기능은 유료입니다.</li>
              <li>AI 분석 기능은 무료 사용자 기준 하루 3회로 제한됩니다.</li>
              <li>서비스에 입력하는 금융 정보(구독, 지출 등)는 사용자가 직접 입력하는 것이며, 실제 금융기관과 연동되지 않습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-text-primary mb-2 text-[15px]">제5조 (면책사항)</h2>
            <ul className="list-disc list-inside space-y-1 text-[13px]">
              <li>서비스는 금융 자문을 제공하지 않습니다. AI 분석 결과는 참고용이며, 실제 금융 의사결정의 책임은 사용자에게 있습니다.</li>
              <li>천재지변, 서버 장애 등 불가항력으로 인한 서비스 중단에 대해 책임지지 않습니다.</li>
              <li>사용자가 입력한 데이터의 정확성에 대해 서비스는 보증하지 않습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-text-primary mb-2 text-[15px]">제6조 (금지행위)</h2>
            <ul className="list-disc list-inside space-y-1 text-[13px]">
              <li>서비스를 부정한 목적으로 이용하는 행위</li>
              <li>타인의 정보를 도용하는 행위</li>
              <li>서비스의 정상적인 운영을 방해하는 행위</li>
              <li>서비스를 역공학, 복제, 변조하는 행위</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-text-primary mb-2 text-[15px]">제7조 (약관의 변경)</h2>
            <p>약관이 변경될 경우 시행일 7일 전부터 앱 내 공지를 통해 안내합니다. 변경된 약관에 동의하지 않는 회원은 서비스 이용을 중단하고 탈퇴할 수 있습니다.</p>
          </section>

          <section>
            <h2 className="font-semibold text-text-primary mb-2 text-[15px]">제8조 (분쟁 해결)</h2>
            <p>서비스 이용과 관련하여 분쟁이 발생한 경우, 대한민국 법률을 적용하며 관할 법원에서 해결합니다.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
