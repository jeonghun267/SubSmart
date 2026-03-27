/**
 * 앱인토스 (Apps in Toss) 유틸리티
 *
 * 토스 인앱 환경 감지 및 연동을 위한 헬퍼 함수들.
 * WebView 방식으로 입점 시 사용.
 *
 * @see https://developers-apps-in-toss.toss.im/
 */

/**
 * 현재 환경이 토스 인앱 브라우저인지 감지
 */
export function isTossInApp(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes("toss") || ua.includes("appintoss");
}

/**
 * 토스 인앱에서 뒤로가기 처리
 * 토스 인앱 브라우저는 자체 네비게이션을 가지므로, 히스토리 관리에 주의 필요
 */
export function handleTossBack(): void {
  if (isTossInApp() && window.history.length <= 1) {
    // 토스 앱으로 돌아가기 (인앱 브라우저 닫기)
    window.close();
  } else {
    window.history.back();
  }
}

/**
 * 토스 인앱 환경에 맞는 상태바 높이 반환
 */
export function getTossStatusBarHeight(): number {
  if (!isTossInApp()) return 0;
  // 토스 인앱 브라우저는 상단 네비게이션을 자체 제공하므로 추가 패딩 불필요
  return 0;
}

/**
 * 토스 공유하기 기능 (인앱 지원 시)
 */
export async function shareToss(data: { title: string; text: string; url: string }): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
