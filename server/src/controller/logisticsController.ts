import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';

export const getSellerLogistics = async (req: Request, res: Response): Promise<void> => {
  const { sellerId } = req.params;

  const { data, error } = await supabase
    .from('logistics')
    .select(`
      *,
      auctions (
        name,
        weight_kg,
        image_url
      )
    `)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const active: any[] = [];
  const history: any[] = [];

  for (const item of data || []) {
    // If status is delivered, it goes to history, else active
    if (item.status === 'delivered') {
      history.push(item);
    } else {
      active.push(item);
    }
  }

  res.status(200).json({ active, history });
};
