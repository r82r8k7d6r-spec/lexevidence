import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ── プロンプト定義 ──────────────────────────────────────────────

const LINE_SYSTEM = `あなたはテキスト分析の専門家です。
以下のLINEトーク履歴を読み、下記の観点で該当箇所を抽出・整理してください。
【抽出する観点】
1. 曖昧な言い訳・説明のつかない行動（例：帰りが遅い理由、居場所の説明）
2. 特定の人物への言及（名前・呼び方・代名詞）
3. 秘密めいた表現・話題を避けている箇所
4. 感情の急激な変化（冷たくなる・過剰に優しくなるなど）
5. 日時・場所に関する矛盾した発言
6. 削除や話題転換が不自然な箇所
【注意】
客観的に事実のみを抽出し、推測や断定はしないでください。`;

const TRANSCRIPTION_SYSTEM = `あなたは会話分析の専門家です。
以下は文字起こしされたベタ書きのテキストです。
【やること】
1. 文脈から話者を推定し、「話者A」「話者B」「話者C」のように分けてください
2. 発言ごとに話者を明記して整理してください
3. 聞き取れていない・意味が不明な箇所は【不明】と記載してください
【出力形式】
話者A：〜〜〜
話者B：〜〜〜
【注意】
- 推測で話者を断定せず、文脈から自然に判断してください
- 相槌・短い返答も省略せず残してください`;

function buildIntegrateSystem(
  lineAnalysis: string,
  transcriptionAnalysis: string,
  reportSummary: string,
): string {
  return `あなたは法的資料の整形専門家です。
以下の3つの素材を一つの証拠整理資料としてまとめてください。
【素材1：LINE抽出結果】
${lineAnalysis || '（LINE分析データなし）'}
【素材2：録音文字起こし】
${transcriptionAnalysis || '（音声文字起こしデータなし）'}
【素材3：証拠整理資料】
${reportSummary}
【出力形式】
# 証拠整理資料
## 1. 事案概要
## 2. 関係者情報
## 3. LINE記録による証拠
## 4. 録音記録による証拠
## 5. 証拠一覧まとめ
【ルール】
- 事実のみを記載し、推測・断定は書かない
- 日時は必ず明記する
- 話者・発言者を明確にする
- 法的判断・金額等には触れない
- 見出しは大きく、段落は短く読みやすくする`;
}

// ── ハンドラー ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'API Key が設定されていません' }, { status: 500 });

    const body = await req.json();
    const { type, content, lineAnalysis, transcriptionAnalysis, reportSummary } = body as {
      type: 'line' | 'transcription' | 'integrate';
      content?: string;
      lineAnalysis?: string;
      transcriptionAnalysis?: string;
      reportSummary?: string;
    };

    const client = new Anthropic({ apiKey });
    let systemPrompt: string;
    let userContent: string;

    if (type === 'line') {
      if (!content) return NextResponse.json({ error: 'content は必須です' }, { status: 400 });
      systemPrompt = LINE_SYSTEM;
      // 長大テキストは先頭30,000字に制限（分析精度を優先）
      userContent = content.slice(0, 30000);
    } else if (type === 'transcription') {
      if (!content) return NextResponse.json({ error: 'content は必須です' }, { status: 400 });
      systemPrompt = TRANSCRIPTION_SYSTEM;
      userContent = content.slice(0, 20000);
    } else if (type === 'integrate') {
      systemPrompt = buildIntegrateSystem(
        lineAnalysis ?? '',
        transcriptionAnalysis ?? '',
        reportSummary ?? '',
      );
      userContent = '上記の素材を統合した証拠整理資料を作成してください。';
    } else {
      return NextResponse.json({ error: '不正なtype です' }, { status: 400 });
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    });

    const result = response.content[0].type === 'text' ? response.content[0].text : '';
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Analyze error:', error);
    const msg = error instanceof Error ? error.message : '不明なエラー';
    return NextResponse.json({ error: `分析に失敗しました: ${msg}` }, { status: 500 });
  }
}
