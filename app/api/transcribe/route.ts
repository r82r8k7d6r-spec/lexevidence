import { NextRequest, NextResponse } from "next/server";

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

    const buffer = Buffer.from(fileBase64, "base64");
    const blob = new Blob([buffer], { type: mimeType });

    const openaiFormData = new FormData();
    openaiFormData.append("file", blob, fileName);
    openaiFormData.append("model", "whisper-1");
    openaiFormData.append("language", "ja");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: openaiFormData,
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || "文字起こし失敗" }, { status: response.status });
    }
    return NextResponse.json({ text: data.text });
  } catch (error) {
    return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
  }
}
