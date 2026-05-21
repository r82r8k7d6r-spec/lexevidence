"use client";
import { useRef } from "react";
import { ScreenshotFile } from "@/types";

interface Props {
  screenshots: ScreenshotFile[];
  onChange: (screenshots: ScreenshotFile[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step3Screenshots({ screenshots, onChange, onNext, onBack }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const promises = files.map(
      (file) =>
        new Promise<ScreenshotFile>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            const base64 = dataUrl.split(",")[1];
            resolve({
              id: `${file.name}-${Date.now()}`,
              name: file.name,
              base64,
              mimeType: file.type,
            });
          };
          reader.readAsDataURL(file);
        })
    );
    Promise.all(promises).then((newFiles) => onChange([...screenshots, ...newFiles]));
    e.target.value = "";
  };

  const remove = (id: string) => onChange(screenshots.filter((s) => s.id !== id));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 border-b pb-2">STEP 3｜スクリーンショット添付</h2>

      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition"
      >
        <div className="text-4xl mb-2">📷</div>
        <p className="text-gray-600 font-medium">クリックして画像を追加</p>
        <p className="text-gray-400 text-sm mt-1">JPG / PNG / WebP 対応・複数選択可</p>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />

      {screenshots.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {screenshots.map((ss) => (
            <div key={ss.id} className="relative group rounded-lg overflow-hidden border border-gray-200">
              <img
                src={`data:${ss.mimeType};base64,${ss.base64}`}
                alt={ss.name}
                className="w-full h-32 object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                <button
                  onClick={() => remove(ss.id)}
                  className="opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold transition"
                >
                  ×
                </button>
              </div>
              <p className="text-xs text-gray-500 px-2 py-1 truncate">{ss.name}</p>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-500">{screenshots.length} 件の画像を選択中</p>

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
