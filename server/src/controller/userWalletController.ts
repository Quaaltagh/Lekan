import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';

// ─── GET wallet balance ───────────────────────────────────────────────────────
export const getWallet = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  let { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Kalau belum ada wallet, buat baru
  if (error || !data) {
    const { data: newWallet, error: createError } = await supabase
      .from('wallets')
      .insert({ user_id: userId, balance: 0, escrowed: 0 })
      .select()
      .single();

    if (createError) { res.status(500).json({ error: createError.message }); return; }
    data = newWallet;
  }

  res.status(200).json(data);
};

// ─── GET transactions by user ─────────────────────────────────────────────────
export const getTransactions = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(200).json(data ?? []);
};

// ─── GET active bids count ────────────────────────────────────────────────────
export const getActiveBidsCount = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  const { count, error } = await supabase
    .from('bids')
    .select('*', { count: 'exact', head: true })
    .eq('bidder_id', userId);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(200).json({ count: count ?? 0 });
};

// ─── POST deposit ─────────────────────────────────────────────────────────────
export const deposit = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { amount, description } = req.body;

  if (!amount || amount <= 0) {
    res.status(400).json({ error: 'Jumlah deposit tidak valid.' });
    return;
  }

  // Update balance di wallets
  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .single();

  const currentBalance = wallet?.balance ?? 0;

  const { error: updateError } = await supabase
    .from('wallets')
    .upsert({ user_id: userId, balance: currentBalance + amount })
    .eq('user_id', userId);

  if (updateError) { res.status(500).json({ error: updateError.message }); return; }

  // Catat di transactions
  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      type: 'deposit',
      amount,
      description: description || 'Deposit saldo',
      status: 'completed',
    })
    .select()
    .single();

  if (txError) { res.status(500).json({ error: txError.message }); return; }

  res.status(201).json({ message: 'Deposit berhasil.', transaction: tx, new_balance: currentBalance + amount });
};