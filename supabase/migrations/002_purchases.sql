-- purchases テーブル：Stripe決済履歴・利用回数管理
CREATE TABLE IF NOT EXISTS public.purchases (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id        TEXT        UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,
  amount_jpy               INTEGER     NOT NULL,
  status                   TEXT        NOT NULL DEFAULT 'pending', -- 'pending' | 'completed' | 'failed'
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at             TIMESTAMPTZ
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- ユーザー自身の購入履歴を参照可
CREATE POLICY "users_can_view_own_purchases" ON public.purchases
  FOR SELECT USING (auth.uid() = user_id);

-- Service Role Key でのみ INSERT/UPDATE を許可
CREATE POLICY "service_can_insert_purchases" ON public.purchases
  FOR INSERT WITH CHECK (true);

CREATE POLICY "service_can_update_purchases" ON public.purchases
  FOR UPDATE USING (true);

-- インデックス
CREATE INDEX IF NOT EXISTS purchases_user_id_status_idx ON public.purchases (user_id, status);
CREATE INDEX IF NOT EXISTS purchases_stripe_session_idx  ON public.purchases (stripe_session_id);
