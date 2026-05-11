# SubSmart — 구독도 가계부도, 똑똑하게.

매달 빠져나가는 구독료, 어디에 얼마나 쓰고 있는지 모르겠다면 SubSmart가 도와드립니다.
넷플릭스·유튜브 프리미엄·쿠팡 로켓와우 같은 구독을 한 곳에 모아 다음 결제일과 월 총액을 한눈에 확인하고, 가계부·예산·저축 목표·AI 소비 분석까지 하나의 앱으로 관리하세요.

> 자세한 제품 소개는 [`RELEASE_NOTES_v1.0.md`](./RELEASE_NOTES_v1.0.md) 참고.

## 주요 기능

- **구독 통합 관리** — 다음 결제일·월 총액·카테고리별 비중을 대시보드에서 확인. 안 쓰는 구독은 해지 대신 일시정지.
- **가계부 & 예산** — 수입·지출 기록, 카테고리별 월 예산, 오늘 쓸 수 있는 금액 자동 계산.
- **AI 소비 분석** — 매달 소비 패턴을 분석해 절약 팁 제안 (`/api/ai-insight`, `/api/ai-report`).
- **구독 시뮬레이터** — "이거 해지하면 1년에 치킨 몇 마리?" 직관적 비용 계산.
- **저축 목표** — 아낀 금액을 여행·전자기기 등 목표에 자동 연결, 진행률 트래킹.
- **게이미피케이션** — 함께 자라는 캐릭터 **서비(Subby)**, 데일리 퀘스트로 습관화.
- **결제일·예산 초과 알림, 다크 모드, 데이터 내보내기**.

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| 프론트엔드 | Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4 |
| 백엔드 | Supabase (PostgreSQL, Auth, Row Level Security), Next.js API Routes |
| 결제 | Toss Payments 연동 (`/api/toss`) |
| AI | 서버 사이드 AI 인사이트·리포트 (`user_plans` 테이블로 사용량 관리) |
| 테스트 | Vitest, Testing Library, jsdom |
| 기타 | date-fns, lucide-react |

## 프로젝트 구조

```
src/
├─ app/
│  ├─ api/                ← AI·결제 서버 라우트 (ai-insight, ai-report, toss)
│  ├─ auth/ login/ signup/ reset-password/   ← 인증
│  ├─ dashboard/          ← 홈 대시보드
│  ├─ subscriptions/      ← 구독 관리
│  ├─ budget/             ← 가계부·예산
│  ├─ goals/              ← 저축 목표
│  ├─ simulator/          ← 구독 시뮬레이터
│  ├─ report/             ← AI 소비 리포트
│  ├─ premium/            ← 프리미엄 플랜
│  ├─ subby-home/         ← 캐릭터 서비
│  ├─ settings/ terms/ privacy/ welcome/
│  └─ ...
├─ components/  contexts/  hooks/  lib/
└─ __tests__/             ← Vitest 테스트
```

DB 스키마는 [`supabase-schema.sql`](./supabase-schema.sql) (코어), [`supabase-full-setup.sql`](./supabase-full-setup.sql) (전체 셋업), [`supabase-gamification-migration.sql`](./supabase-gamification-migration.sql) (게이미피케이션) 참고. RLS로 사용자별 데이터를 격리합니다.

## 시작하기

### 1. 환경 변수

루트에 `.env.local` 생성:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
# (선택) AI / 결제
# OPENAI_API_KEY=...
# TOSS_SECRET_KEY=...
```

### 2. Supabase 스키마 적용

Supabase SQL Editor에서 다음 순서로 실행:

1. `supabase-full-setup.sql`
2. `supabase-gamification-migration.sql`

### 3. 개발 서버

```bash
npm install
npm run dev
```

→ http://localhost:3000

### 4. 테스트 / 빌드

```bash
npm test          # vitest watch
npm run test:run  # 1회 실행
npm run lint
npm run build
```

## 라이선스

비공개 프로젝트. 무단 복제·배포 금지.
