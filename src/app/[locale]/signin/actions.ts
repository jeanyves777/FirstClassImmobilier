'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'

type State = { ok: boolean; error?: string }

export async function doSignIn(_prev: State, formData: FormData): Promise<State> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const callbackUrl = String(formData.get('callbackUrl') ?? '/fr/admin/dashboard')

  try {
    await signIn('credentials', {
      email,
      password,
      redirect: true,
      redirectTo: callbackUrl,
    })
    return { ok: true }
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: 'invalid' }
    }
    throw err
  }
}
