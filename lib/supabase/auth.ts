import { createClient } from './client'
import { friendlyAuthError } from './errors'

export async function signIn(email: string, password: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) return { error: friendlyAuthError(error, 'sign in') }
    return { data }
  } catch (error) {
    return { error: friendlyAuthError(error, 'sign in') }
  }
}

export async function signUp(email: string, password: string, fullName: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    })
    if (error) return { error: friendlyAuthError(error, 'sign up') }
    if (!data.user) return { error: "We couldn’t create your account. Please try again." }

    if (!data.session) {
      return {
        data,
        message: 'Your account is ready. Check your email to confirm it before signing in.',
      }
    }

    return { data }
  } catch (error) {
    return { error: friendlyAuthError(error, 'sign up') }
  }
}

export async function signOut() {
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) return { error: friendlyAuthError(error, 'update account') }
    return { success: true }
  } catch (error) {
    return { error: friendlyAuthError(error, 'update account') }
  }
}
