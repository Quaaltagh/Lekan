import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';
import { sendNotification } from '../lib/NotificationHelper';

const SERVICE_FEE = 2_500;

// ─── POST /api/deposit/:userId ────────────────────────────────────────────────
export const createDeposit = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { amount, method } = req.body;

  // Validasi input
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    res.status(400).json({ error: 'Jumlah deposit tidak valid.' });
    return;
  }

  const VALID_METHODS = ['bank_transfer', 'e_wallet', 'card', 'qris'];
  if (!method || !VALID_METHODS.includes(method)) {
    res.status(400).json({ error: 'Metode pembayaran tidak valid.' });
    return;
  }

  const totalBilled = amount + SERVICE_FEE;

  // Buat pending transaction
  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id:     userId,
      type:        'deposit',
      amount,
      description: `Deposit via ${method.replace('_', ' ')} • fee Rp ${SERVICE_FEE.toLocaleString('id-ID')}`,
      status:      'pending',
    })
    .select()
    .single();

  if (txError) {
    res.status(500).json({ error: txError.message });
    return;
  }

  // Simulasi: langsung confirm setelah 3 detik (mock payment)
  // Di production, ini diganti webhook dari payment gateway
  setTimeout(async () => {
    await confirmDeposit(userId, tx.id, amount);
  }, 3_000);

  res.status(201).json({
    message:      'Deposit sedang diproses.',
    transaction:  tx,
    service_fee:  SERVICE_FEE,
    total_billed: totalBilled,
    // Mock: di production ini berisi payment_url dari gateway
    mock_confirm_in_ms: 3_000,
  });
};

// ─── POST /api/deposit/:userId/confirm/:txId  (manual confirm untuk dev/test) ─
export const manualConfirmDeposit = async (req: Request, res: Response): Promise<void> => {
  const { userId, txId } = req.params;

  const { data: tx, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', txId)
    .eq('user_id', userId)
    .single();

  if (error || !tx) {
    res.status(404).json({ error: 'Transaksi tidak ditemukan.' });
    return;
  }

  if (tx.status !== 'pending') {
    res.status(400).json({ error: `Transaksi sudah berstatus ${tx.status}.` });
    return;
  }

  const result = await confirmDeposit(userId, txId, tx.amount);
  if (!result.ok) {
    res.status(500).json({ error: result.error });
    return;
  }

  res.status(200).json({ message: 'Deposit dikonfirmasi.', new_balance: result.newBalance });
};

// ─── GET /api/deposit/:userId/status/:txId ────────────────────────────────────
export const getDepositStatus = async (req: Request, res: Response): Promise<void> => {
  const { userId, txId } = req.params;

  // Cari by txId dulu tanpa filter userId (untuk debug)
  const { data, error } = await supabase
    .from('transactions')
    .select('id, status, amount, created_at, user_id, description')
    .eq('id', txId)
    .single();

  if (error || !data) {
    console.error('[getDepositStatus] not found:', { txId, userId, error });
    res.status(404).json({ error: 'Transaksi tidak ditemukan.', txId, userId });
    return;
  }

  // Validasi ownership
  if (data.user_id !== userId) {
    res.status(403).json({ error: 'Akses ditolak.' });
    return;
  }

  res.status(200).json(data);
};

// ─── Internal: update wallet + mark transaction completed ────────────────────
async function confirmDeposit(
  userId: string,
  txId: string,
  amount: number
): Promise<{ ok: boolean; newBalance?: number; error?: string }> {
  // Ambil balance sekarang (upsert-safe)
  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .single();

  const currentBalance = wallet?.balance ?? 0;
  const newBalance = currentBalance + amount;

  // Update wallet
  const { error: wErr } = await supabase
    .from('wallets')
    .upsert(
      { user_id: userId, balance: newBalance, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );

  if (wErr) return { ok: false, error: wErr.message };

  // Update status transaksi → completed
  const { error: tErr } = await supabase
    .from('transactions')
    .update({ status: 'completed' })
    .eq('id', txId);

  if (tErr) return { ok: false, error: tErr.message };

  await sendNotification(
    userId,
    'pembayaran',
    'Deposit Berhasil',
    `Dana sebesar Rp ${amount.toLocaleString('id-ID')} berhasil ditambahkan ke dompet kamu.`
  );

  return { ok: true, newBalance };
}