import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'session_id が必要です' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // Stripe セッションを取得（formSessionId のために常に呼ぶ）
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const formSessionId = session.metadata?.form_session_id ?? null;

    // DB に完了レコードがあればそのまま返す（Webhook 処理済み）
    const { data: existing } = await supabase
      .from('purchases')
      .select('status, amount_jpy')
      .eq('stripe_session_id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (existing?.status === 'completed') {
      return NextResponse.json({ verified: true, amountJpy: existing.amount_jpy, formSessionId });
    }

    // Stripe で決済完了確認
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ verified: false, error: '決済が完了していません' }, { status: 402 });
    }

    // DB を更新（Webhook より先に成功ページが来た場合の対応）
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    await admin.from('purchases').upsert({
      user_id:                  user.id,
      stripe_session_id:        sessionId,
      stripe_payment_intent_id: session.payment_intent as string | null,
      amount_jpy:               session.amount_total ?? 0,
      status:                   'completed',
      completed_at:             new Date().toISOString(),
    }, { onConflict: 'stripe_session_id' });

    return NextResponse.json({ verified: true, amountJpy: session.amount_total, formSessionId });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: '検証に失敗しました' }, { status: 500 });
  }
}
