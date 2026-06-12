import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.hoisted(() => vi.fn());

// チェイン可能かつ thenable なクエリビルダーのモック
function createQueryBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    contains: vi.fn(() => builder),
    or: vi.fn(() => builder),
    order: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    single: vi.fn(() => builder),
    then: (resolve: (value: typeof result) => void) => resolve(result),
  };
  return builder;
}

const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

const { GET, POST } = await import('@/app/api/knowledge/route');
const {
  GET: GET_BY_ID,
  PATCH,
  DELETE,
} = await import('@/app/api/knowledge/[id]/route');

const mockUser = { id: 'user-1', email: 'sv@example.com' };

const makeRequest = (url: string, init?: ConstructorParameters<typeof NextRequest>[1]) =>
  new NextRequest(url, init);
const makeJsonRequest = (url: string, method: string, body: unknown) =>
  new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('GET /api/knowledge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未認証の場合401を返す', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const res = await GET(makeRequest('http://localhost/api/knowledge'));
    expect(res.status).toBe(401);
  });

  it('認証済みの場合一覧を返す', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser } });
    const entries = [{ id: '1', title: 'V6切り分け手順', category: 'V6システム関連', tags: ['V6'], content: '内容' }];
    mockFrom.mockReturnValueOnce(createQueryBuilder({ data: entries, error: null }));

    const res = await GET(makeRequest('http://localhost/api/knowledge?q=V6&category=V6システム関連'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.entries).toEqual(entries);
  });
});

describe('POST /api/knowledge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未認証の場合401を返す', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const res = await POST(makeJsonRequest('http://localhost/api/knowledge', 'POST', { title: 'a', content: 'b' }));
    expect(res.status).toBe(401);
  });

  it('タイトルが空の場合400を返す', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser } });
    const res = await POST(makeJsonRequest('http://localhost/api/knowledge', 'POST', { title: '  ', content: '内容' }));
    expect(res.status).toBe(400);
  });

  it('内容が空の場合400を返す', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser } });
    const res = await POST(makeJsonRequest('http://localhost/api/knowledge', 'POST', { title: 'タイトル', content: '' }));
    expect(res.status).toBe(400);
  });

  it('正常時に201で作成したエントリを返す', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser } });
    const created = {
      id: '1',
      title: 'タイトル',
      category: 'V6システム関連',
      tags: ['V6'],
      content: '内容',
      created_by: mockUser.id,
    };
    mockFrom.mockReturnValueOnce(createQueryBuilder({ data: created, error: null }));

    const res = await POST(
      makeJsonRequest('http://localhost/api/knowledge', 'POST', {
        title: 'タイトル',
        content: '内容',
        category: 'V6システム関連',
        tags: ['V6'],
      })
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.entry).toEqual(created);
  });

  it('カテゴリ未指定時は「その他」になる', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser } });
    const builder = createQueryBuilder({ data: { id: '1' }, error: null });
    mockFrom.mockReturnValueOnce(builder);

    await POST(makeJsonRequest('http://localhost/api/knowledge', 'POST', { title: 'タイトル', content: '内容' }));

    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'その他', tags: [] })
    );
  });
});

describe('GET /api/knowledge/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('見つからない場合404を返す', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser } });
    mockFrom.mockReturnValueOnce(createQueryBuilder({ data: null, error: { message: 'not found' } }));

    const res = await GET_BY_ID(makeRequest('http://localhost/api/knowledge/1'), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(res.status).toBe(404);
  });

  it('存在する場合エントリを返す', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser } });
    const entry = { id: '1', title: 'タイトル', category: 'その他', tags: [], content: '内容' };
    mockFrom.mockReturnValueOnce(createQueryBuilder({ data: entry, error: null }));

    const res = await GET_BY_ID(makeRequest('http://localhost/api/knowledge/1'), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.entry).toEqual(entry);
  });
});

describe('PATCH /api/knowledge/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('タイトルを空にする更新は400を返す', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser } });
    const res = await PATCH(makeJsonRequest('http://localhost/api/knowledge/1', 'PATCH', { title: '' }), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(res.status).toBe(400);
  });

  it('正常時に更新後のエントリを返す', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser } });
    const updated = { id: '1', title: '更新後', category: '例外案件', tags: ['新規'], content: '更新内容' };
    mockFrom.mockReturnValueOnce(createQueryBuilder({ data: updated, error: null }));

    const res = await PATCH(
      makeJsonRequest('http://localhost/api/knowledge/1', 'PATCH', {
        title: '更新後',
        content: '更新内容',
        category: '例外案件',
        tags: ['新規'],
      }),
      { params: Promise.resolve({ id: '1' }) }
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.entry).toEqual(updated);
  });
});

describe('DELETE /api/knowledge/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未認証の場合401を返す', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const res = await DELETE(makeRequest('http://localhost/api/knowledge/1', { method: 'DELETE' }), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(res.status).toBe(401);
  });

  it('正常時に削除結果を返す', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: mockUser } });
    mockFrom.mockReturnValueOnce(createQueryBuilder({ data: null, error: null }));

    const res = await DELETE(makeRequest('http://localhost/api/knowledge/1', { method: 'DELETE' }), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.deleted).toBe(true);
  });
});
