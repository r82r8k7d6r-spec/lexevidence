import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { FormData as AppFormData } from "@/types";

function extractTopLevelJson(text: string): string | null {
  // コードブロックを除去してから最初の { ～ 最後の } を抽出
  const stripped = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  return stripped.slice(start, end + 1);
}

const AFFAIR_KEYWORDS = [
  "ホテル", "会いたい", "会えた", "会った", "好き", "好きだよ", "愛してる", "愛してるよ", "キス", "抱きしめ",
  "泊まり", "泊まった", "内緒", "秘密", "不倫", "浮気", "バレ", "ばれ",
  "部屋来て", "家来て", "送って", "迎えに", "夜会お", "朝帰り",
  "セックス", "えっち", "体の関係", "関係を持", "手を繋", "デート", "二人で",
  "別れて", "離婚", "嫁", "妻", "旦那", "夫",
];

function extractKeywordContext(lines: string[], contextLines = 5, maxChars = 100000): string {
  const hitIndices = new Set<number>();
  for (let i = 0; i < lines.length; i++) {
    if (AFFAIR_KEYWORDS.some((kw) => lines[i].includes(kw))) {
      for (let j = Math.max(0, i - contextLines); j <= Math.min(lines.length - 1, i + contextLines); j++) {
        hitIndices.add(j);
      }
    }
  }

  if (hitIndices.size === 0) return "";

  const sorted = Array.from(hitIndices).sort((a, b) => a - b);
  const chunks: string[] = [];
  let current: number[] = [];

  for (const idx of sorted) {
    if (current.length === 0 || idx === current[current.length - 1] + 1) {
      current.push(idx);
    } else {
      chunks.push(current.map((i) => lines[i]).join("\n"));
      current = [idx];
    }
  }
  if (current.length > 0) chunks.push(current.map((i) => lines[i]).join("\n"));

  let result = chunks.join("\n...\n");
  if (result.length > maxChars) result = result.slice(0, maxChars);
  return result;
}

function buildLineContent(text: string): string {
  const TOTAL_MAX = 100000;
  if (text.length <= TOTAL_MAX) return text;

  const lines = text.split("\n");

  // 重要キーワード周辺（最大10万字）
  const keywordPart = extractKeywordContext(lines, 5, 100000);

  // 先頭3万字
  const headPart = text.slice(0, 30000);

  // 中間2万字
  const mid = Math.floor(text.length / 2);
  const middlePart = text.slice(mid - 10000, mid + 10000);

  // 末尾2万字
  const tailPart = text.slice(text.length - 20000);

  const sections: string[] = [];
  if (keywordPart) sections.push(`【重要キーワード周辺（優先抽出）】\n${keywordPart}`);
  sections.push(`【先頭部分】\n${headPart}`);
  sections.push(`【中間部分】\n${middlePart}`);
  sections.push(`【末尾部分】\n${tailPart}`);

  return sections.join("\n\n");
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.includes("xxxxxxxxx")) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEYが設定されていません。.env.local に正しいAPIキーを設定してサーバーを再起動してください。" },
      { status: 500 }
    );
  }
  const client = new Anthropic({ apiKey });

  try {
    const body: AppFormData = await req.json();
    const { basicInfo, lineData, screenshots, audioData } = body;

    const lineContent = buildLineContent(lineData.text);

    const systemPrompt = `あなたは証拠整理ツールです。入力された情報から事実のみを整理してください。法的判断・金額・請求の推奨・時効の警告・法律の解説は一切行わないでください。いつ・誰が・何を・どこで・どのように行ったかという事実のみを客観的に記録してください。

必ず有効なJSONのみを返してください。マークダウンのコードブロック（\`\`\`json等）は絶対に使わないでください。{で始まり}で終わる純粋なJSONのみを返してください。

返すJSONの構造：
{
  "timeline": [
    { "date": "YYYY-MM-DD", "event": "いつ・誰が・何をしたかの事実のみ", "source": "証拠種別" }
  ],
  "evidenceList": [
    { "type": "証拠種別", "description": "何が存在するかの記録のみ（法的評価は含めない）" }
  ],
  "partiesInfo": "・申請者：[氏名]（申請者・依頼主）\n・配偶者：[氏名]（[勤務先・年齢等]）\n・不貞相手：[氏名]（[年齢・職業・関係性等]）\n（その他関係者がいれば同様の形式で追記）",
  "rawSummary": "事案の事実のみを客観的に整理した概要（法的判断・評価は含めない）"
}

LINEトークに【重要キーワード周辺（優先抽出）】セクションがある場合は、そのメッセージを特に重視して時系列を作成してください。
timelineは最大15件のみ出力してください。evidenceListは最大8件のみ出力してください。各フィールドの文字数は簡潔に200文字以内にしてください。必ずJSONを最後の}まで完全に出力してください。`;

    const userContent: Anthropic.MessageParam["content"] = [];

    userContent.push({
      type: "text",
      text: `## 依頼者情報
- 申請者氏名: ${basicInfo.applicantName}
- 配偶者氏名: ${basicInfo.opponentName}
- 婚姻日: ${basicInfo.marriageDate}
- 不貞発覚日: ${basicInfo.discoveryDate}
- 不貞相手と配偶者の関係性: ${basicInfo.relationship}
- 補足情報: ${basicInfo.additionalInfo || "なし"}

## 不貞相手の情報
- 氏名: ${basicInfo.affairPartnerName || "不明"}
- 年齢・生年月日: ${basicInfo.affairPartnerAge || "不明"}
- 職業・勤務先: ${basicInfo.affairPartnerOccupation || "不明"}
- 配偶者との出会いのきっかけ: ${basicInfo.affairPartnerMeetingContext || "不明"}
- 不貞関係が始まった時期: ${basicInfo.affairStartPeriod || "不明"}

## LINEトーク内容
${lineContent ? lineContent : "提供なし"}

## 音声文字起こし
${audioData.transcription ? audioData.transcription : "提供なし"}`,
    });

    for (const ss of screenshots) {
      userContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: ss.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
          data: ss.base64,
        },
      });
      userContent.push({
        type: "text",
        text: `上記画像は証拠スクリーンショット「${ss.name}」です。`,
      });
    }

    userContent.push({
      type: "text",
      text: "上記の情報を分析し、事実のみを整理した資料をJSON形式で作成してください。法的判断・金額・請求の推奨・時効・法律の解説は含めないでください。",
    });

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    });

    const rawText = response.content[0].type === "text" ? response.content[0].text : "";

    // ブラケットカウントで最外側の { } を確実に抽出
    const jsonStr = extractTopLevelJson(rawText);
    if (!jsonStr) {
      console.error("JSON抽出失敗。rawText先頭500字:", rawText.slice(0, 500));
      return NextResponse.json(
        { error: `AIの応答からJSONを抽出できませんでした。応答先頭: ${rawText.slice(0, 200)}` },
        { status: 500 }
      );
    }

    let report;
    try {
      report = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("JSONパース失敗:", parseErr, "\n抽出文字列先頭500字:", jsonStr.slice(0, 500));
      return NextResponse.json(
        { error: `JSONパースエラー: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ report });
  } catch (err) {
    console.error(err);
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err !== null
        ? JSON.stringify(err)
        : "不明なエラー";
    return NextResponse.json({ error: `APIエラー: ${message}` }, { status: 500 });
  }
}
