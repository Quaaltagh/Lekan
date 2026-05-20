import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';
import { WithdrawPayload, DepositPayload, CreditWalletPayload, AddPendingPayload, ReleasePendingPayload } from '../models/Walletmodel';
import { sendNotification } from '../lib/NotificationHelper';

// ─── Helper ───────────────────────────────────────────────────────────────────
async function getOrCreateWallet(userId: string) {
  let { data: wallet, error } = await supabase
    .from('wallets').select('*').eq('user_id', userId).single();

  if (error || !wallet) {
    const { data: newWallet, error: createError } = await supabase
      .from('wallets')
      .insert({ user_id: userId, balance: 0, pending: 0 })
      .select().single();
    if (createError) throw new Error(`Gagal membuat dompet: ${createError.message}`);
    wallet = newWallet;
  }
  return wallet;
}

// ─── GET /api/wallet/:userId ──────────────────────────────────────────────────
export const getWallet = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  try {
    const wallet = await getOrCreateWallet(userId);
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('id, user_id, type, amount, description, auction_id, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    if (txError) { res.status(500).json({ error: txError.message }); return; }
    res.status(200).json({ wallet, transactions: transactions ?? [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/wallet/:userId/transactions ─────────────────────────────────────
export const getTransactions = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const page  = Number(req.query.page)  || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('transactions')
    .select('id, user_id, type, amount, description, auction_id, status, created_at', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(200).json({ transactions: data ?? [], total: count ?? 0, page, limit });
};

// ─── GET /api/wallet/:userId/active-bids ─────────────────────────────────────
export const getActiveBidsCount = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { count, error } = await supabase
    .from('bids')
    .select('*', { count: 'exact', head: true })
    .eq('bidder_id', userId);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(200).json({ count: count ?? 0 });
};

// ─── POST /api/wallet/:userId/deposit ────────────────────────────────────────
export const deposit = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { amount, description }: DepositPayload = req.body;
  if (!amount || amount <= 0) { res.status(400).json({ error: 'Jumlah deposit harus lebih dari 0.' }); return; }
  try {
    const wallet = await getOrCreateWallet(userId);
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: wallet.balance + amount, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (updateError) { res.status(500).json({ error: updateError.message }); return; }
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert({ user_id: userId, type: 'deposit', amount, description: description || 'Deposit saldo', auction_id: null, status: 'completed' })
      .select().single();

    // ── NOTIF: deposit berhasil ─────────────────────────────────────────────
    await sendNotification(
      userId,
      'pembayaran',
      'Deposit Berhasil',
      `Dana sebesar Rp ${amount.toLocaleString('id-ID')} berhasil ditambahkan ke dompet kamu.`
    );

    if (txError) { res.status(500).json({ error: txError.message }); return; }
    res.status(201).json({ message: 'Deposit berhasil.', transaction: tx, new_balance: wallet.balance + amount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/wallet/:userId/withdraw ───────────────────────────────────────
export const withdraw = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { amount, description }: WithdrawPayload = req.body;
  if (!amount || amount <= 0) { res.status(400).json({ error: 'Jumlah penarikan harus lebih dari 0.' }); return; }
  try {
    const wallet = await getOrCreateWallet(userId);
    if (wallet.balance < amount) { res.status(400).json({ error: 'Saldo tidak mencukupi.' }); return; }
    
    // Deduct immediately to prevent double withdrawal
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: wallet.balance - amount, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (updateError) { res.status(500).json({ error: updateError.message }); return; }
    
    // Create transaction with status 'pending'
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert({ user_id: userId, type: 'withdrawal', amount, description: description || 'Penarikan dana', auction_id: null, status: 'pending' })
      .select().single();
    if (txError) { res.status(500).json({ error: txError.message }); return; }
    
    res.status(200).json({ message: 'Permintaan penarikan berhasil diajukan.', transaction: tx });

    // ── NOTIF: permintaan penarikan diproses ─────────────────────────────────
    await sendNotification(
      userId,
      'pembayaran',
      'Permintaan Penarikan Dana Diproses',
      `Permintaan penarikan dana sebesar Rp ${amount.toLocaleString('id-ID')} sedang diproses.`
    );

    // Simulasi penyelesaian penarikan setelah 5 detik
    setTimeout(async () => {
      try {
        await supabase
          .from('transactions')
          .update({ status: 'completed' })
          .eq('id', tx.id);

        await sendNotification(
          userId,
          'pembayaran',
          'Penarikan Dana Berhasil',
          `Dana sebesar Rp ${amount.toLocaleString('id-ID')} berhasil ditransfer ke rekening Anda.`
        );
      } catch (simError) {
        console.error('Error during withdraw simulation confirmation:', simError);
      }
    }, 5000);

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/wallet/credit ──────────────────────────────────────────────────
export const creditWallet = async (req: Request, res: Response): Promise<void> => {
  const { user_id, amount, type, auction_id, description }: CreditWalletPayload = req.body;
  if (!user_id || !amount || amount <= 0 || !type) { res.status(400).json({ error: 'user_id, amount, dan type wajib diisi.' }); return; }
  try {
    const wallet = await getOrCreateWallet(user_id);
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: wallet.balance + amount, updated_at: new Date().toISOString() })
      .eq('user_id', user_id);
    if (updateError) { res.status(500).json({ error: updateError.message }); return; }
    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert({ user_id, type, amount, description: description ?? null, auction_id: auction_id ?? null, status: 'completed' })
      .select().single();
    if (txError) { res.status(500).json({ error: txError.message }); return; }
    res.status(200).json({ message: 'Saldo berhasil ditambahkan.', transaction: tx });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/wallet/:userId/pending/add ────────────────────────────────────
export const addPending = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { amount, auction_id, description }: AddPendingPayload = req.body;
  if (!amount || amount <= 0) { res.status(400).json({ error: 'Amount tidak valid.' }); return; }
  try {
    const wallet = await getOrCreateWallet(userId);
    const { error } = await supabase
      .from('wallets')
      .update({ pending: wallet.pending + amount, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) { res.status(500).json({ error: error.message }); return; }
    const { data: tx } = await supabase
      .from('transactions')
      .insert({ user_id: userId, type: 'auction_payout', amount, description: description ?? 'Menunggu konfirmasi lelang', auction_id: auction_id ?? null, status: 'pending' })
      .select().single();
    res.status(200).json({ message: 'Pending ditambahkan.', transaction: tx });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/wallet/:userId/pending/release ────────────────────────────────
export const releasePending = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { amount, transaction_id }: ReleasePendingPayload = req.body;
  if (!amount || amount <= 0) { res.status(400).json({ error: 'Amount tidak valid.' }); return; }
  try {
    const wallet = await getOrCreateWallet(userId);
    if (wallet.pending < amount) { res.status(400).json({ error: 'Jumlah pending tidak mencukupi.' }); return; }
    const { error } = await supabase
      .from('wallets')
      .update({ pending: wallet.pending - amount, balance: wallet.balance + amount, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) { res.status(500).json({ error: error.message }); return; }
    if (transaction_id) {
      await supabase.from('transactions').update({ status: 'completed' }).eq('id', transaction_id);
    }
    await sendNotification(
      userId,
      'transaksi',
      'Dana Escrow Dicairkan',
      `Dana sebesar Rp ${amount.toLocaleString('id-ID')} berhasil dicairkan.`
    );
    res.status(200).json({ message: 'Pending berhasil dicairkan.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};