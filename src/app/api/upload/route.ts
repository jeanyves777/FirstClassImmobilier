import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { auth } from '@/auth'

export const runtime = 'nodejs'

const MAX_BYTES = 20 * 1024 * 1024 // 20 MB
const ALLOWED = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/avif', 'avif'],
  ['image/gif', 'gif'],
  ['video/mp4', 'mp4'],
  ['video/webm', 'webm'],
  ['application/pdf', 'pdf'],
])

export async function POST(request: Request) {
  const session = await auth()
  const role = (session?.user as { role?: string } | undefined)?.role
  if (role !== 'STAFF' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'Empty file' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `File exceeds ${MAX_BYTES / 1024 / 1024}MB limit` }, { status: 413 })
  }

  const ext = ALLOWED.get(file.type)
  if (!ext) {
    return NextResponse.json({ error: `Unsupported type: ${file.type}` }, { status: 415 })
  }

  const now = new Date()
  const yyyy = String(now.getFullYear())
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const subdir = `${yyyy}-${mm}`
  const filename = `${randomBytes(8).toString('hex')}-${Date.now()}.${ext}`

  const uploadsDir = join(process.cwd(), 'public', 'uploads', subdir)
  await mkdir(uploadsDir, { recursive: true })

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(join(uploadsDir, filename), buffer)

  const url = `/uploads/${subdir}/${filename}`
  return NextResponse.json({ url, kind: inferKind(file.type), size: file.size })
}

function inferKind(mime: string) {
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime === 'application/pdf') return 'pdf'
  return 'file'
}
