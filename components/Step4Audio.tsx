"use client";
import { useRef, useState } from "react";
import { AudioData } from "@/types";

interface Props {
  data: AudioData;
  onChange: (data: AudioData) => void;
  onNext: () => void;
  onBack: () => void;
}

const SAMPLE_RATE = 16000;
const CHUNK_SECONDS = 90; // 90秒 × 16kHz × 2byte = ~2.75MB/chunk
const MAX_DIRECT_BYTES = 4 * 1024 * 1024; // 4MB 以下はそのまま送信

function samplesToWav(samples: Int16Array, sampleRate: number): Blob {
  const buf = new ArrayBuffer(44 + samples.byteLength);
  const v = new DataView(buf);
  const w = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i));
  };
  w(0, "RIFF"); v.setUint32(4, 36 + samples.byteLength, true);
  w(8, "WAVE"); w(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, "data"); v.setUint32(40, samples.byteLength, true);
  new Int16Array(buf, 44).set(samples);
  return new Blob([buf], { type: "audio/wav" });
}

async function decodeToMono16k(file: File): Promise<Int16Array> {
  const audioCtx = new AudioContext();
  const decoded = await audioCtx.decodeAudioData(await file.arrayBuffer());
  await audioCtx.close();

  const numSamples = Math.ceil(decoded.duration * SAMPLE_RATE);
  const offline = new OfflineAudioContext(1, numSamples, SAMPLE_RATE);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start(0);
  const rendered = await offline.startRendering();

  const raw = rendered.getChannelData(0);
  const out = new Int16Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    const s = Math.max(-1, Math.min(1, raw[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return out;
}

async function transcribeBlob(blob: Blob, name: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", new File([blob], name, { type: blob.type }));
  const res = await fetch("/api/transcribe", { method: "POST", body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "文字起こし失敗");
  return json.text as string;
}

export default function Step4Audio({ data, onChange, onNext, onBack }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeStatus, setTranscribeStatus] = useState("");
  const [transcribeError, setTranscribeError] = useState("");

  const fileNames: string[] = data.fileName ? data.fileName.split("|||") : [];

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    e.target.value = "";

    const names = files.map((f) => f.name).join("|||");
    onChange({ ...data, fileName: names });
    setIsTranscribing(true);
    setTranscribeError("");

    const results: string[] = [];

    for (const file of files) {
      try {
        // 4MB 以下はそのまま送信
        if (file.size <= MAX_DIRECT_BYTES) {
          setTranscribeStatus(`文字起こし中: ${file.name}`);
          const text = await transcribeBlob(file, file.name);
          results.push(files.length > 1 ? `【${file.name}】\n${text}` : text);
          continue;
        }

        // 4MB 超: 16kHz モノラルに圧縮してチャンク分割
        setTranscribeStatus(`圧縮中: ${file.name}`);
        const samples = await decodeToMono16k(file);
        const chunkSize = SAMPLE_RATE * CHUNK_SECONDS;
        const numChunks = Math.ceil(samples.length / chunkSize);
        const chunkTexts: string[] = [];

        for (let i = 0; i < numChunks; i++) {
          setTranscribeStatus(
            `文字起こし中: ${file.name}（${i + 1} / ${numChunks}）`
          );
          const chunk = samples.slice(i * chunkSize, (i + 1) * chunkSize);
          const wav = samplesToWav(chunk, SAMPLE_RATE);
          chunkTexts.push(await transcribeBlob(wav, `chunk_${i}.wav`));
        }

        const combined = chunkTexts.join(" ");
        results.push(files.length > 1 ? `【${file.name}】\n${combined}` : combined);
      } catch (err) {
        setTranscribeError(
          err instanceof Error ? err.message : "文字起こしに失敗しました"
        );
      }
    }

    if (results.length > 0) {
      onChange({ fileName: names, transcription: results.join("\n\n") });
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
                アップロード後、自動で文字起こしします
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
        <p className="text-xs text-gray-400 mt-1">
          ※ 大きなファイルは自動的に圧縮・分割して処理します
        </p>

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
