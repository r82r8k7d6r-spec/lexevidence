import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// OpenAI SDK をモック
const mockCreate = vi.hoisted(() => vi.fn());

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(function () {
    return {
      audio: {
        transcriptions: {
          create: mockCreate,
        },
      },
    };
  }),
}));

const { POST } = await import('@/app/api/transcribe/route');

const makeJsonRequest = (body: unknown) =>
  new NextRequest('http://localhost/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const validBase64 = Buffer.from('dummy audio data').toString('base64');

describe('POST /api/transcribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fileBase64が未指定の場合400を返す', async () => {
    const res = await POST(makeJsonRequest({ fileName: 'test.mp3', mimeType: 'audio/mpeg' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeTruthy();
  });

  it('fileNameが未指定の場合400を返す', async () => {
    const res = await POST(makeJsonRequest({ fileBase64: validBase64, mimeType: 'audio/mpeg' }));
    expect(res.status).toBe(400);
  });

  it('mimeTypeが未指定の場合400を返す', async () => {
    const res = await POST(makeJsonRequest({ fileBase64: validBase64, fileName: 'test.mp3' }));
    expect(res.status).toBe(400);
  });

  it('ボディが不正なJSONの場合400を返す', async () => {
    const res = await POST(
      new NextRequest('http://localhost/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      })
    );
    expect(res.status).toBe(400);
  });

  it('正常時に文字起こし結果を返す', async () => {
    mockCreate.mockResolvedValueOnce({ text: '文字起こしテキスト' });

    const res = await POST(makeJsonRequest({
      fileBase64: validBase64,
      fileName: 'test.mp3',
      mimeType: 'audio/mpeg',
    }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.text).toBe('文字起こしテキスト');
  });

  it('OpenAI APIが例外を投げた場合500を返す', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API Error'));

    const res = await POST(makeJsonRequest({
      fileBase64: validBase64,
      fileName: 'test.mp3',
      mimeType: 'audio/mpeg',
    }));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain('API Error');
  });

  it('OpenAI SDKのcreateに正しいパラメータが渡される', async () => {
    mockCreate.mockResolvedValueOnce({ text: 'ok' });

    await POST(makeJsonRequest({
      fileBase64: validBase64,
      fileName: 'audio.mp3',
      mimeType: 'audio/mpeg',
    }));

    expect(mockCreate).toHaveBeenCalledOnce();
    const args = mockCreate.mock.calls[0][0];
    expect(args.model).toBe('whisper-1');
    expect(args.language).toBe('ja');
    expect(args.file).toBeInstanceOf(File);
    expect(args.file.name).toBe('audio.mp3');
    expect(args.file.type).toBe('audio/mpeg');
  });

  it('Base64が正しくBufferに変換されFileに渡される', async () => {
    mockCreate.mockResolvedValueOnce({ text: 'ok' });

    const originalData = 'test audio content';
    const base64 = Buffer.from(originalData).toString('base64');

    await POST(makeJsonRequest({
      fileBase64: base64,
      fileName: 'test.mp3',
      mimeType: 'audio/mpeg',
    }));

    const file: File = mockCreate.mock.calls[0][0].file;
    const arrayBuffer = await file.arrayBuffer();
    const decoded = Buffer.from(arrayBuffer).toString('utf-8');
    expect(decoded).toBe(originalData);
  });
});
