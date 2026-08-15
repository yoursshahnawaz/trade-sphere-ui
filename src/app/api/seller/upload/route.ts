import { NextResponse, type NextRequest } from 'next/server'
import { requireSession, isSameOrigin } from '@/lib/server/http'
import { getDb } from '@/lib/server/supabase'

const MAX_BYTES = 5 * 1024 * 1024
const BUCKET = 'product-images'
// Explicit allowlist (mirrors the bucket config). Notably excludes image/svg+xml,
// which can carry script and would be stored XSS when served inline from Storage.
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

// Seller uploads a product image. The file goes to Supabase Storage via the
// service-role client (BFF pattern); the browser never touches Storage directly.
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const session = await requireSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (session.role !== 'seller') return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'invalid form' }, { status: 400 })
  }
  const file = form.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'no file' }, { status: 400 })
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: 'unsupported image type' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'file too large' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${session.sub}/${crypto.randomUUID()}.${ext}`
  const bytes = new Uint8Array(await file.arrayBuffer())

  const { error } = await getDb()
    .storage.from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false })
  if (error) return NextResponse.json({ error: 'upload failed' }, { status: 500 })

  const { data } = getDb().storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl }, { status: 201 })
}
