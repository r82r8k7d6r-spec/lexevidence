"use client";
import { useRef } from "react";
import { GeneratedReport } from "@/types";

interface Props {
  report: GeneratedReport;
  onReset: () => void;
}

const DISCLAIMER =
  "本資料は事実の整理のみを目的としています。法的判断・請求方針・金額等については弁護士にご相談ください。";

export default function Step6Result({ report, onReset }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      {/* 操作ボタン（印刷時は非表示） */}
      <div className="no-print flex items-center justify-between border-b pb-2 flex-wrap gap-2">
        <h2 className="text-xl font-bold text-gray-800">STEP 6｜生成結果</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            🖨 印刷・PDFとして保存
          </button>
          <button
            onClick={onReset}
            className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            最初からやり直す
          </button>
        </div>
      </div>

      {/* 印刷対象コンテンツ */}
      <div ref={printRef} className="space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-900 py-2 no-print">証拠整理資料</h1>
        {/* 印刷時専用タイトル */}
        <div className="hidden print:block text-center text-xl font-bold py-2 border-b border-gray-400 mb-4">
          証拠整理資料
        </div>

        {/* 免責文言（冒頭） */}
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-3 text-sm text-yellow-900 font-medium">
          {DISCLAIMER}
        </div>

        {/* 事案概要 */}
        <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="font-bold text-blue-900 text-lg mb-2">事案概要（事実のみ）</h2>
          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{report.rawSummary}</p>
        </section>

        {/* 関係者情報 */}
        {report.partiesInfo && (
          <section>
            <h2 className="font-bold text-gray-800 text-lg border-b border-gray-300 pb-1 mb-3">関係者情報</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {report.partiesInfo}
            </div>
          </section>
        )}

        {/* 時系列 */}
        <section>
          <h2 className="font-bold text-gray-800 text-lg border-b border-gray-300 pb-1 mb-3">時系列（事実記録）</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-700 w-32">日付</th>
                  <th className="px-3 py-2 text-left text-gray-700">出来事</th>
                  <th className="px-3 py-2 text-left text-gray-700 w-32">証拠種別</th>
                </tr>
              </thead>
              <tbody>
                {report.timeline.map((item, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{item.date}</td>
                    <td className="px-3 py-2 text-gray-800">{item.event}</td>
                    <td className="px-3 py-2 text-gray-500 text-xs">{item.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 証拠一覧 */}
        <section>
          <h2 className="font-bold text-gray-800 text-lg border-b border-gray-300 pb-1 mb-3">証拠一覧（存在記録）</h2>
          <div className="space-y-2">
            {report.evidenceList.map((ev, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">{ev.type}</span>
                </div>
                <p className="text-gray-700">{ev.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 免責文言（末尾） */}
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-3 text-sm text-yellow-900 font-medium">
          {DISCLAIMER}
        </div>
      </div>
    </div>
  );
}
