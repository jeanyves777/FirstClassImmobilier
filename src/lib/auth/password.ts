import 'server-only'
import { hash, verify } from '@node-rs/argon2'

const OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1 }

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, OPTS)
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  try {
    return await verify(stored, plain)
  } catch {
    return false
  }
}
