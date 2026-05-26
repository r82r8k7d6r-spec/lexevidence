import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PRICE_FIRST, PRICE_REPEAT } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { count } = await supabase
      .from('purchases')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed');

    const completedCount = count ?? 0;
    const isFirst = completedCount === 0;

    return NextResponse.json({
      completedCount,
      isFirst,
      price: isFirst ? PRICE_FIRST : PRICE_REPEAT,
    });
  } catch (error) {
    console.error('Purchase count error:', error);
    return NextResponse.json({ error: '取得失敗' }, { status: 500 });
  }
}
