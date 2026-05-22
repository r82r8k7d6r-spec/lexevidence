import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// fetch をモック
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// dynamic import で route を取得（globalのfetchをモック後に読み込む）
const { POST } = await import('@/app/api/transcribe/route');

const makeRequest = (body: unknown) =>
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
    const res = await POST(makeRequest({ fileName: 'test.mp3', mimeType: 'audio/mpeg' }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeTruthy();
  });

  it('fileNameが未指定の場合400を返す', async () => {
    const res = await POST(makeRequest({ fileBase64: validBase64, mimeType: 'audio/mpeg' }));
    expect(res.status).toBe(400);
  });

  it('mimeTypeが未指定の場合400を返す', async () => {
    const res = await POST(makeRequest({ fileBase64: validBase64, fileName: 'test.mp3' }));
    expect(res.status).toBe(400);
  });

  it('正常時に文字起こし結果を返す', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: '文字起こしテキスト' }),
    });

    const res = await POST(makeRequest({
      fileBase64: validBase64,
      fileName: 'test.mp3',
      mimeType: 'audio/mpeg',
    }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.text).toBe('文字起こしテキスト');
  });

  it('OpenAI APIがエラーを返した場合エラーレスポンスを返す', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: 'Invalid file format' } }),
    });

    const res = await POST(makeRequest({
      fileBase64: validBase64,
      fileName: 'test.mp3',
      mimeType: 'audio/mpeg',
    }));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Invalid file format');
  });

  it('fetchが例外を投げた場合500を返す', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const res = await POST(makeRequest({
      fileBase64: validBase64,
      fileName: 'test.mp3',
      mimeType: 'audio/mpeg',
    }));

    expect(res.status).toBe(500);
  });

  it('OpenAI APIにBase64をBufferに変換して送信している', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: 'ok' }),
    });

    await POST(makeRequest({
      fileBase64: validBase64,
      fileName: 'audio.mp3',
      mimeType: 'audio/mpeg',
    }));

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/audio/transcriptions');
    expect(options.method).toBe('POST');
    expect(options.body).toBeInstanceOf(FormData);
  });
});
