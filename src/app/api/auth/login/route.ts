import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { verifyPassword, hashPassword } from '@/lib/password'
import { createClient } from '@/lib/supabase/server'
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
    let user = await db.user.findUnique({
      where: { email: normalizedEmail },
    })

    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD

    if (!user && superAdminEmail && superAdminPassword && normalizedEmail === superAdminEmail && password === superAdminPassword) {
      const hashed = hashPassword(superAdminPassword)
      user = await db.user.create({
        data: {
          email: superAdminEmail,
          name: 'Super Admin',
          password: hashed,
          role: 'super_admin',
          isVerified: true,
        },
      })
    }

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

    if (superAdminEmail && normalizedEmail === superAdminEmail && user.role !== 'super_admin') {
      user = await db.user.update({
        where: { id: user.id },
        data: { role: 'super_admin', isVerified: true },
      })
    }

    const supabase = await createClient()

    // Try signing in with password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    })

    if (signInError) {
      if (!user.supabaseUserId) {
        // Create Supabase Auth user via signUp (anon key, no admin API needed)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: user.email,
          password,
          options: {
            data: { role: user.role },
          },
        })

        if (signUpError) {
          // User already exists in Supabase Auth — signInWithPassword already failed,
          // so password might be stale. Delete the old unconfirmed user via API.
          // Fallback: let user try again after confirming email.
          return apiError('লগইন ব্যর্থ হয়েছে। অনুগ্রহ করে Supabase ড্যাশবোর্ডে Authentication > Users থেকে পুরানো ইউজার ডিলিট করে আবার চেষ্টা করুন।', 500)
        }

        // Link the Supabase Auth user ID
        if (signUpData?.user) {
          await db.user.update({
            where: { id: user.id },
            data: { supabaseUserId: signUpData.user.id },
          })
        }

        // If email_confirm is off, signUp returns a session automatically.
        // If it returned a session, cookies are already set — no need to signIn.
        // If signUp didn't return a session (email_confirm on), we need signIn.
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
        // Has supabaseUserId but sign-in failed
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
