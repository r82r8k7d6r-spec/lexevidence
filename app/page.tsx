"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FormData as AppFormData, GeneratedReport } from "@/types";
import Step1BasicInfo from "@/components/Step1BasicInfo";
import Step2LineData from "@/components/Step2LineData";
import Step3Screenshots from "@/components/Step3Screenshots";
import Step4Audio from "@/components/Step4Audio";
import Step5Confirm from "@/components/Step5Confirm";
import Step6Result from "@/components/Step6Result";

const STEPS = ["基本情報", "LINEトーク", "スクリーンショット", "音声", "確認", "結果"];

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

export default function Home() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<AppFormData>(initialFormData);
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = () => setStep((s) => Math.min(s + 1, 5));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "生成に失敗しました");
      setReport(data.report);
      setStep(5);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(0);
    setFormData(initialFormData);
    setReport(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* iOSダークモード注意書き */}
        <div style={{backgroundColor: '#fefce8', border: '1px solid #fde047', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', fontSize: '13px', color: '#854d0e'}}>
          ⚠️ iPhoneをダークモードでご利用の場合、文字が見えにくくなる場合があります。「設定 → 画面表示と明るさ → ライト」に変更してご利用ください。
        </div>

        {/* メイン画像 */}
        <div className="w-full max-w-2xl mx-auto mb-6">
          <Image
            src="/mamoriAI.jpg"
            alt="マモリAI"
            width={672}
            height={400}
            className="w-full rounded-2xl shadow-lg"
            style={{ height: "auto" }}
          />
        </div>

        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">弁護士提出用 マモリAI</h1>
          <p className="text-gray-500 mt-1 text-sm">不倫慰謝料請求 弁護士提出用資料 自動生成システム</p>
        </div>

        {/* ステップインジケーター */}
        {step < 5 && (
          <div className="flex items-center mb-8 overflow-x-auto pb-2">
            {STEPS.slice(0, 5).map((label, i) => (
              <div key={i} className="flex items-center shrink-0">
                <div className={`flex items-center gap-1.5 ${i <= step ? "text-blue-600" : "text-gray-400"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${i < step ? "bg-blue-600 border-blue-600 text-white" : i === step ? "border-blue-600 text-blue-600" : "border-gray-300"}`}>
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{label}</span>
                </div>
                {i < 4 && <div className={`h-0.5 w-6 sm:w-10 mx-1 ${i < step ? "bg-blue-600" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        )}

        {/* カード */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
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
            />
          )}
          {step === 4 && (
            <Step5Confirm
              formData={formData}
              onSubmit={handleSubmit}
              onBack={back}
              loading={loading}
            />
          )}
          {step === 5 && report && (
            <Step6Result report={report} onReset={reset} />
          )}
        </div>

        <footer className="mt-6 text-center space-y-1">
          <p className="text-xs text-gray-400">
            本ツールはAIによる補助資料生成です。法的判断は必ず弁護士にご相談ください。
          </p>
          <p className="text-xs">
            <Link href="/terms" className="text-blue-400 hover:text-blue-600 underline">
              利用規約・免責事項
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
