"use client";
import { useState } from "react";
import Link from "next/link";
import { BasicInfo } from "@/types";

interface Props {
  data: BasicInfo;
  onChange: (data: BasicInfo) => void;
  onNext: () => void;
}

export default function Step1BasicInfo({ data, onChange, onNext }: Props) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const set = (field: keyof BasicInfo, value: string) =>
    onChange({ ...data, [field]: value });

  const isValid =
    data.applicantName && data.opponentName && data.marriageDate && data.discoveryDate && data.relationship && agreedToTerms;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 border-b pb-2">STEP 1｜基本情報の入力</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">申請者氏名 <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={data.applicantName}
            onChange={(e) => set("applicantName", e.target.value)}
            placeholder="例：山田 花子"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">妻／夫の氏名 <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={data.opponentName}
            onChange={(e) => set("opponentName", e.target.value)}
            placeholder="例：鈴木 太郎"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">婚姻日 <span className="text-red-500">*</span></label>
          <input
            type="date"
            value={data.marriageDate}
            onChange={(e) => set("marriageDate", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">不貞発覚日 <span className="text-red-500">*</span></label>
          <input
            type="date"
            value={data.discoveryDate}
            onChange={(e) => set("discoveryDate", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">不貞相手と妻／夫の関係性 <span className="text-red-500">*</span></label>
        <select
          value={data.relationship}
          onChange={(e) => set("relationship", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">選択してください</option>
          <option value="職場の同僚">職場の同僚</option>
          <option value="友人・知人">友人・知人</option>
          <option value="元交際相手">元交際相手</option>
          <option value="SNSで知り合った">SNSで知り合った</option>
          <option value="その他">その他</option>
        </select>
      </div>

      {/* 不貞相手の情報 */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">不貞相手の情報（わかる範囲で）</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">不貞相手の氏名</label>
            <input
              type="text"
              value={data.affairPartnerName}
              onChange={(e) => set("affairPartnerName", e.target.value)}
              placeholder="例：田中 美咲（フルネーム）"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">年齢または生年月日</label>
            <input
              type="text"
              value={data.affairPartnerAge}
              onChange={(e) => set("affairPartnerAge", e.target.value)}
              placeholder="例：32歳 / 1992年生まれ"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">職業・勤務先</label>
            <input
              type="text"
              value={data.affairPartnerOccupation}
              onChange={(e) => set("affairPartnerOccupation", e.target.value)}
              placeholder="例：○○株式会社 営業部"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">不貞関係が始まった時期</label>
            <input
              type="text"
              value={data.affairStartPeriod}
              onChange={(e) => set("affairStartPeriod", e.target.value)}
              placeholder="例：2023年春頃 / 約2年前"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">夫／妻との出会いのきっかけ</label>
          <input
            type="text"
            value={data.affairPartnerMeetingContext}
            onChange={(e) => set("affairPartnerMeetingContext", e.target.value)}
            placeholder="例：職場の同僚、マッチングアプリ、幼馴染、SNSで知り合った"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">補足情報（任意）</label>
        <textarea
          value={data.additionalInfo}
          onChange={(e) => set("additionalInfo", e.target.value)}
          placeholder="経緯や状況など、弁護士に伝えたいことを自由に記入してください"
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 利用規約への同意 */}
      <div className="border-t border-gray-200 pt-4">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-blue-600 shrink-0"
          />
          <span className="text-sm text-gray-700">
            <Link href="/terms" target="_blank" className="text-blue-600 underline hover:text-blue-800 font-medium">
              利用規約・免責事項
            </Link>
            を読み、内容に同意します。本サービスはAIによる補助資料生成であり、法的判断は弁護士に委ねることを理解しました。
          </span>
        </label>
        {!agreedToTerms && (
          <p className="text-xs text-amber-600 mt-1 ml-7">次へ進むには利用規約への同意が必要です</p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!isValid}
          className="bg-blue-600 text-white px-8 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          次へ →
        </button>
      </div>
    </div>
  );
}
