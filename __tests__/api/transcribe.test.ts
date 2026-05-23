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

// FormData リクエストを作成するヘルパー
const makeFormRequest = (file?: File) => {
  const fd = new FormData();
  if (file) fd.append('file', file);
  return new NextRequest('http://localhost/api/transcribe', {
    method: 'POST',
    body: fd,
  });
};

const validFile = new File(
  [Buffer.from('dummy audio data')],
  'test.mp3',
  { type: 'audio/mpeg' }
);

describe('POST /api/transcribe (busboy multipart)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fileが添付されていない場合400を返す', async () => {
    const fd = new FormData();
    const req = new NextRequest('http://localhost/api/transcribe', {
      method: 'POST',
      body: fd,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeTruthy();
  });

  it('正常時に文字起こし結果を返す', async () => {
    mockCreate.mockResolvedValueOnce({ text: '文字起こしテキスト' });

    const res = await POST(makeFormRequest(validFile));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.text).toBe('文字起こしテキスト');
  });

  it('OpenAI APIが例外を投げた場合500を返す', async () => {
    mockCreate.mockRejectedValueOnce(new Error('API Error'));

    const res = await POST(makeFormRequest(validFile));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain('API Error');
  });

  it('OpenAI SDKのcreateに正しいパラメータが渡される', async () => {
    mockCreate.mockResolvedValueOnce({ text: 'ok' });

    await POST(makeFormRequest(validFile));

    expect(mockCreate).toHaveBeenCalledOnce();
    const args = mockCreate.mock.calls[0][0];
    expect(args.model).toBe('whisper-1');
    expect(args.language).toBe('ja');
    expect(args.file).toBeInstanceOf(File);
    expect(args.file.name).toBe('test.mp3');
    expect(args.file.type).toBe('audio/mpeg');
  });

  it('ファイルの内容が正しく渡される', async () => {
    mockCreate.mockResolvedValueOnce({ text: 'ok' });

    const content = 'real audio content';
    const file = new File([Buffer.from(content)], 'audio.mp3', { type: 'audio/mpeg' });
    await POST(makeFormRequest(file));

    const passedFile: File = mockCreate.mock.calls[0][0].file;
    const buf = Buffer.from(await passedFile.arrayBuffer());
    expect(buf.toString('utf-8')).toBe(content);
  });

  it('bodyが空の場合400を返す', async () => {
    const req = new NextRequest('http://localhost/api/transcribe', {
      method: 'POST',
      body: null,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
