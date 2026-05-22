import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
};

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { fileBase64, fileName, mimeType } = await req.json();

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
