import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import Busboy from "busboy";
import { Readable } from "stream";

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB

// req.formData() を使わず busboy でストリームを直接パース
function extractFileFromRequest(req: NextRequest): Promise<File | null> {
  return new Promise((resolve, reject) => {
    const contentType = req.headers.get("content-type") ?? "";

    const bb = Busboy({
      headers: { "content-type": contentType },
      limits: { fileSize: MAX_FILE_BYTES },
    });

    let resolved = false;
    const settle = (value: File | null) => {
      if (!resolved) { resolved = true; resolve(value); }
    };

    bb.on("file", (_name, stream, info) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
      stream.on("end", () =>
        settle(new File([Buffer.concat(chunks)], info.filename || "audio", {
          type: info.mimeType || "audio/mpeg",
        }))
      );
      stream.on("error", reject);
    });

    bb.on("finish", () => settle(null));
    bb.on("error", reject);

    if (!req.body) { resolve(null); return; }

    // Web Streams API → Node.js Readable に変換してパイプ
    const reader = req.body.getReader();
    const readable = new Readable({
      async read() {
        try {
          const { done, value } = await reader.read();
          done ? this.push(null) : this.push(Buffer.from(value));
        } catch (e) {
          this.destroy(e as Error);
        }
      },
    });
    readable.pipe(bb);
  });
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "ファイルがありません" }, { status: 400 });
  }

  try {
    const file = await extractFileFromRequest(req);

    if (!file) {
      return NextResponse.json({ error: "ファイルがありません" }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
