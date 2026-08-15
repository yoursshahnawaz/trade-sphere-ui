import type { Address } from '@/lib/schemas/address-schema'

const g = globalThis as unknown as { __addressBook?: Map<string, Address[]> }
const book = g.__addressBook ?? (g.__addressBook = new Map<string, Address[]>())

export function listAddresses(uid: string): Address[] {
  return book.get(uid) ?? []
}

export function addAddress(uid: string, address: Address): Address[] {
  const list = book.get(uid) ?? []
  list.push(address)
  book.set(uid, list)
  return list
}

export function removeAddress(uid: string, index: number): Address[] {
  const list = book.get(uid) ?? []
  if (index >= 0 && index < list.length) list.splice(index, 1)
  book.set(uid, list)
  return list
}
