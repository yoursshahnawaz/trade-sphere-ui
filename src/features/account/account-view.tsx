'use client'

import type { ReactNode } from 'react'
import { useAppSelector } from '@/store/hooks'
import { ProfileForm } from './profile-form'
import { AddressManager } from './address-manager'

export function AccountView(): ReactNode {
  const role = useAppSelector((s) => s.auth.user?.role)
  return (
    <div className="space-y-10">
      <section aria-labelledby="profile-heading">
        <h2 id="profile-heading" className="mb-3 text-lg font-semibold">
          Profile
        </h2>
        <ProfileForm />
      </section>

      {role !== 'seller' && (
        <section aria-labelledby="addresses-heading">
          <h2 id="addresses-heading" className="mb-3 text-lg font-semibold">
            Saved addresses
          </h2>
          <AddressManager />
        </section>
      )}
    </div>
  )
}
