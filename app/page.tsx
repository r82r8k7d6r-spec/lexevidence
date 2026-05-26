"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { FormData as AppFormData, GeneratedReport } from "@/types";
import Step1BasicInfo from "@/components/Step1BasicInfo";
import Step2LineData from "@/components/Step2LineData";
import Step3Screenshots from "@/components/Step3Screenshots";
import Step4Audio from "@/components/Step4Audio";
import Step5Confirm from "@/components/Step5Confirm";
import Step6Result from "@/components/Step6Result";

const STEPS = ["基本情報", "LINEトーク", "スクリーンショット", "音声", "確認"];

const initialFormData: AppFormData = {
  basicInfo: {
    applicantName: "",
    opponentName: "",
    marriageDate: "",
    discoveryDate: "",
    relationship: "",
    additionalInfo: "",
    affairPartnerName: "",
    affairPartnerAge: "",
    affairPartnerOccupation: "",
    affairPartnerMeetingContext: "",
    affairStartPeriod: "",
  },
  lineData: { text: "" },
  screenshots: [],
  audioData: { transcription: "" },
};

type AnalysisStatus = 'idle' | 'analyzing' | 'done' | 'error';

export default function Home() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<AppFormData>(initialFormData);
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [price, setPrice] = useState(1980);
  const [isFirst, setIsFirst] = useState(true);

  // ① LINE分析・② 音声文字起こし分析
  const [lineAnalysis, setLineAnalysis] = useState<string | null>(null);
  const [lineAnalysisStatus, setLineAnalysisStatus] = useState<AnalysisStatus>('idle');
  const [transcriptionAnalysis, setTranscriptionAnalysis] = useState<string | null>(null);
  const [transcriptionAnalysisStatus, setTranscriptionAnalysisStatus] = useState<AnalysisStatus>('idle');

  const next = () => setStep((s) => Math.min(s + 1, 5));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  // 資料生成（生成後に form_session を削除）
  const handleGenerate = useCallback(async (data: AppFormData, formSessionId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "生成に失敗しました");
      setReport(json.report);
      setStep(5);
      // 生成完了後にフォームデータを削除
      if (formSessionId) {
        fetch(`/api/form-sessions/${formSessionId}`, { method: "DELETE" }).catch(() => {});
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }, []);

  // Step5 に到達したら料金情報を取得
  useEffect(() => {
    if (step !== 4) return;
    fetch("/api/purchases/count")
      .then((r) => r.json())
      .then((d) => {
        if (d.price) setPrice(d.price);
        if (typeof d.isFirst === "boolean") setIsFirst(d.isFirst);
      })
      .catch(() => {});
  }, [step]);

  // 決済完了後のリダイレクト検出：Supabase からフォームデータを取得 → 自動生成
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") !== "true") return;

    const formSessionId = params.get("form_session");
    window.history.replaceState({}, "", "/");

    if (!formSessionId) {
      setError("フォームデータが見つかりません。もう一度最初からお試しください。");
      return;
    }

    setLoading(true);
    fetch(`/api/form-sessions/${formSessionId}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || "フォームデータの取得に失敗しました");
        const restored = json.formData as AppFormData;
        setFormData(restored);
        setStep(4);
        handleGenerate(restored, formSessionId);
      })
      .catch((e: unknown) => {
        setLoading(false);
        setError(e instanceof Error ? e.message : "フォームデータの復元に失敗しました");
      });
  }, [handleGenerate]);

  // Stripe Checkout へリダイレクト
  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    try {
      // フォームデータを Supabase に一時保存
      const sessionRes = await fetch("/api/form-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData }),
      });
      const sessionJson = await sessionRes.json();
      if (!sessionRes.ok) throw new Error(sessionJson.error || "フォームデータの保存に失敗しました");

      // Stripe Checkout セッション作成（formSessionId をメタデータに含める）
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formSessionId: sessionJson.formSessionId }),
      });
      const checkoutJson = await checkoutRes.json();
      if (!checkoutRes.ok) throw new Error(checkoutJson.error || "決済の開始に失敗しました");

      window.location.href = checkoutJson.url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
      setLoading(false);
    }
  };

  // ①コールバック
  const handleLineAnalysis = useCallback((result: string) => {
    if (result === '__analyzing__') { setLineAnalysisStatus('analyzing'); return; }
    if (result === '__error__')    { setLineAnalysisStatus('error'); return; }
    setLineAnalysis(result);
    setLineAnalysisStatus('done');
  }, []);

  // ②コールバック
  const handleTranscriptionAnalysis = useCallback((result: string) => {
    if (result === '__analyzing__') { setTranscriptionAnalysisStatus('analyzing'); return; }
    if (result === '__error__')    { setTranscriptionAnalysisStatus('error'); return; }
    setTranscriptionAnalysis(result);
    setTranscriptionAnalysisStatus('done');
  }, []);

  const reset = () => {
    setStep(0);
    setFormData(initialFormData);
    setReport(null);
    setError(null);
    setLineAnalysis(null);
    setLineAnalysisStatus('idle');
    setTranscriptionAnalysis(null);
    setTranscriptionAnalysisStatus('idle');
  };

  return (
    <main className="min-h-screen bg-white py-12 px-4 font-sans">
      <div className="max-w-2xl mx-auto">

        {/* ヘッダー */}
        <div className="flex flex-col items-center text-center mb-12">
          <Image
            src="/mamoriAI.jpg"
            alt="マモリAI"
            width={300}
            height={300}
            className="rounded-2xl mb-6"
            style={{ height: "auto" }}
          />
          <h1 className="text-3xl font-bold text-gray-900">マモリAI</h1>
          <p className="mt-2 text-sm text-gray-400">不倫慰謝料請求 弁護士提出用資料 自動生成システム</p>
        </div>

        {/* ステップインジケーター */}
        {step < 5 && (
          <div className="flex items-center justify-center mb-10 overflow-x-auto pb-1">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center shrink-0">
                <div className={`flex items-center gap-1.5 ${i <= step ? "text-blue-600" : "text-gray-400"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors
                    ${i < step
                      ? "bg-blue-600 border-blue-600 text-white"
                      : i === step
                        ? "bg-white border-blue-600 text-blue-600"
                        : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px w-6 sm:w-8 mx-2 ${i < step ? "bg-blue-600" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* フォームカード */}
        <div className="border border-gray-200 rounded-2xl p-6 md:p-8">
          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {step === 0 && (
            <Step1BasicInfo
              data={formData.basicInfo}
              onChange={(basicInfo) => setFormData((f) => ({ ...f, basicInfo }))}
              onNext={next}
            />
          )}
          {step === 1 && (
            <Step2LineData
              data={formData.lineData}
              onChange={(lineData) => setFormData((f) => ({ ...f, lineData }))}
              onNext={next}
              onBack={back}
              onLineAnalysisComplete={handleLineAnalysis}
              lineAnalysisStatus={lineAnalysisStatus}
            />
          )}
          {step === 2 && (
            <Step3Screenshots
              screenshots={formData.screenshots}
              onChange={(screenshots) => setFormData((f) => ({ ...f, screenshots }))}
              onNext={next}
              onBack={back}
            />
          )}
          {step === 3 && (
            <Step4Audio
              data={formData.audioData}
              onChange={(audioData) => setFormData((f) => ({ ...f, audioData }))}
              onNext={next}
              onBack={back}
              onTranscriptionAnalysisComplete={handleTranscriptionAnalysis}
              transcriptionAnalysisStatus={transcriptionAnalysisStatus}
            />
          )}
          {step === 4 && (
            <Step5Confirm
              formData={formData}
              onPayment={handlePayment}
              onBack={back}
              loading={loading}
              price={price}
              isFirst={isFirst}
            />
          )}
          {step === 5 && report && (
            <Step6Result
              report={report}
              onReset={reset}
              lineAnalysis={lineAnalysis}
              transcriptionAnalysis={transcriptionAnalysis}
            />
          )}
        </div>

        <footer className="mt-8 text-center space-y-2">
          <p className="text-xs text-gray-400">
            本ツールはAIによる補助資料生成です。法的判断は必ず弁護士にご相談ください。
          </p>
          <p className="text-xs">
            <Link href="/terms" className="text-gray-400 hover:text-gray-600 underline">
              利用規約・免責事項
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
