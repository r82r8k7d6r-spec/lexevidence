import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const headersList = await headers()

  // NEXT_PUBLIC_ 変数はビルド時に固定されるため、サーバー側で動的に取得する
  // Railway では x-forwarded-proto / host ヘッダーで本番 URL を取得できる
  const proto = headersList.get('x-forwarded-proto') || 'https'
  const host = headersList.get('host') || ''
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
      skipBrowserRedirect: true,
    },
  })

  if (error || !data.url) {
    return NextResponse.json({ error: 'oauth_failed' }, { status: 500 })
  }

  return NextResponse.json({ url: data.url })
}
