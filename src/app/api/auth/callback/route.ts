import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/'
  // Prevent open redirect — only allow relative paths or same-origin
  if (next) {
    try {
      const nextUrl = new URL(next, origin)
      if (nextUrl.origin !== origin) next = '/'
      next = nextUrl.pathname + nextUrl.search + nextUrl.hash
    } catch {
      if (!next.startsWith('/')) next = '/'
    }
  }

  try {
    if (code) {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        const { data: { user } } = await supabase.auth.getUser()

        if (user?.email) {
          const existingUser = await db.user.findUnique({ where: { email: user.email } })

          if (existingUser) {
            await db.user.update({
              where: { id: existingUser.id },
              data: { supabaseUserId: user.id },
            })

            const serviceSupabase = await createServiceClient()
            await serviceSupabase.auth.admin.updateUserById(user.id, {
              user_metadata: { role: existingUser.role },
            })
          } else {
            const newUser = await db.user.create({
              data: {
                email: user.email,
                name: user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0],
                avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
                supabaseUserId: user.id,
                role: 'STUDENT',
                isVerified: true,
              },
            })

            const serviceSupabase = await createServiceClient()
            await serviceSupabase.auth.admin.updateUserById(user.id, {
              user_metadata: { role: newUser.role },
            })
          }
        }

        const redirectUrl = new URL(origin)
        redirectUrl.pathname = next
        return NextResponse.redirect(redirectUrl)
      }
    }
  } catch {
    // Redirect to error page on any unexpected failure
  }

  return NextResponse.redirect(`${origin}?error=auth_callback_error`)
}
