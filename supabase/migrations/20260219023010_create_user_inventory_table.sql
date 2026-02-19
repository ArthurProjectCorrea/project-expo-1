-- create_user_inventory_table

CREATE TABLE IF NOT EXISTS public.user_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  quantity integer NOT NULL CHECK (quantity > 0),
  expiration_date date,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON public.user_inventory (user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_product_id ON public.user_inventory (product_id);

-- enable Row Level Security (Supabase)
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

-- policy: users may manage only their own inventory
DROP POLICY IF EXISTS "Users can manage their own inventory" ON public.user_inventory;
CREATE POLICY "Users can manage their own inventory"
  ON public.user_inventory
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ensure updated_at is maintained by the shared trigger function (created in products migration)
DROP TRIGGER IF EXISTS trg_set_updated_at ON public.user_inventory;
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON public.user_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
