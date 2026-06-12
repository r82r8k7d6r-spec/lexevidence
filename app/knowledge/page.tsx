import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { KNOWLEDGE_CATEGORIES, KnowledgeEntry } from "@/types";

export const dynamic = "force-dynamic";

interface SearchParams {
  q?: string;
  category?: string;
  tag?: string;
}

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q, category, tag } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("knowledge_entries")
    .select("*")
    .order("updated_at", { ascending: false });

  if (category) query = query.eq("category", category);
  if (tag) query = query.contains("tags", [tag]);
  if (q) {
    const escaped = q.replace(/[%,]/g, "");
    query = query.or(`title.ilike.%${escaped}%,content.ilike.%${escaped}%`);
  }

  const { data: entries } = await query;
  const hasFilter = !!(q || category || tag);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ナレッジベース</h1>
        <Link
          href="/knowledge/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 新規作成
        </Link>
      </div>

      {/* 検索・フィルタ */}
      <form className="flex flex-col sm:flex-row gap-3 mb-3" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="キーワードで検索（タイトル・本文）"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          name="category"
          defaultValue={category ?? ""}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">すべてのカテゴリ</option>
          {KNOWLEDGE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {tag && <input type="hidden" name="tag" value={tag} />}
        <button
          type="submit"
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
        >
          検索
        </button>
        {hasFilter && (
          <Link
            href="/knowledge"
            className="px-4 py-2 text-gray-500 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            クリア
          </Link>
        )}
      </form>

      {tag && (
        <div className="mb-4">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded">
            タグ: #{tag}
          </span>
        </div>
      )}

      <p className="text-sm text-gray-500 mb-4">{entries?.length ?? 0} 件</p>

      {!entries || entries.length === 0 ? (
        <div className="text-center text-gray-400 py-16 border border-dashed border-gray-200 rounded-xl">
          {hasFilter ? "条件に一致するナレッジが見つかりません" : "ナレッジがまだ登録されていません"}
        </div>
      ) : (
        <ul className="space-y-3">
          {(entries as KnowledgeEntry[]).map((entry) => (
            <li key={entry.id}>
              <Link
                href={`/knowledge/${entry.id}`}
                className="block border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                    {entry.category}
                  </span>
                  {entry.tags.map((t) => (
                    <span key={t} className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      #{t}
                    </span>
                  ))}
                </div>
                <h2 className="font-semibold text-gray-900 mb-1">{entry.title}</h2>
                <p className="text-sm text-gray-500 line-clamp-2 whitespace-pre-line">{entry.content}</p>
                <p className="text-xs text-gray-400 mt-2">
                  更新: {new Date(entry.updated_at).toLocaleString("ja-JP")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
