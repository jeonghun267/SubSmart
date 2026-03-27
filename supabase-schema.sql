-- SubSmart Database Schema
-- Supabase SQL Editor에서 실행하세요

-- 구독 테이블
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC(12, 0) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'KRW',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('weekly', 'monthly', 'yearly')),
  category TEXT NOT NULL DEFAULT 'other',
  next_billing_date DATE NOT NULL,
  icon_url TEXT,
  color TEXT DEFAULT '#6B7280',
  is_active BOOLEAN NOT NULL DEFAULT true,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 거래 내역 테이블
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12, 0) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL DEFAULT 'other',
  description TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 예산 테이블
CREATE TABLE budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  limit_amount NUMERIC(12, 0) NOT NULL,
  month TEXT NOT NULL, -- YYYY-MM format
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, category, month)
);

-- RLS (Row Level Security) 활성화
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- 유저 본인 데이터만 접근 가능하도록 설정
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own subscriptions" ON subscriptions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own budgets" ON budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON budgets FOR DELETE USING (auth.uid() = user_id);

-- 저축 목표 테이블
CREATE TABLE savings_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  target_amount NUMERIC(12, 0) NOT NULL,
  current_amount NUMERIC(12, 0) NOT NULL DEFAULT 0,
  deadline DATE,
  emoji TEXT DEFAULT '🎯',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own goals" ON savings_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON savings_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON savings_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON savings_goals FOR DELETE USING (auth.uid() = user_id);

-- 사용자 플랜 테이블 (서버사이드 프리미엄/AI 사용량 관리)
CREATE TABLE user_plans (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',
  ai_usage_today INT NOT NULL DEFAULT 0,
  ai_usage_date DATE NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own plan" ON user_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plan" ON user_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plan" ON user_plans FOR UPDATE USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX idx_budgets_user_month ON budgets(user_id, month);
CREATE INDEX idx_savings_goals_user ON savings_goals(user_id);
