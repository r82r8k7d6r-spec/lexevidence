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

// ── LINE解析：Gemini 1.5 Pro（REST API 直接呼び出し・SDK 不使用）──

async function analyzeWithGemini(systemPrompt: string, userContent: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY が環境変数に設定されていません');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      { role: 'user', parts: [{ text: userContent }] },
    ],
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
    generationConfig: {
      maxOutputTokens: 4096,
      temperature: 0.2,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '(レスポンス取得失敗)');
    throw new Error(`Gemini API エラー ${res.status}: ${errText.slice(0, 300)}`);
  }

  const json = await res.json() as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
    promptFeedback?: { blockReason?: string };
  };

  const candidate = json.candidates?.[0];
  if (!candidate) {
    const reason = json.promptFeedback?.blockReason ?? 'UNKNOWN';
    throw new Error(`Gemini がコンテンツをブロックしました（理由: ${reason}）`);
  }
  if (candidate.finishReason === 'SAFETY') {
    throw new Error('Gemini がセーフティフィルターによりブロックしました');
  }

  const text = candidate.content?.parts?.[0]?.text ?? '';
  if (!text) throw new Error('Gemini が空のレスポンスを返しました');
  return text;
}

// ── 音声・統合：Claude ────────────────────────────────────────

async function analyzeWithClaude(systemPrompt: string, userContent: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY が設定されていません');

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

// ── ハンドラー ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

    const body = await req.json();
    const { type, content, lineAnalysis, transcriptionAnalysis, reportSummary } = body as {
      type: 'line' | 'transcription' | 'integrate';
      content?: string;
      lineAnalysis?: string;
      transcriptionAnalysis?: string;
      reportSummary?: string;
    };

    let result: string;

    if (type === 'line') {
      if (!content) return NextResponse.json({ error: 'content は必須です' }, { status: 400 });
      const userContent = content.slice(0, 30000);

      // Gemini REST API で解析。失敗時は Claude にフォールバック
      try {
        result = await analyzeWithGemini(LINE_SYSTEM, userContent);
        console.log('Gemini LINE解析成功');
      } catch (geminiErr) {
        const geminiMsg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
        console.warn('Gemini LINE解析失敗→Claudeにフォールバック:', geminiMsg);
        result = await analyzeWithClaude(LINE_SYSTEM, userContent);
        console.log('Claude フォールバック成功');
      }

    } else if (type === 'transcription') {
      if (!content) return NextResponse.json({ error: 'content は必須です' }, { status: 400 });
      result = await analyzeWithClaude(TRANSCRIPTION_SYSTEM, content.slice(0, 20000));

    } else if (type === 'integrate') {
      const systemPrompt = buildIntegrateSystem(
        lineAnalysis ?? '',
        transcriptionAnalysis ?? '',
        reportSummary ?? '',
      );
      result = await analyzeWithClaude(systemPrompt, '上記の素材を統合した証拠整理資料を作成してください。');

    } else {
      return NextResponse.json({ error: '不正なtype です' }, { status: 400 });
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Analyze error:', error);
    const msg = error instanceof Error ? error.message : '不明なエラー';
    return NextResponse.json({ error: `分析に失敗しました: ${msg}` }, { status: 500 });
  }
}
