import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// 大容量ボディ（スクリーンショットbase64）をストリームで直接読む
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

// POST: フォームデータを一時保存し、セッションIDを返す
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

    if (!formData) {
      return NextResponse.json({ error: 'formData は必須です' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('form_sessions')
      .insert({ user_id: user.id, form_data: formData })
      .select('id')
      .single();

    if (error) {
      console.error('form_sessions insert error:', error);
      return NextResponse.json({ error: 'フォームデータの保存に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({ formSessionId: data.id });
  } catch (err) {
    console.error('form-sessions POST error:', err);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}
