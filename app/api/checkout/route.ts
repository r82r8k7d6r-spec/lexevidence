import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { stripe, PRICE_FIRST, PRICE_REPEAT } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

    // formSessionId を受け取る
    const { formSessionId } = await req.json().catch(() => ({})) as { formSessionId?: string };
    if (!formSessionId) {
      return NextResponse.json({ error: 'formSessionId は必須です' }, { status: 400 });
    }

    // 完了済み購入件数で初回/2回目以降を判定
    const { count } = await supabase
      .from('purchases')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed');

    const completedCount = count ?? 0;
    const isFirst = completedCount === 0;
    const amountJpy = isFirst ? PRICE_FIRST : PRICE_REPEAT;
    const label = isFirst ? '初回利用' : `${completedCount + 1}回目利用`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'jpy',
          product_data: {
            name: 'マモリAI 証拠資料作成',
            description: label,
          },
          unit_amount: amountJpy,
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: user.email ?? undefined,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.NEXT_PUBLIC_SITE_URL}/payment/cancel`,
      metadata: {
        user_id: user.id,
        form_session_id: formSessionId, // フォームデータ取得に使用
      },
    });

    // 保留レコードを挿入
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    await admin.from('purchases').insert({
      user_id:           user.id,
      stripe_session_id: session.id,
      amount_jpy:        amountJpy,
      status:            'pending',
    });

    return NextResponse.json({ url: session.url, amountJpy, isFirst });
  } catch (error) {
    console.error('Checkout error:', error);
    const msg = error instanceof Error ? error.message : '不明なエラー';
    return NextResponse.json({ error: `決済の開始に失敗しました: ${msg}` }, { status: 500 });
  }
}
