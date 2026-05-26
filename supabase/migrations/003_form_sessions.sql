-- form_sessions テーブル：Stripe決済フロー中のフォームデータ一時保存
CREATE TABLE IF NOT EXISTS public.form_sessions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  form_data  JSONB       NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '2 hours')
);

ALTER TABLE public.form_sessions ENABLE ROW LEVEL SECURITY;

-- ユーザー自身のセッションのみ操作可
CREATE POLICY "users_own_form_sessions" ON public.form_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS form_sessions_user_idx    ON public.form_sessions (user_id);
CREATE INDEX IF NOT EXISTS form_sessions_expires_idx ON public.form_sessions (expires_at);
