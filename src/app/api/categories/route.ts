import { NextResponse } from 'next/server'
import { listCategories } from '@/lib/server/product-store'

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ categories: await listCategories() }, { status: 200 })
}
