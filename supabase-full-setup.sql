-- ============================================================
-- SubSmart 전체 Supabase 스키마
-- Supabase Dashboard → SQL Editor에서 전체 복붙 후 실행
-- 이미 실행했어도 IF NOT EXISTS로 안전하게 재실행 가능
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. 구독 테이블
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name             TEXT NOT NULL,
  amount           NUMERIC(12, 0) NOT NULL DEFAULT 0,
  currency         TEXT NOT NULL DEFAULT 'KRW',
  billing_cycle    TEXT NOT NULL DEFAULT 'monthly'
                     CHECK (billing_cycle IN ('weekly', 'monthly', 'yearly')),
  category         TEXT NOT NULL DEFAULT 'other',
  next_billing_date DATE NOT NULL,
  icon_url         TEXT,
  color            TEXT DEFAULT '#6B7280',
  is_active        BOOLEAN NOT NULL DEFAULT true,
  memo             TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscriptions' AND policyname='subscriptions_select') THEN
    CREATE POLICY subscriptions_select ON subscriptions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscriptions' AND policyname='subscriptions_insert') THEN
    CREATE POLICY subscriptions_insert ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscriptions' AND policyname='subscriptions_update') THEN
    CREATE POLICY subscriptions_update ON subscriptions FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscriptions' AND policyname='subscriptions_delete') THEN
    CREATE POLICY subscriptions_delete ON subscriptions FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);

-- ─────────────────────────────────────────────
-- 2. 거래 내역 테이블
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount          NUMERIC(12, 0) NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category        TEXT NOT NULL DEFAULT 'other',
  description     TEXT NOT NULL,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring    BOOLEAN NOT NULL DEFAULT false,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='transactions' AND policyname='transactions_select') THEN
    CREATE POLICY transactions_select ON transactions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='transactions' AND policyname='transactions_insert') THEN
    CREATE POLICY transactions_insert ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='transactions' AND policyname='transactions_update') THEN
    CREATE POLICY transactions_update ON transactions FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='transactions' AND policyname='transactions_delete') THEN
    CREATE POLICY transactions_delete ON transactions FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);

-- ─────────────────────────────────────────────
-- 3. 예산 테이블
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS budgets (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category     TEXT NOT NULL,
  limit_amount NUMERIC(12, 0) NOT NULL,
  month        TEXT NOT NULL, -- YYYY-MM
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, category, month)
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='budgets' AND policyname='budgets_select') THEN
    CREATE POLICY budgets_select ON budgets FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='budgets' AND policyname='budgets_insert') THEN
    CREATE POLICY budgets_insert ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='budgets' AND policyname='budgets_update') THEN
    CREATE POLICY budgets_update ON budgets FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='budgets' AND policyname='budgets_delete') THEN
    CREATE POLICY budgets_delete ON budgets FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);

-- ─────────────────────────────────────────────
-- 4. 저축 목표 테이블
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS savings_goals (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name           TEXT NOT NULL,
  target_amount  NUMERIC(12, 0) NOT NULL,
  current_amount NUMERIC(12, 0) NOT NULL DEFAULT 0,
  deadline       DATE,
  emoji          TEXT DEFAULT '🎯',
  created_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='savings_goals' AND policyname='savings_goals_select') THEN
    CREATE POLICY savings_goals_select ON savings_goals FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='savings_goals' AND policyname='savings_goals_insert') THEN
    CREATE POLICY savings_goals_insert ON savings_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='savings_goals' AND policyname='savings_goals_update') THEN
    CREATE POLICY savings_goals_update ON savings_goals FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='savings_goals' AND policyname='savings_goals_delete') THEN
    CREATE POLICY savings_goals_delete ON savings_goals FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON savings_goals(user_id);

-- ─────────────────────────────────────────────
-- 5. 사용자 플랜 테이블 (프리미엄 + AI 사용량)
-- 보안: 클라이언트는 SELECT만 가능
--       plan 변경은 서버사이드(service_role)에서만 처리
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_plans (
  user_id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan           TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  ai_usage_today INT NOT NULL DEFAULT 0,
  ai_usage_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  premium_since  TIMESTAMPTZ,
  premium_plan   TEXT CHECK (premium_plan IN ('monthly', 'yearly', NULL)),
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

-- 기존 정책 제거 후 재생성 (클라이언트 SELECT만 허용)
DROP POLICY IF EXISTS "Users can view own plan" ON user_plans;
DROP POLICY IF EXISTS "Users can insert own plan" ON user_plans;
DROP POLICY IF EXISTS "Users can update own plan" ON user_plans;

CREATE POLICY user_plans_select ON user_plans FOR SELECT USING (auth.uid() = user_id);
-- INSERT/UPDATE는 service_role(API Route)에서만 처리 — 클라이언트 직접 쓰기 차단

-- ─────────────────────────────────────────────
-- 6. 게이미피케이션 테이블 (XP, 퀘스트, 통계)
--    기기 변경 시에도 써비 레벨/XP 유지
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_gamification (
  user_id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp                     INTEGER NOT NULL DEFAULT 0,
  quests_date            TEXT,            -- YYYY-MM-DD
  quests_completed       TEXT[] NOT NULL DEFAULT '{}',
  quests_selected        TEXT[] NOT NULL DEFAULT '{}',
  daily_record_count     INTEGER NOT NULL DEFAULT 0,
  daily_record_date      TEXT,            -- YYYY-MM-DD
  stats_quests_completed INTEGER NOT NULL DEFAULT 0,
  stats_longest_streak   INTEGER NOT NULL DEFAULT 0,
  stats_all_clear_count  INTEGER NOT NULL DEFAULT 0,
  stats_days_active      INTEGER NOT NULL DEFAULT 0,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_gamification' AND policyname='gamification_all') THEN
    CREATE POLICY gamification_all ON user_gamification FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- 7. updated_at 자동 갱신 트리거
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_gamification_updated ON user_gamification;
CREATE TRIGGER trg_user_gamification_updated
  BEFORE UPDATE ON user_gamification
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_user_plans_updated ON user_plans;
CREATE TRIGGER trg_user_plans_updated
  BEFORE UPDATE ON user_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
