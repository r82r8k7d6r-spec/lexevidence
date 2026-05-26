import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const BUCKET = 'form-sessions';

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// Storage パスを組み立て（user_id スコープで他ユーザーから保護）
function storagePath(userId: string, sessionId: string) {
  return `${userId}/${sessionId}.json`;
}

// GET: Supabase Storage からフォームデータを取得
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

    const path = storagePath(user.id, id);
    const admin = adminClient();

    const { data, error } = await admin.storage.from(BUCKET).download(path);
    if (error || !data) {
      console.error('Storage download error:', error);
      return NextResponse.json({ error: 'フォームデータが見つかりません' }, { status: 404 });
    }

    const text = await data.text();
    const formData = JSON.parse(text);

    return NextResponse.json({ formData });
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

    const path = storagePath(user.id, id);
    const admin = adminClient();

    // Storage からファイルを削除
    await admin.storage.from(BUCKET).remove([path]);

    // メタデータテーブルからも削除
    await supabase.from('form_sessions').delete().eq('id', id).eq('user_id', user.id);

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error('form-sessions DELETE error:', err);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}
