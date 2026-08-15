import { NextResponse, type NextRequest } from 'next/server'
import { addressSchema } from '@/lib/schemas/address-schema'
import { requireSession, isSameOrigin } from '@/lib/server/http'
import { listAddresses, addAddress, updateAddress, removeAddress } from '@/lib/server/address-book'

export async function GET(): Promise<NextResponse> {
  const session = await requireSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  return NextResponse.json({ addresses: await listAddresses(session.sub) }, { status: 200 })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const session = await requireSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const parsed = addressSchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: 'invalid body' }, { status: 400 })

  return NextResponse.json({ addresses: await addAddress(session.sub, parsed.data) }, { status: 201 })
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const session = await requireSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const index = Number(new URL(request.url).searchParams.get('index'))
  if (!Number.isInteger(index)) return NextResponse.json({ error: 'invalid index' }, { status: 400 })

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  const parsed = addressSchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  return NextResponse.json({ addresses: await updateAddress(session.sub, index, parsed.data) })
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const session = await requireSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const index = Number(new URL(request.url).searchParams.get('index'))
  if (!Number.isInteger(index)) return NextResponse.json({ error: 'invalid index' }, { status: 400 })
  return NextResponse.json({ addresses: await removeAddress(session.sub, index) })
}
