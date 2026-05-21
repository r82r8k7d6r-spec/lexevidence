"use client";
import { useRef } from "react";
import { LineData } from "@/types";

interface Props {
  data: LineData;
  onChange: (data: LineData) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2LineData({ data, onChange, onNext, onBack }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      onChange({ text, fileName: file.name });
    };
    reader.readAsText(file, "utf-8");
  };

  const charCount = data.text.length;
  const isLong = charCount > 30000;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 border-b pb-2">STEP 2｜LINEトーク内容</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          .txtファイルから読み込む
        </label>
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition"
        >
          <p className="text-gray-500 text-sm">クリックして .txt ファイルを選択</p>
          {data.fileName && <p className="mt-2 text-blue-600 font-medium text-sm">{data.fileName}</p>}
        </div>
        <input ref={fileRef} type="file" accept=".txt" className="hidden" onChange={handleFile} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          LINEトーク内容を直接入力・貼り付け
        </label>
        <textarea
          value={data.text}
          onChange={(e) => onChange({ ...data, text: e.target.value })}
          placeholder="LINEのトーク履歴をここに貼り付けてください..."
          rows={12}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex justify-between items-center mt-1">
          <span className={`text-xs ${isLong ? "text-amber-600 font-medium" : "text-gray-400"}`}>
            {charCount.toLocaleString()} 文字{isLong && "（3万字超のため先頭・中間・末尾を自動抜粋してAIに送信します）"}
          </span>
        </div>
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="text-gray-600 px-6 py-2 rounded-lg border hover:bg-gray-50 transition">
          ← 戻る
        </button>
        <button onClick={onNext} className="bg-blue-600 text-white px-8 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
          次へ →
        </button>
      </div>
    </div>
  );
}
