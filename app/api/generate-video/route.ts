import { NextRequest, NextResponse } from "next/server";
import { GeneratedReport } from "@/types";

export type VideoPattern = 'emotional' | 'testimonial' | 'beforeafter' | 'ai' | 'consultation';

function getTemplateId(pattern: VideoPattern): string {
  const envMap: Record<VideoPattern, string | undefined> = {
    emotional:    process.env.CREATOMATE_TEMPLATE_EMOTIONAL,
    testimonial:  process.env.CREATOMATE_TEMPLATE_TESTIMONIAL,
    beforeafter:  process.env.CREATOMATE_TEMPLATE_BEFOREAFTER,
    ai:           process.env.CREATOMATE_TEMPLATE_AI,
    consultation: process.env.CREATOMATE_TEMPLATE_CONSULTATION,
  };
  return envMap[pattern] ?? '';
}

// Creatomate テンプレート内の要素名と動的データのマッピング。
// テンプレート作成時に以下のキーをテキスト要素の Name として設定すること。
function buildModifications(pattern: VideoPattern, report: GeneratedReport): Record<string, string> {
  const evidenceCount = report.evidenceList?.length ?? 0;
  const timelineCount = report.timeline?.length ?? 0;
  const firstDate = report.timeline?.[0]?.date ?? '';
  const lastDate = report.timeline?.[timelineCount - 1]?.date ?? '';
  const dateRange = firstDate && lastDate ? `${firstDate} 〜 ${lastDate}` : '';

  const common = {
    service_name: 'マモリAI',
    cta_text: 'プロフのリンクから試してみて',
  };

  switch (pattern) {
    case 'emotional':
      return {
        ...common,
        hook_text: 'その証拠、一人で抱えてる？',
        evidence_count: `${evidenceCount}件の証拠を整理`,
        timeline_range: dateRange,
        body_text: 'LINEスクショをAIに読み込ませるだけ',
        result_text: '弁護士相談用PDFを自動生成',
      };
    case 'testimonial':
      return {
        ...common,
        hook_text: '弁護士に「もっと早く来てくれれば」と言われた',
        time_text: '10分で整理完了',
        evidence_count: `${evidenceCount}件の証拠`,
        timeline_count: `${timelineCount}件の時系列`,
        body_text: 'スクショを送るだけで自動整理',
      };
    case 'beforeafter':
      return {
        ...common,
        hook_text: 'これ、同じ人の証拠です',
        before_text: 'スクショがバラバラ　何がいつのものかも不明',
        after_text: `時系列${timelineCount}件・証拠${evidenceCount}件　自動整理完了`,
        time_text: '最短10分',
        body_text: 'スクショを選んで送るだけ',
      };
    case 'ai':
      return {
        ...common,
        hook_text: 'え、これAIができるの？',
        feature_1: 'LINE解析',
        feature_2: '時系列整理',
        feature_3: '証拠一覧生成',
        feature_4: 'PDF自動生成',
        evidence_count: `${evidenceCount}件の証拠を自動抽出`,
        body_text: '弁護士用書類が10分で出てきた',
      };
    case 'consultation':
      return {
        ...common,
        hook_text: '弁護士相談、ちゃんと準備できてますか？',
        warning_text: '初回相談：30〜60分　相談料：約1万円',
        evidence_count: `${evidenceCount}件の証拠を整理済み`,
        body_text: 'LINE・スクショをAIが自動整理',
        result_text: '証拠一覧・時系列まで揃えて相談へ',
      };
  }
}

// POST: レンダーリクエストを作成して renderId を返す
export async function POST(req: NextRequest) {
  const apiKey = process.env.CREATOMATE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'CREATOMATE_API_KEY が設定されていません。.env.local に追加してください。' },
      { status: 500 }
    );
  }

  let body: { report: GeneratedReport; pattern?: VideoPattern };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'リクエストの解析に失敗しました' }, { status: 400 });
  }

  const { report, pattern = 'emotional' } = body;
  const templateId = getTemplateId(pattern);

  if (!templateId) {
    return NextResponse.json(
      { error: `パターン「${pattern}」のCreatomateテンプレートIDが未設定です。CREATOMATE_TEMPLATE_${pattern.toUpperCase()} を .env.local に追加してください。` },
      { status: 500 }
    );
  }

  const modifications = buildModifications(pattern, report);

  try {
    const res = await fetch('https://api.creatomate.com/v1/renders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ template_id: templateId, modifications }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Creatomate APIエラー (${res.status}): ${errText}` },
        { status: res.status }
      );
    }

    const renders = await res.json();
    const render = Array.isArray(renders) ? renders[0] : renders;

    return NextResponse.json({
      renderId: render.id,
      status: render.status,
      url: render.url ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '不明なエラー';
    return NextResponse.json({ error: `ネットワークエラー: ${message}` }, { status: 500 });
  }
}

// GET: renderId でレンダー状態をポーリング
export async function GET(req: NextRequest) {
  const apiKey = process.env.CREATOMATE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'CREATOMATE_API_KEY が設定されていません' }, { status: 500 });
  }

  const renderId = req.nextUrl.searchParams.get('id');
  if (!renderId) {
    return NextResponse.json({ error: 'id パラメータが必要です' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.creatomate.com/v1/renders/${renderId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Creatomate APIエラー (${res.status}): ${errText}` },
        { status: res.status }
      );
    }

    const render = await res.json();
    return NextResponse.json({
      renderId: render.id,
      status: render.status,
      url: render.url ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '不明なエラー';
    return NextResponse.json({ error: `ネットワークエラー: ${message}` }, { status: 500 });
  }
}
