"use client";
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setErrorMsg('セッションIDが見つかりません');
      return;
    }

    fetch('/api/purchases/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (res.ok && json.verified) {
          setStatus('success');
          setTimeout(() => {
            router.push(`/?paid=true&session=${sessionId}`);
          }, 2000);
        } else {
          setStatus('error');
          setErrorMsg(json.error || '決済の確認に失敗しました');
        }
      })
      .catch(() => {
        setStatus('error');
        setErrorMsg('ネットワークエラーが発生しました');
      });
  }, [sessionId, router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md text-center py-16">
        {status === 'verifying' && (
          <>
            <div className="animate-spin border-4 border-blue-500 border-t-transparent rounded-full w-12 h-12 mx-auto mb-5" />
            <p className="text-gray-600 font-medium">決済を確認中...</p>
            <p className="text-gray-400 text-sm mt-1">しばらくお待ちください</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="text-green-600 text-3xl font-bold">✓</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">お支払いが完了しました</h1>
            <p className="text-gray-500 text-sm">資料生成画面に移動しています...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="text-red-600 text-3xl font-bold">!</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">エラーが発生しました</h1>
            <p className="text-red-600 text-sm mb-6">{errorMsg}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition"
            >
              トップに戻る
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin border-4 border-blue-500 border-t-transparent rounded-full w-12 h-12" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
