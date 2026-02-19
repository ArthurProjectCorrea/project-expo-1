-- Enable required extension
create extension if not exists "pgcrypto";

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),

  barcode text not null unique,
  name text not null,
  brand text,
  image_url text,
  category text,
  source text default 'api',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_products_barcode
  on public.products (barcode);

-- Trigger function to auto update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_updated_at on public.products;

create trigger trg_set_updated_at
before update on public.products
for each row
execute function public.set_updated_at();
