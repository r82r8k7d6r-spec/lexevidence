import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "30mb",
    },
  },
};

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB (Whisper API上限)

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEYが設定されていません" }, { status: 500 });
  }

  const openai = new OpenAI({ apiKey });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "音声ファイルが見つかりません" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `ファイルサイズが25MBを超えています（${(file.size / 1024 / 1024).toFixed(1)}MB）。ファイルを分割するか、より短い録音を使用してください。` },
        { status: 413 }
      );
    }

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "ja",
    });

    return NextResponse.json({ text: transcription.text });
  } catch (err) {
    console.error("Whisper API error:", err);
    const message = err instanceof Error ? err.message : "不明なエラー";
    return NextResponse.json({ error: `文字起こしエラー: ${message}` }, { status: 500 });
  }
}
