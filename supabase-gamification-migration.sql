-- SubSmart 게이미피케이션 테이블
-- Supabase SQL Editor에서 실행하세요

create table if not exists user_gamification (
  user_id uuid references auth.users(id) on delete cascade primary key,
  xp integer not null default 0,
  quests_date text,
  quests_completed text[] not null default '{}',
  quests_selected text[] not null default '{}',
  daily_record_count integer not null default 0,
  daily_record_date text,
  stats_quests_completed integer not null default 0,
  stats_longest_streak integer not null default 0,
  stats_all_clear_count integer not null default 0,
  stats_days_active integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table user_gamification enable row level security;

create policy "Users can manage own gamification"
  on user_gamification for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- user_plans 테이블이 없으면 생성 (ai-report에서 이미 사용 중일 수 있음)
create table if not exists user_plans (
  user_id uuid references auth.users(id) on delete cascade primary key,
  plan text not null default 'free',
  ai_usage_today integer not null default 0,
  ai_usage_date text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table user_plans enable row level security;

create policy "Users can read own plan"
  on user_plans for select
  using (auth.uid() = user_id);

-- 프리미엄 업그레이드는 서버사이드(service_role)에서만 처리
-- 클라이언트에서 plan 컬럼 직접 업데이트 불가
