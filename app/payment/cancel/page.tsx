"use client";
import { useRouter } from 'next/navigation';

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="text-gray-500 text-3xl">×</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">決済がキャンセルされました</h1>
        <p className="text-gray-500 text-sm mb-8">
          入力内容は保存されています。<br />
          もう一度お試しください。
        </p>
        <button
          onClick={() => router.push('/')}
          className="bg-gray-900 text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-gray-700 transition"
        >
          フォームに戻る
        </button>
      </div>
    </div>
  );
}
