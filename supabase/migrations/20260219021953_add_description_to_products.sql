-- add_description_to_products
ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS description text;