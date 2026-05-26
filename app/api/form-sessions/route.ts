import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const BUCKET = 'form-sessions';

// 大容量ボディをストリームで直接読む（PostgREST のサイズ制限を回避）
async function readBodyAsText(req: NextRequest): Promise<string> {
  const reader = req.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.length; }
  return new TextDecoder().decode(merged);
}

// POST: フォームデータを Supabase Storage に保存し、セッション ID を返す
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

    const bodyText = await readBodyAsText(req);
    let formData: unknown;
    try {
      ({ formData } = JSON.parse(bodyText));
    } catch {
      return NextResponse.json({ error: 'JSONパースエラー' }, { status: 400 });
    }
    if (!formData) return NextResponse.json({ error: 'formData は必須です' }, { status: 400 });

    // UUID を生成して Storage パスを決定
    const sessionId = crypto.randomUUID();
    const storagePath = `${user.id}/${sessionId}.json`;
    const fileContent = Buffer.from(JSON.stringify(formData), 'utf-8');

    // Service Role Key で Storage に直接アップロード（RLS をバイパスして確実に保存）
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // バケットが存在しない場合は作成
    await admin.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: 209715200,
      allowedMimeTypes: ['application/json'],
    }).catch(() => {}); // 既存の場合はエラーを無視

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, fileContent, {
        contentType: 'application/json',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'フォームデータの保存に失敗しました' }, { status: 500 });
    }

    // メタデータをテーブルに保存（storage_path のみ、実データは Storage に）
    // テーブルが未作成でも処理は続行する
    const { error: metaError } = await supabase.from('form_sessions').insert({
      id:           sessionId,
      user_id:      user.id,
      storage_path: storagePath,
    });
    if (metaError) console.warn('form_sessions metadata insert skipped:', metaError.message);

    return NextResponse.json({ formSessionId: sessionId });
  } catch (err) {
    console.error('form-sessions POST error:', err);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}
