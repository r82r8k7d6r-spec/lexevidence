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
