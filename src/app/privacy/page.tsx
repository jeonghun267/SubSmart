"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-lg mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/settings" className="p-1 pressable">
            <ArrowLeft size={20} className="text-text-secondary" />
          </Link>
          <h1 className="text-[20px] font-bold text-text-primary">개인정보처리방침</h1>
        </div>

        <div className="space-y-6 text-[14px] text-text-secondary leading-relaxed">
          <p className="text-[12px] text-text-tertiary">시행일: 2026년 3월 26일</p>

          <section>
            <h2 className="font-semibold text-text-primary mb-2 text-[15px]">1. 수집하는 개인정보</h2>
            <p>SubSmart(이하 &quot;서비스&quot;)는 서비스 제공을 위해 다음 정보를 수집합니다:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-[13px]">
              <li><strong>필수 수집 항목:</strong> 이메일 주소, 이름(닉네임)</li>
              <li><strong>소셜 로그인 시:</strong> 카카오/구글 계정 정보 (이메일, 프로필 이름)</li>
              <li><strong>서비스 이용 시 생성:</strong> 구독 정보, 거래 내역, 예산 설정, 저축 목표</li>
              <li><strong>자동 수집:</strong> 서비스 이용 기록, 접속 로그</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-text-primary mb-2 text-[15px]">2. 개인정보의 이용 목적</h2>
            <ul className="list-disc list-inside space-y-1 text-[13px]">
              <li>회원 가입 및 관리</li>
              <li>구독 관리, 지출 분석, 예산 추적 서비스 제공</li>
              <li>AI 기반 소비 패턴 분석 및 절약 인사이트 제공</li>
              <li>서비스 개선 및 새로운 기능 개발</li>
              <li>고객 문의 대응</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-text-primary mb-2 text-[15px]">3. 개인정보의 제3자 제공</h2>
            <p>서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에 해당합니다:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-[13px]">
              <li><strong>AI 분석 기능:</strong> Google Gemini API로 익명화된 지출 데이터(금액, 카테고리)가 전송됩니다. 이름, 이메일 등 개인 식별 정보는 포함되지 않습니다.</li>
              <li><strong>법률상 의무:</strong> 법령에 의한 요청이 있는 경우</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-text-primary mb-2 text-[15px]">4. 개인정보의 보관 및 파기</h2>
            <ul className="list-disc list-inside space-y-1 text-[13px]">
              <li><strong>보관 기간:</strong> 회원 탈퇴 시까지</li>
              <li><strong>파기 방법:</strong> 회원 탈퇴 시 모든 개인정보를 즉시 파기합니다</li>
              <li><strong>보관 장소:</strong> Supabase 클라우드 (AWS 기반, 암호화 저장)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-text-primary mb-2 text-[15px]">5. 개인정보의 국외 이전</h2>
            <p>서비스 데이터는 Supabase(미국 소재)에 저장되며, AI 분석 시 Google(미국 소재) 서버로 익명 데이터가 전송됩니다.</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-[13px]">
              <li><strong>이전 받는 자:</strong> Supabase Inc., Google LLC</li>
              <li><strong>이전 목적:</strong> 데이터 저장 및 AI 분석</li>
              <li><strong>보호 조치:</strong> 전송 시 TLS 암호화, 저장 시 AES-256 암호화</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-text-primary mb-2 text-[15px]">6. 이용자의 권리</h2>
            <p>이용자는 언제든지 다음 권리를 행사할 수 있습니다:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-[13px]">
              <li>개인정보 열람, 정정, 삭제 요구</li>
              <li>개인정보 처리 정지 요구</li>
              <li>회원 탈퇴 (설정 &gt; 회원탈퇴)</li>
              <li>데이터 내보내기 (설정 &gt; 데이터 내보내기)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-text-primary mb-2 text-[15px]">7. 만 14세 미만 아동</h2>
            <p>서비스는 만 14세 미만 아동의 가입을 제한합니다.</p>
          </section>

          <section>
            <h2 className="font-semibold text-text-primary mb-2 text-[15px]">8. 개인정보 보호책임자</h2>
            <ul className="list-disc list-inside space-y-1 text-[13px]">
              <li>이메일: support@subsmart.app</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-text-primary mb-2 text-[15px]">9. 권익침해 구제방법</h2>
            <p className="text-[13px]">개인정보 침해에 대한 신고나 상담이 필요하신 경우 아래 기관에 문의하실 수 있습니다:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-[13px]">
              <li>개인정보침해신고센터 (privacy.kisa.or.kr / 118)</li>
              <li>개인정보분쟁조정위원회 (kopico.go.kr / 1833-6972)</li>
              <li>대검찰청 사이버수사과 (spo.go.kr / 1301)</li>
              <li>경찰청 사이버안전국 (cyberbureau.police.go.kr / 182)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-text-primary mb-2 text-[15px]">10. 방침 변경</h2>
            <p>이 개인정보처리방침은 2026년 3월 26일부터 적용됩니다. 변경 시 앱 내 공지를 통해 안내합니다.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
