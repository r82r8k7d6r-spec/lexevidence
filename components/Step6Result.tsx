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

// 関係者情報を箇条書きとしてレンダリング
function PartiesInfo({ text }: { text: string }) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  return (
    <ul className="space-y-2">
      {lines.map((line, i) => {
        const normalized = line.startsWith('・') ? line : `・${line}`;
        const colonIdx = normalized.indexOf('：');
        if (colonIdx > 0) {
          const label = normalized.slice(0, colonIdx + 1);
          const content = normalized.slice(colonIdx + 1).trim();
          return (
            <li key={i} className="flex gap-2 text-sm leading-relaxed">
              <span className="font-semibold text-gray-900 whitespace-nowrap shrink-0">{label}</span>
              <span className="text-gray-700">{content}</span>
            </li>
          );
        }
        return (
          <li key={i} className="text-sm text-gray-700 leading-relaxed">{normalized}</li>
        );
      })}
    </ul>
  );
}

// integratedDoc のマークダウン風テキストを HTML に変換
function IntegratedDoc({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = (key: string) => {
    if (listBuffer.length === 0) return;
    elements.push(
      <ul key={key} className="space-y-1 ml-2 mb-3">
        {listBuffer.map((item, j) => (
          <li key={j} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
            <span className="shrink-0 text-gray-400">・</span>
            <span>{item.replace(/^[・\-]\s*/, '')}</span>
          </li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  lines.forEach((line, i) => {
    const isBullet = /^[・\-]\s/.test(line) || line.startsWith('・');
    if (isBullet) {
      listBuffer.push(line);
      return;
    }
    flushList(`list-${i}`);

    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-xl font-bold text-gray-900 mt-6 mb-3 pb-2 border-b-2 border-gray-400 print:mt-4">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-base font-bold text-gray-800 mt-5 mb-2 pb-1 border-b border-gray-300 print:mt-3">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-sm font-semibold text-gray-800 mt-4 mb-1">
          {line.slice(4)}
        </h3>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-sm text-gray-700 leading-relaxed mb-1">{line}</p>
      );
    }
  });
  flushList('list-end');

  return <div className="space-y-0">{elements}</div>;
}

export default function Step6Result({ report, onReset, lineAnalysis, transcriptionAnalysis }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const [integratedDoc, setIntegratedDoc] = useState<string | null>(null);
  const [isIntegrating, setIsIntegrating] = useState(false);
  const [integrateError, setIntegrateError] = useState('');

  const hasAnalysis = !!(lineAnalysis && lineAnalysis !== '__error__') ||
                      !!(transcriptionAnalysis && transcriptionAnalysis !== '__error__');

  const handlePrint = async () => {
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
      <div ref={printRef} className="space-y-6 print-content">
        <h1 className="text-2xl font-bold text-center text-gray-900 py-2 no-print">証拠整理資料</h1>
        <div className="hidden print:block text-center text-xl font-bold py-3 border-b-2 border-gray-600 mb-6">
          証拠整理資料
        </div>

        <div className="bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-3 text-sm text-yellow-900 font-medium">
          {DISCLAIMER}
        </div>

        {/* ③統合済み資料（PDF出力時）*/}
        {integratedDoc ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <IntegratedDoc text={integratedDoc} />
          </div>
        ) : (
          <>
            {/* 事案概要 */}
            <section className="bg-blue-50 border border-blue-200 rounded-lg p-4 break-inside-avoid">
              <h2 className="font-bold text-blue-900 text-lg mb-2">事案概要（事実のみ）</h2>
              <p className="text-gray-700 text-sm leading-loose whitespace-pre-wrap">{report.rawSummary}</p>
            </section>

            {/* 関係者情報 */}
            {report.partiesInfo && (
              <section className="break-inside-avoid">
                <h2 className="font-bold text-gray-800 text-lg border-b-2 border-gray-300 pb-1 mb-3">
                  関係者情報
                </h2>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <PartiesInfo text={report.partiesInfo} />
                </div>
              </section>
            )}

            {/* 時系列 */}
            <section className="break-inside-avoid">
              <h2 className="font-bold text-gray-800 text-lg border-b-2 border-gray-300 pb-1 mb-3">
                時系列（事実記録）
              </h2>
              <div className="space-y-2">
                {report.timeline.map((item, i) => (
                  <div key={i} className="flex gap-3 border border-gray-200 rounded-lg px-4 py-3 bg-white break-inside-avoid">
                    <div className="shrink-0 text-xs font-mono text-gray-500 pt-0.5 w-24">{item.date}</div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 leading-relaxed">{item.event}</p>
                    </div>
                    <div className="shrink-0">
                      <span className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5 whitespace-nowrap">{item.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 証拠一覧 */}
            <section>
              <h2 className="font-bold text-gray-800 text-lg border-b-2 border-gray-300 pb-1 mb-3">
                証拠一覧（存在記録）
              </h2>
              <div className="space-y-3">
                {report.evidenceList.map((ev, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 break-inside-avoid">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-white bg-blue-600 px-2.5 py-1 rounded">{i + 1}</span>
                      <span className="text-sm font-semibold text-gray-800">{ev.type}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed pl-1">{ev.description}</p>
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
