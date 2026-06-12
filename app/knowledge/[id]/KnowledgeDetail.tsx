"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KNOWLEDGE_CATEGORIES, KnowledgeEntry } from "@/types";

export default function KnowledgeDetail({ entry }: { entry: KnowledgeEntry }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(entry.title);
  const [category, setCategory] = useState(entry.category);
  const [tags, setTags] = useState(entry.tags.join(", "));
  const [content, setContent] = useState(entry.content);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/knowledge/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        category,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        content,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "更新に失敗しました");
      setLoading(false);
      return;
    }

    setEditing(false);
    setLoading(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm("このナレッジを削除します。よろしいですか？")) return;
    setLoading(true);
    const res = await fetch(`/api/knowledge/${entry.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/knowledge");
      router.refresh();
    } else {
      setError("削除に失敗しました");
      setLoading(false);
    }
  };

  if (editing) {
    return (
      <form onSubmit={handleSave} className="space-y-5">
        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">タイトル</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">カテゴリ</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {KNOWLEDGE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">タグ（カンマ区切り）</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">内容</label>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "保存中..." : "保存"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
        </div>
      </form>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">
          {entry.category}
        </span>
        {entry.tags.map((t) => (
          <Link
            key={t}
            href={`/knowledge?tag=${encodeURIComponent(t)}`}
            className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200 transition-colors"
          >
            #{t}
          </Link>
        ))}
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{entry.title}</h1>
      <div className="whitespace-pre-line text-gray-800 leading-relaxed border border-gray-200 rounded-xl p-4 bg-gray-50/50 mb-4">
        {entry.content}
      </div>
      <p className="text-xs text-gray-400 mb-6">
        作成: {new Date(entry.created_at).toLocaleString("ja-JP")} ／ 更新:{" "}
        {new Date(entry.updated_at).toLocaleString("ja-JP")}
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => setEditing(true)}
          className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          編集
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          削除
        </button>
      </div>
    </div>
  );
}
