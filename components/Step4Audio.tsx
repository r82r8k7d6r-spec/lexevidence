"use client";
import { useRef, useState } from "react";
import { AudioData } from "@/types";

interface Props {
  data: AudioData;
  onChange: (data: AudioData) => void;
  onNext: () => void;
  onBack: () => void;
  onTranscriptionAnalysisComplete?: (result: string) => void;
  transcriptionAnalysisStatus?: 'idle' | 'analyzing' | 'done' | 'error';
}

const MAX_TOTAL_BYTES = 100 * 1024 * 1024;  // 合計100MB
const MAX_FILE_BYTES  =  25 * 1024 * 1024;  // 1ファイル25MB（Whisper上限）

async function transcribeBlob(file: File): Promise<string> {
  const fileBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const res = await fetch("/api/transcribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileBase64, fileName: file.name, mimeType: file.type }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "文字起こし失敗");
  return json.text as string;
}

export default function Step4Audio({
  data, onChange, onNext, onBack,
  onTranscriptionAnalysisComplete, transcriptionAnalysisStatus = 'idle',
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeStatus, setTranscribeStatus] = useState("");
  const [transcribeError, setTranscribeError] = useState("");

  const fileNames: string[] = data.fileName ? data.fileName.split("|||") : [];

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = "";
    setTranscribeError("");

    // 1ファイル25MB超チェック
    const tooLarge = files.filter((f) => f.size > MAX_FILE_BYTES);
    if (tooLarge.length > 0) {
      setTranscribeError(
        `1ファイルあたり25MBまでです。以下のファイルは送信できません:\n` +
        tooLarge.map((f) => `・${f.name}（${(f.size / 1024 / 1024).toFixed(1)}MB）`).join("\n")
      );
      return;
    }

    // 合計100MB超チェック
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_TOTAL_BYTES) {
      setTranscribeError(
        `合計ファイルサイズが100MBを超えています（${(totalSize / 1024 / 1024).toFixed(1)}MB）。ファイルを減らしてください。`
      );
      return;
    }

    const names = files.map((f) => f.name).join("|||");
    onChange({ ...data, fileName: names });

    setIsTranscribing(true);
    const results: string[] = [];

    for (const file of files) {
      try {
        setTranscribeStatus(`文字起こし中: ${file.name}`);
        const text = await transcribeBlob(file);
        results.push(files.length > 1 ? `【${file.name}】\n${text}` : text);
      } catch (err) {
        setTranscribeError(err instanceof Error ? err.message : "文字起こしに失敗しました");
      }
    }

    if (results.length > 0) {
      const fullTranscription = results.join("\n\n");
      onChange({ fileName: names, transcription: fullTranscription });

      // ② 話者分離分析をバックグラウンドで実行
      if (onTranscriptionAnalysisComplete && fullTranscription.length >= 50) {
        onTranscriptionAnalysisComplete('__analyzing__');
        fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'transcription', content: fullTranscription }),
        })
          .then(r => r.json())
          .then(json => onTranscriptionAnalysisComplete(json.result ?? '__error__'))
          .catch(() => onTranscriptionAnalysisComplete('__error__'));
      }
    }
    setIsTranscribing(false);
    setTranscribeStatus("");
  };

  const removeFile = (index: number) => {
    const updated = fileNames.filter((_, i) => i !== index).join("|||");
    onChange({ ...data, fileName: updated || undefined });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 border-b pb-2">STEP 4｜音声データ</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          音声ファイル（任意・複数選択可）
        </label>
        <div
          onClick={() => !isTranscribing && fileRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition ${
            isTranscribing
              ? "border-blue-300 bg-blue-50 cursor-wait"
              : "border-gray-300 cursor-pointer hover:border-blue-400"
          }`}
        >
          {isTranscribing ? (
            <div className="flex flex-col items-center gap-2">
              <span className="animate-spin border-4 border-blue-500 border-t-transparent rounded-full w-8 h-8 inline-block" />
              <p className="text-blue-600 font-medium text-sm">
                {transcribeStatus || "処理中..."}
              </p>
              <p className="text-blue-400 text-xs">しばらくお待ちください</p>
            </div>
          ) : (
            <>
              <div className="text-3xl mb-2">🎙️</div>
              <p className="text-gray-500 text-sm">
                クリックしてMP3 / M4A / WAV などを選択（複数可）
              </p>
              <p className="text-gray-400 text-xs mt-1">
                1ファイルあたり25MBまで・合計100MBまで
              </p>
            </>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*,.mp3,.m4a,.wav,.mp4,.webm"
          multiple
          className="hidden"
          onChange={handleFiles}
        />
        <div className="flex items-center justify-between mt-1 flex-wrap gap-1">
          <p className="text-xs text-gray-400">
            ※ 25MB超・合計100MB超のファイルはアップロード不可。
          </p>
          {transcriptionAnalysisStatus === 'analyzing' && (
            <span className="text-xs bg-blue-50 border border-blue-200 text-blue-600 rounded px-2 py-0.5 flex items-center gap-1">
              <span className="animate-spin border border-blue-400 border-t-transparent rounded-full w-3 h-3 inline-block" />
              話者分析中...
            </span>
          )}
          {transcriptionAnalysisStatus === 'done' && (
            <span className="text-xs bg-green-50 border border-green-200 text-green-700 rounded px-2 py-0.5">✓ 話者分析完了</span>
          )}
        </div>

        {transcribeError && (
          <div className="mt-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs whitespace-pre-wrap">
            {transcribeError}
          </div>
        )}

        {fileNames.length > 0 && (
          <ul className="mt-2 space-y-1">
            {fileNames.map((name, i) => (
              <li
                key={i}
                className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 text-sm"
              >
                <span className="text-blue-700 truncate">🎵 {name}</span>
                <button
                  onClick={() => removeFile(i)}
                  className="text-red-400 hover:text-red-600 ml-2 font-bold shrink-0"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          文字起こしテキスト
          <span className="text-gray-400 font-normal ml-1">（自動入力・手動編集も可）</span>
        </label>
        <textarea
          value={data.transcription}
          onChange={(e) => onChange({ ...data, transcription: e.target.value })}
          placeholder="音声ファイルをアップロードすると自動で文字起こしされます。手動で入力・貼り付けも可能です。"
          rows={8}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          disabled={isTranscribing}
          className="text-gray-600 px-6 py-2 rounded-lg border hover:bg-gray-50 transition disabled:opacity-40"
        >
          ← 戻る
        </button>
        <button
          onClick={onNext}
          disabled={isTranscribing}
          className="bg-blue-600 text-white px-8 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-40"
        >
          次へ →
        </button>
      </div>
    </div>
  );
}
