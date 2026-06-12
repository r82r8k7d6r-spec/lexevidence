-- ========================================================
-- knowledge_entries：ナレッジベース（FAQ蓄積用）
-- ========================================================
CREATE TABLE IF NOT EXISTS public.knowledge_entries (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  category    TEXT        NOT NULL DEFAULT 'その他',
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  content     TEXT        NOT NULL,
  created_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.knowledge_entries ENABLE ROW LEVEL SECURITY;

-- 社内ナレッジのため、ログイン済みユーザーであれば全員が閲覧・追加・編集・削除可能
CREATE POLICY "authenticated_can_select_knowledge" ON public.knowledge_entries
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_can_insert_knowledge" ON public.knowledge_entries
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_can_update_knowledge" ON public.knowledge_entries
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "authenticated_can_delete_knowledge" ON public.knowledge_entries
  FOR DELETE TO authenticated USING (true);

-- updated_at 自動更新（001_profiles.sql で定義した共通トリガー関数を再利用）
CREATE TRIGGER knowledge_entries_updated_at
  BEFORE UPDATE ON public.knowledge_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 検索・絞り込み用インデックス
CREATE INDEX IF NOT EXISTS knowledge_entries_category_idx    ON public.knowledge_entries (category);
CREATE INDEX IF NOT EXISTS knowledge_entries_updated_at_idx  ON public.knowledge_entries (updated_at DESC);
CREATE INDEX IF NOT EXISTS knowledge_entries_tags_idx        ON public.knowledge_entries USING gin (tags);
CREATE INDEX IF NOT EXISTS knowledge_entries_search_idx      ON public.knowledge_entries
  USING gin (to_tsvector('simple', title || ' ' || content));
