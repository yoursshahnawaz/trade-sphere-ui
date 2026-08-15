// Row shapes for the public schema (we don't generate Supabase types in this app).
export interface ProductRow {
  id: string
  seller_uid: string
  title: string
  price_cents: number
  sale_price_cents: number | null
  stock: number
  category: string
  image_url: string
  status: 'active' | 'draft'
  created_at: string
}

export interface SellerRow {
  uid: string
  name: string
  location: string
}
