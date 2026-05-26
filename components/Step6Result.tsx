"use client";
import { useRef, useState } from "react";
import { GeneratedReport } from "@/types";

interface Props {
  report: GeneratedReport;
  onReset: () => void;
  lineAnalysis?: string | null;
  transcriptionAnalysis?: string | null;
}

const DISCLAIMER =
  "本資料は事実の整理のみを目的としています。法的判断・請求方針・金額等については弁護士にご相談ください。";

function reportToText(report: GeneratedReport): string {
  const timeline = report.timeline
    .map(t => `[${t.date}] ${t.event}（${t.source}）`)
    .join('\n');
  const evidence = report.evidenceList
    .map(e => `・[${e.type}] ${e.description}`)
    .join('\n');
  return `【事案概要】\n${report.rawSummary}\n\n【関係者情報】\n${report.partiesInfo}\n\n【時系列】\n${timeline}\n\n【証拠一覧】\n${evidence}`;
}

export default function Step6Result({ report, onReset, lineAnalysis, transcriptionAnalysis }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const [integratedDoc, setIntegratedDoc] = useState<string | null>(null);
  const [isIntegrating, setIsIntegrating] = useState(false);
  const [integrateError, setIntegrateError] = useState('');

  const hasAnalysis = !!(lineAnalysis && lineAnalysis !== '__error__') ||
                      !!(transcriptionAnalysis && transcriptionAnalysis !== '__error__');

  const handlePrint = async () => {
    // ①②の分析結果がある場合は③統合プロンプトを実行してからPDF出力
    if (hasAnalysis && !integratedDoc) {
      setIsIntegrating(true);
      setIntegrateError('');
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'integrate',
            lineAnalysis: lineAnalysis && lineAnalysis !== '__error__' ? lineAnalysis : '',
            transcriptionAnalysis: transcriptionAnalysis && transcriptionAnalysis !== '__error__' ? transcriptionAnalysis : '',
            reportSummary: reportToText(report),
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || '統合に失敗しました');
        setIntegratedDoc(json.result);
        setIsIntegrating(false);
        setTimeout(() => window.print(), 300);
      } catch (e: unknown) {
        setIntegrateError(e instanceof Error ? e.message : '統合処理に失敗しました');
        setIsIntegrating(false);
      }
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* 操作ボタン（印刷時は非表示） */}
      <div className="no-print flex items-center justify-between border-b pb-2 flex-wrap gap-2">
        <h2 className="text-xl font-bold text-gray-800">STEP 6｜生成結果</h2>
        <div className="flex gap-2 flex-wrap items-center">
          {hasAnalysis && !integratedDoc && (
            <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-2 py-1">
              ✓ LINE・音声分析済み（PDF出力時に統合します）
            </span>
          )}
          <button
            onClick={handlePrint}
            disabled={isIntegrating}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {isIntegrating ? (
              <>
                <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
                統合中...
              </>
            ) : '🖨 印刷・PDFとして保存'}
          </button>
          <button
            onClick={onReset}
            className="border border-gray-300 text-gray-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            最初からやり直す
          </button>
        </div>
      </div>

      {integrateError && (
        <div className="no-print bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {integrateError}
        </div>
      )}

      {/* 印刷対象コンテンツ */}
      <div ref={printRef} className="space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-900 py-2 no-print">証拠整理資料</h1>
        <div className="hidden print:block text-center text-xl font-bold py-2 border-b border-gray-400 mb-4">
          証拠整理資料
        </div>

        <div className="bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-3 text-sm text-yellow-900 font-medium">
          {DISCLAIMER}
        </div>

        {/* ③統合済み資料（PDF出力時）またはデフォルト表示 */}
        {integratedDoc ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {integratedDoc}
          </div>
        ) : (
          <>
            <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="font-bold text-blue-900 text-lg mb-2">事案概要（事実のみ）</h2>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{report.rawSummary}</p>
            </section>

            {report.partiesInfo && (
              <section>
                <h2 className="font-bold text-gray-800 text-lg border-b border-gray-300 pb-1 mb-3">関係者情報</h2>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {report.partiesInfo}
                </div>
              </section>
            )}

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
          </>
        )}

        <div className="bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-3 text-sm text-yellow-900 font-medium">
          {DISCLAIMER}
        </div>
      </div>
    </div>
  );
}
