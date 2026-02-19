import { supabase } from './supabase';

export type AddInventoryParams = {
  userId: string;
  productId: string;
  quantity?: number;
  expirationDate?: string | null; // 'YYYY-MM-DD' preferred
};

export async function addUserInventory({
  userId,
  productId,
  quantity = 1,
  expirationDate = null,
}: AddInventoryParams) {
  if (!userId) throw new Error('userId is required');
  if (!productId) throw new Error('productId is required');
  const qty = Math.max(1, Math.floor(Number(quantity) || 1));

  const payload: any = {
    user_id: userId,
    product_id: productId,
    quantity: qty,
  };

  if (expirationDate) payload.expiration_date = expirationDate;

  const { data, error } = await supabase
    .from('user_inventory')
    .insert(payload)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}
