// controller/walletController.ts

import { Request, Response } from "express";
import { supabase } from "../config/supabaseClient";
import { WithdrawPayload, CreditWalletPayload } from "../models/Walletmodel";

// ─── Helper: get or create wallet ────────────────────────────────────────────
async function getOrCreateWallet(userId: string) {
  let { data: wallet, error } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .single();

  // Handles users who existed before the trigger was added
  if (error || !wallet) {
    const { data: newWallet, error: createError } = await supabase
      .from("wallets")
      .insert({ user_id: userId, balance: 0, pending: 0 })
      .select()
      .single();

    if (createError)
      throw new Error(`Gagal membuat dompet: ${createError.message}`);
    wallet = newWallet;
  }

  return wallet;
}

// ─── GET /api/wallet/:userId ──────────────────────────────────────────────────
// Returns wallet balance + last 10 transactions
export const getWallet = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  try {
    const wallet = await getOrCreateWallet(userId);

    // Uses your exact transactions columns: description, auction_id, status
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select(
        "id, user_id, type, amount, description, auction_id, status, created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (txError) {
      res.status(500).json({ error: txError.message });
      return;
    }

    res.status(200).json({ wallet, transactions: transactions ?? [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/wallet/:userId/transactions ─────────────────────────────────────
// Paginated full transaction history
export const getTransactions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { userId } = req.params;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from("transactions")
    .select(
      "id, user_id, type, amount, description, auction_id, status, created_at",
      { count: "exact" },
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res
    .status(200)
    .json({ transactions: data ?? [], total: count ?? 0, page, limit });
};

// ─── POST /api/wallet/:userId/withdraw ───────────────────────────────────────
export const withdraw = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { amount, description }: WithdrawPayload = req.body;

  if (!amount || amount <= 0) {
    res.status(400).json({ error: "Jumlah penarikan harus lebih dari 0." });
    return;
  }

  try {
    const wallet = await getOrCreateWallet(userId);

    if (wallet.balance < amount) {
      res.status(400).json({ error: "Saldo tidak mencukupi." });
      return;
    }

    // Deduct from wallets.balance
    const { error: updateError } = await supabase
      .from("wallets")
      .update({
        balance: wallet.balance - amount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      res.status(500).json({ error: updateError.message });
      return;
    }

    // Record in transactions — using your exact column names
    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: "withdrawal",
        amount, // bigint
        description: description || "Penarikan dana", // your column
        auction_id: null, // your column
        status: "completed",
      })
      .select()
      .single();

    if (txError) {
      res.status(500).json({ error: txError.message });
      return;
    }

    res.status(200).json({ message: "Penarikan berhasil.", transaction: tx });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/wallet/credit ──────────────────────────────────────────────────
// Internal use: called after auction completes to pay the seller
// Also usable for refunds to buyers
export const creditWallet = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    user_id,
    amount,
    type,
    auction_id,
    description,
  }: CreditWalletPayload = req.body;

  if (!user_id || !amount || amount <= 0 || !type) {
    res.status(400).json({ error: "user_id, amount, dan type wajib diisi." });
    return;
  }

  try {
    const wallet = await getOrCreateWallet(user_id);

    const { error: updateError } = await supabase
      .from("wallets")
      .update({
        balance: wallet.balance + amount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user_id);

    if (updateError) {
      res.status(500).json({ error: updateError.message });
      return;
    }

    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .insert({
        user_id,
        type,
        amount, // bigint
        description: description ?? null,
        auction_id: auction_id ?? null,
        status: "completed",
      })
      .select()
      .single();

    if (txError) {
      res.status(500).json({ error: txError.message });
      return;
    }

    res
      .status(200)
      .json({ message: "Saldo berhasil ditambahkan.", transaction: tx });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/wallet/:userId/pending/add ────────────────────────────────────
// Called right when an auction closes — holds funds until confirmed
export const addPending = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { userId } = req.params;
  const { amount, auction_id, description } = req.body;

  if (!amount || amount <= 0) {
    res.status(400).json({ error: "Amount tidak valid." });
    return;
  }

  try {
    const wallet = await getOrCreateWallet(userId);

    const { error } = await supabase
      .from("wallets")
      .update({
        pending: wallet.pending + amount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const { data: tx } = await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: "auction_payout",
        amount,
        description: description ?? "Menunggu konfirmasi lelang",
        auction_id: auction_id ?? null,
        status: "pending",
      })
      .select()
      .single();

    res.status(200).json({ message: "Pending ditambahkan.", transaction: tx });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/wallet/:userId/pending/release ────────────────────────────────
// Moves pending → real balance and marks the transaction completed
export const releasePending = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { userId } = req.params;
  const { amount, transaction_id } = req.body;

  if (!amount || amount <= 0) {
    res.status(400).json({ error: "Amount tidak valid." });
    return;
  }

  try {
    const wallet = await getOrCreateWallet(userId);

    if (wallet.pending < amount) {
      res.status(400).json({ error: "Jumlah pending tidak mencukupi." });
      return;
    }

    const { error } = await supabase
      .from("wallets")
      .update({
        pending: wallet.pending - amount,
        balance: wallet.balance + amount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    if (transaction_id) {
      await supabase
        .from("transactions")
        .update({ status: "completed" })
        .eq("id", transaction_id);
    }

    res.status(200).json({ message: "Pending berhasil dicairkan." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
