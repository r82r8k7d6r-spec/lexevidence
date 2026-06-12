import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET: ナレッジ一覧を取得（キーワード・カテゴリ・タグで絞り込み）
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();
    const category = searchParams.get('category')?.trim();
    const tag = searchParams.get('tag')?.trim();

    let query = supabase
      .from('knowledge_entries')
      .select('*')
      .order('updated_at', { ascending: false });

    if (category) query = query.eq('category', category);
    if (tag) query = query.contains('tags', [tag]);
    if (q) {
      const escaped = q.replace(/[%,]/g, '');
      query = query.or(`title.ilike.%${escaped}%,content.ilike.%${escaped}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('knowledge GET error:', error);
      return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ entries: data });
  } catch (err) {
    console.error('knowledge GET error:', err);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}

// POST: ナレッジを新規作成
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'JSONパースエラー' }, { status: 400 });
    }
    const { title, content, category, tags } = body as Record<string, unknown>;

    const trimmedTitle = typeof title === 'string' ? title.trim() : '';
    const trimmedContent = typeof content === 'string' ? content.trim() : '';
    if (!trimmedTitle || !trimmedContent) {
      return NextResponse.json({ error: 'タイトルと内容は必須です' }, { status: 400 });
    }

    const normalizedCategory = typeof category === 'string' && category ? category : 'その他';
    const normalizedTags = Array.isArray(tags)
      ? tags.map((t) => String(t).trim()).filter(Boolean)
      : [];

    const { data, error } = await supabase
      .from('knowledge_entries')
      .insert({
        title: trimmedTitle,
        content: trimmedContent,
        category: normalizedCategory,
        tags: normalizedTags,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('knowledge POST error:', error);
      return NextResponse.json({ error: '作成に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ entry: data }, { status: 201 });
  } catch (err) {
    console.error('knowledge POST error:', err);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}
