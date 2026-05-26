import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET: フォームデータを取得
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
      .from('form_sessions')
      .select('form_data, expires_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'フォームデータが見つかりません' }, { status: 404 });
    }

    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ error: 'フォームデータの有効期限が切れています' }, { status: 410 });
    }

    return NextResponse.json({ formData: data.form_data });
  } catch (err) {
    console.error('form-sessions GET error:', err);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}

// DELETE: 資料生成完了後にフォームデータを削除
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

    await supabase
      .from('form_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error('form-sessions DELETE error:', err);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}
