import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Next.js の組み込みパーサーをバイパスしてボディをストリームで直接読む
async function readBodyAsText(req: NextRequest): Promise<string> {
  const reader = req.body?.getReader();
  if (!reader) return "";

  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(merged);
}

export async function POST(req: NextRequest) {
  try {
    const bodyText = await readBodyAsText(req);

    let fileBase64: string, fileName: string, mimeType: string;
    try {
      ({ fileBase64, fileName, mimeType } = JSON.parse(bodyText));
    } catch {
      return NextResponse.json({ error: "リクエストのパースに失敗しました" }, { status: 400 });
    }

    if (!fileBase64 || !fileName || !mimeType) {
      return NextResponse.json({ error: "fileBase64・fileName・mimeTypeは必須です" }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const buffer = Buffer.from(fileBase64, "base64");
    const file = new File([buffer], fileName, { type: mimeType });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "ja",
    });

    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    console.error("Transcribe error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `文字起こしに失敗しました: ${message}` }, { status: 500 });
  }
}
