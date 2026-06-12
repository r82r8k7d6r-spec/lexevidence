import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET: ナレッジを1件取得
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

    const { data, error } = await supabase
      .from('knowledge_entries')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return NextResponse.json({ error: '見つかりません' }, { status: 404 });

    return NextResponse.json({ entry: data });
  } catch (err) {
    console.error('knowledge GET error:', err);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}

// PATCH: ナレッジを更新
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const update: Record<string, unknown> = {};
    if (typeof title === 'string') update.title = title.trim();
    if (typeof content === 'string') update.content = content.trim();
    if (typeof category === 'string' && category) update.category = category;
    if (Array.isArray(tags)) update.tags = tags.map((t) => String(t).trim()).filter(Boolean);

    if (update.title === '' || update.content === '') {
      return NextResponse.json({ error: 'タイトルと内容は必須です' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('knowledge_entries')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('knowledge PATCH error:', error);
      return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: '見つかりません' }, { status: 404 });

    return NextResponse.json({ entry: data });
  } catch (err) {
    console.error('knowledge PATCH error:', err);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}

// DELETE: ナレッジを削除
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

    const { error } = await supabase.from('knowledge_entries').delete().eq('id', id);
    if (error) {
      console.error('knowledge DELETE error:', error);
      return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error('knowledge DELETE error:', err);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}
