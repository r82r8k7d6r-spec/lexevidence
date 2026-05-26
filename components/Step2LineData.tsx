"use client";
import { useRef, useEffect } from "react";
import { LineData } from "@/types";

interface Props {
  data: LineData;
  onChange: (data: LineData) => void;
  onNext: () => void;
  onBack: () => void;
  onLineAnalysisComplete?: (result: string) => void;
  lineAnalysisStatus?: 'idle' | 'analyzing' | 'done' | 'error';
}

export default function Step2LineData({
  data, onChange, onNext, onBack,
  onLineAnalysisComplete, lineAnalysisStatus = 'idle',
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerAnalysis = (text: string) => {
    if (!onLineAnalysisComplete || text.length < 100) return;
    onLineAnalysisComplete('__analyzing__'); // 分析開始シグナル
    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'line', content: text }),
    })
      .then(r => r.json())
      .then(json => {
        if (json.result) onLineAnalysisComplete(json.result);
        else onLineAnalysisComplete('__error__');
      })
      .catch(() => onLineAnalysisComplete('__error__'));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      onChange({ text, fileName: file.name });
      triggerAnalysis(text); // ファイル読込後に即時分析
    };
    reader.readAsText(file, "utf-8");
  };

  const handleTextChange = (text: string) => {
    onChange({ ...data, text });
    // テキスト手入力はデバウンス3秒
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 100) return;
    debounceRef.current = setTimeout(() => triggerAnalysis(text), 3000);
  };

  // アンマウント時にタイマーをクリア
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const charCount = data.text.length;
  const isLong = charCount > 100000;

  const statusBadge = () => {
    if (!onLineAnalysisComplete || charCount < 100) return null;
    if (lineAnalysisStatus === 'analyzing') return (
      <span className="text-xs bg-blue-50 border border-blue-200 text-blue-600 rounded px-2 py-0.5 flex items-center gap-1">
        <span className="animate-spin border border-blue-400 border-t-transparent rounded-full w-3 h-3 inline-block" />
        LINE分析中...
      </span>
    );
    if (lineAnalysisStatus === 'done') return (
      <span className="text-xs bg-green-50 border border-green-200 text-green-700 rounded px-2 py-0.5">✓ LINE分析完了</span>
    );
    if (lineAnalysisStatus === 'error') return (
      <span className="text-xs bg-red-50 border border-red-200 text-red-600 rounded px-2 py-0.5">分析失敗</span>
    );
    return null;
  };

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
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="LINEのトーク履歴をここに貼り付けてください..."
          rows={12}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex justify-between items-center mt-1 flex-wrap gap-1">
          <span className={`text-xs ${isLong ? "text-amber-600 font-medium" : "text-gray-400"}`}>
            {charCount.toLocaleString()} 文字
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {isLong && (
              <span className="text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded px-2 py-0.5">
                10万字超のため自動抜粋してAIに送信します
              </span>
            )}
            {statusBadge()}
          </div>
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
