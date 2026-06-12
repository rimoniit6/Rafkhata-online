import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyPassword } from '@/lib/password'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api-utils'
import { handleApiError } from '@/lib/errors'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return apiError('ইমেইল ও পাসওয়ার্ড দিন', 400)
    }

    const normalizedEmail = email.toLowerCase().trim()
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      return apiError('এই ইমেইলে কোনো অ্যাকাউন্ট নেই', 401, 'UNAUTHORIZED')
    }

    if (!user.password) {
      return apiError('এই অ্যাকাউন্টে পাসওয়ার্ড লগইন সক্রিয় নেই। সামাজিক লগইন ব্যবহার করুন।', 401, 'UNAUTHORIZED')
    }

    const isValid = verifyPassword(password, user.password)
    if (!isValid) {
      return apiError('পাসওয়ার্ড সঠিক নয়', 401, 'UNAUTHORIZED')
    }

    const supabase = await createClient()

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    })

    if (!signInError && signInData?.user && !user.supabaseUserId) {
      await db.user.update({
        where: { id: user.id },
        data: { supabaseUserId: signInData.user.id },
      })
      user.supabaseUserId = signInData.user.id
    }

    // Sync Supabase Auth metadata with DB role on every login
    if (signInData?.user) {
      try {
        const serviceSupabase = await createServiceClient()
        await serviceSupabase.auth.admin.updateUserById(signInData.user.id, {
          user_metadata: { role: user.role },
        })
      } catch (metaError) {
        console.error('[Login] Failed to sync role metadata:', metaError)
      }
    }

    if (signInError) {
      if (!user.supabaseUserId) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: user.email,
          password,
          options: {
            data: { role: user.role },
          },
        })

        if (signUpError) {
          return apiError('লগইন ব্যর্থ হয়েছে। অনুগ্রহ করে Supabase ড্যাশবোর্ডে Authentication > Users থেকে পুরানো ইউজার ডিলিট করে আবার চেষ্টা করুন।', 500)
        }

        if (signUpData?.user) {
          await db.user.update({
            where: { id: user.id },
            data: { supabaseUserId: signUpData.user.id },
          })
        }

        if (!signUpData?.session) {
          const { error: retryError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password,
          })
          if (retryError) {
            return apiError('Supabase অ্যাকাউন্ট তৈরি হয়েছে কিন্তু লগইন ব্যর্থ। ইমেইল কনফার্ম করুন বা Supabase Dashboard থেকে ইউজার অ্যাপ্রুভ করুন।', 500)
          }
        }
      } else {
        return apiError('Supabase অ্যাকাউন্টে সমস্যা। অনুগ্রহ করে Supabase ড্যাশবোর্ডে গিয়ে Authentication > Settings > "Confirm email" বন্ধ আছে কিনা চেক করুন।', 500)
      }
    }

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name || '',
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      institute: user.institute,
      classLevel: user.classLevel,
      board: user.board,
      isPremium: user.isPremium,
      premiumExpiry: user.premiumExpiry?.toISOString() || undefined,
    }

    return NextResponse.json({ success: true, data: { user: userData } })
  } catch (error) {
    return handleApiError(error, 'Login error')
  }
}
