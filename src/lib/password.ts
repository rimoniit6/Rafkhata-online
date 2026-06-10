import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return salt + ':' + hash
}

export function verifyPassword(password: string, hashed: string): boolean {
  const [salt, hash] = hashed.split(':')
  if (!salt || !hash) return false
  const hashBuffer = scryptSync(password, salt, 64)
  const storedBuffer = Buffer.from(hash, 'hex')
  if (hashBuffer.length !== storedBuffer.length) return false
  return timingSafeEqual(hashBuffer, storedBuffer)
}
