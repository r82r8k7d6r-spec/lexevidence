"use client";
import { FormData as AppFormData } from "@/types";

interface Props {
  formData: AppFormData;
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
}

export default function Step5Confirm({ formData, onSubmit, onBack, loading }: Props) {
  const { basicInfo, lineData, screenshots, audioData } = formData;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 border-b pb-2">STEP 5｜確認</h2>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm">
        <h3 className="font-semibold text-gray-700">基本情報</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-gray-600">
          <dt className="font-medium">申請者</dt><dd>{basicInfo.applicantName}</dd>
          <dt className="font-medium">相手方</dt><dd>{basicInfo.opponentName}</dd>
          <dt className="font-medium">婚姻日</dt><dd>{basicInfo.marriageDate}</dd>
          <dt className="font-medium">発覚日</dt><dd>{basicInfo.discoveryDate}</dd>
          <dt className="font-medium">関係性</dt><dd>{basicInfo.relationship}</dd>
        </dl>
        {basicInfo.additionalInfo && (
          <div className="mt-2">
            <span className="font-medium text-gray-700">補足: </span>
            <span className="text-gray-600">{basicInfo.additionalInfo}</span>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
        <h3 className="font-semibold text-gray-700">証拠データ</h3>
        <ul className="space-y-1 text-gray-600">
          <li>📱 LINEトーク: {lineData.text ? `${lineData.text.length.toLocaleString()} 文字` : "なし"}</li>
          <li>📷 スクリーンショット: {screenshots.length} 件</li>
          <li>🎙️ 音声文字起こし: {audioData.transcription ? `${audioData.transcription.length.toLocaleString()} 文字` : "なし"}</li>
        </ul>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <strong>注意:</strong> 送信された情報はAnthropicのAI（Claude）に送信され、法的資料の生成に使用されます。送信前に内容をご確認ください。
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} disabled={loading} className="text-gray-600 px-6 py-2 rounded-lg border hover:bg-gray-50 transition disabled:opacity-40">
          ← 戻る
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="bg-green-600 text-white px-8 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4 inline-block" />
              AI生成中...
            </>
          ) : "AI資料を生成する"}
        </button>
      </div>
    </div>
  );
}
