import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { OnboardingWizard } from '@/features/seller/onboarding-wizard'

export const metadata: Metadata = { title: 'Add product' }

export default function NewProductPage(): ReactNode {
  return (
    <div>
      <div className="mx-auto max-w-2xl px-4 pt-8">
        <h1 className="text-2xl font-bold">Add a product</h1>
      </div>
      <OnboardingWizard />
    </div>
  )
}
