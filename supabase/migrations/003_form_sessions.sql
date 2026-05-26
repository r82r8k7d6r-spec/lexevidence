-- ========================================================
-- form_sessions：フォームデータ一時保存（決済リダイレクト用）
-- 実データは Supabase Storage に保存し、このテーブルはメタデータのみ持つ
-- ========================================================

-- 既存テーブルを DROP して再作成（form_data JSONB 列を廃止）
DROP TABLE IF EXISTS public.form_sessions;

CREATE TABLE public.form_sessions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT        NOT NULL,  -- Supabase Storage 上のパス
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '2 hours')
);

ALTER TABLE public.form_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_form_sessions" ON public.form_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS form_sessions_user_idx    ON public.form_sessions (user_id);
CREATE INDEX IF NOT EXISTS form_sessions_expires_idx ON public.form_sessions (expires_at);

-- ========================================================
-- Supabase Storage バケット（form-sessions）
-- 200 MB / ファイル、JSON のみ許可
-- ========================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('form-sessions', 'form-sessions', false, 209715200, ARRAY['application/json'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS ポリシー（認証済みユーザーが自分の UUID フォルダのみ操作可）
DROP POLICY IF EXISTS "form_sessions_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "form_sessions_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "form_sessions_storage_delete" ON storage.objects;

CREATE POLICY "form_sessions_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'form-sessions'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "form_sessions_storage_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'form-sessions'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "form_sessions_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'form-sessions'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
