"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KNOWLEDGE_CATEGORIES } from "@/types";

export default function NewKnowledgePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(KNOWLEDGE_CATEGORIES[0]);
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/knowledge", {
      method: "POST",
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
      setError(json.error || "作成に失敗しました");
      setLoading(false);
      return;
    }

    router.push(`/knowledge/${json.entry.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/knowledge" className="text-sm text-gray-500 hover:underline">
          ← ナレッジベースに戻る
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ナレッジを追加</h1>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：V6接続でランプが点滅する場合の切り分け手順"
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
              placeholder="例：V6, ランプ, 切り分け"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            内容 <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            placeholder="対応手順・回答内容・注意点などを記入してください"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "保存中..." : "保存する"}
        </button>
      </form>
    </div>
  );
}
