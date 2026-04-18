'use server'

import { signOut } from '@/auth'

export async function doPortalSignOut() {
  await signOut({ redirectTo: '/fr' })
}
