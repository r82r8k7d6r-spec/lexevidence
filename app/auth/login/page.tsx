"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("メールアドレスまたはパスワードが正しくありません");
      setLoading(false);
      return;
    }
    router.push("/");
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });
    if (error) {
      setError("Googleログインに失敗しました");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md py-16">

        {/* ロゴ・タイトル */}
        <div className="flex flex-col items-center mb-10">
          <Image
            src="/mamoriAI.jpg"
            alt="マモリAI"
            width={120}
            height={120}
            className="rounded-2xl mb-5"
            style={{ height: "auto" }}
          />
          <h1 className="text-2xl font-bold text-gray-900">マモリAI</h1>

          {/* キャッチコピー */}
          <div className="w-full mt-6 space-y-3">
            {/* 1. メインキャッチ */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-center">
              <p className="text-blue-700 font-bold text-sm leading-snug">
                スマホの中の修羅場を、<br />3分で弁護士が動く証拠資料へ
              </p>
            </div>

            {/* 2. セキュリティ */}
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="text-green-600 text-lg shrink-0">🛡️</span>
              <p className="text-green-700 text-xs leading-snug font-medium">
                【秘密厳守】入力データは資料生成後に即時削除されます
              </p>
            </div>

            {/* 3. 説明文 */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center">
              <p className="text-gray-500 text-xs leading-relaxed">
                LINEトーク・画像・音声を投げるだけ。<br />
                弁護士相談の時間を半分に、慰謝料請求の一歩へ
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm text-gray-400">ログイン</p>
        </div>

        {/* エラー */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* フォーム */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "処理中..." : "ログイン"}
          </button>
        </form>

        {/* 区切り */}
        <div className="flex items-center my-7">
          <div className="flex-1 border-t border-gray-100" />
          <span className="px-4 text-xs text-gray-400">または</span>
          <div className="flex-1 border-t border-gray-100" />
        </div>

        {/* Googleログイン */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 px-4 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
        >
          <GoogleIcon />
          Googleでログイン
        </button>

        {/* 新規登録リンク */}
        <p className="mt-10 text-center text-sm text-gray-400">
          アカウントをお持ちでない方は{" "}
          <Link href="/auth/signup" className="text-gray-900 font-medium hover:underline">
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
