import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { EditProductForm } from '@/features/seller/edit-product-form'

export const metadata: Metadata = { title: 'Edit product' }

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<ReactNode> {
  const { id } = await params
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Edit product</h1>
      <EditProductForm id={id} />
    </div>
  )
}
