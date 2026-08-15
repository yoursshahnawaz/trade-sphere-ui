-- Trade-Sphere — Supabase schema (consolidated snapshot)
--
-- This is the full backend schema for the marketplace. During development the
-- migrations were applied to the hosted project via the Supabase tooling; this
-- file is a single, runnable snapshot you can paste into the SQL editor of a
-- fresh project to reproduce the database.
--
-- Security model: writes and all private reads go through the Next.js BFF using
-- the service-role key (which bypasses RLS); the BFF enforces per-uid scoping.
-- The browser only ever uses the anon key, and RLS exposes just public catalog
-- data (active products, seller info) — which also powers realtime. Reviews are
-- served only via the service-role BFF, never read directly with the anon key.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Sellers (storefront identity) and user profiles
create table if not exists public.sellers (
  uid text primary key,
  name text not null,
  location text not null default 'India'
);

create table if not exists public.profiles (
  uid text primary key,
  name text not null,
  gender text not null default 'prefer-not',
  contact text not null default ''
);

-- Durable account record (uid -> role). Written at login/registration so a
-- seller's role survives restarts (buyer is the default for new accounts).
create table if not exists public.users (
  uid text primary key,
  email text,
  role text not null default 'buyer' check (role in ('buyer','seller')),
  store_name text,
  created_at timestamptz not null default now()
);

-- Product listings
create table if not exists public.products (
  id text primary key,
  seller_uid text not null,
  title text not null,
  price_cents integer not null check (price_cents >= 0),
  sale_price_cents integer check (sale_price_cents is null or sale_price_cents > 0),
  stock integer not null default 0 check (stock >= 0),
  category text not null,
  image_url text not null,
  status text not null default 'active' check (status in ('active','draft')),
  created_at timestamptz not null default now()
);
create index if not exists products_seller_uid_idx on public.products (seller_uid);
create index if not exists products_category_idx on public.products (category);
create index if not exists products_status_idx on public.products (status);

-- Saved addresses
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  uid text not null,
  full_name text not null,
  line1 text not null,
  line2 text,
  city text not null,
  region text not null,
  postal_code text not null,
  country text not null default 'India',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists addresses_uid_idx on public.addresses (uid);

-- Orders + line items
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  uid text not null,
  subtotal_cents integer not null,
  tax_cents integer not null,
  shipping_cents integer not null,
  total_cents integer not null,
  shipping jsonb not null,
  billing jsonb not null,
  payment jsonb not null,
  status text not null default 'Processing' check (status in ('Processing','Shipped','Delivered')),
  created_at timestamptz not null default now()
);
create index if not exists orders_uid_idx on public.orders (uid);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id text not null,
  title text not null,
  price_cents integer not null,
  quantity integer not null check (quantity > 0),
  image_url text not null
);
create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- Product reviews (one editable review per user per product)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  uid text not null,
  author_name text not null,
  rating integer not null check (rating between 1 and 5),
  body text not null default '',
  created_at timestamptz not null default now(),
  unique (product_id, uid)
);
create index if not exists reviews_product_id_idx on public.reviews (product_id);

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
-- Enable RLS on every table. Writes + private reads run as the service role
-- (bypasses RLS). Only public catalog data is anon-readable — active products
-- (also needed for realtime) and seller storefront info — so the buyer storefront
-- and realtime work with the anon key. Users, reviews, orders, addresses, and
-- profiles are deny-by-default for anon (service-role only).
alter table public.sellers enable row level security;
alter table public.profiles enable row level security;
alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;

drop policy if exists "public reads active products" on public.products;
create policy "public reads active products" on public.products
  for select to anon, authenticated using (status = 'active');

drop policy if exists "public reads sellers" on public.sellers;
create policy "public reads sellers" on public.sellers
  for select to anon, authenticated using (true);

-- NOTE: reviews are deliberately NOT anon-readable. They are served only through
-- the service-role BFF (which strips the reviewer's uid before returning rows),
-- so exposing the raw table to the anon key would leak buyer identifiers for no
-- functional gain. RLS stays enabled with no anon policy (deny-by-default).

-- ---------------------------------------------------------------------------
-- Realtime — buyer catalog updates live as sellers list/edit products.
-- Guarded so re-running this snapshot is idempotent (ADD TABLE has no IF NOT EXISTS).
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products'
  ) then
    alter publication supabase_realtime add table public.products;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Storage — public bucket for seller-uploaded product images
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880,
        array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do nothing;
