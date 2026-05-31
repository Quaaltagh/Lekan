'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft} from 'lucide-react';
import styles from './page.module.css';
import SideFisherman from '../../components/sideFisherman';
import NavbarFisherman from '../../components/NavbarFisherman';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Wallet,
  ArrowDownToLine,
  TrendingUp,
  Anchor,
  Landmark,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  walletService,
  formatRupiah,
  formatTxDate,
  txLabel,
  isIncome,
  type Wallet as WalletType,
  type Transaction,
} from "../../../services/walletService";

const formatTxStatus = (status: string) => {
  const map: Record<string, string> = {
    completed: 'Selesai',
    pending: 'Diproses',
    failed: 'Gagal',
    cancelled: 'Dibatalkan',
  };
  return map[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
};

export default function TransactionDetail(){
    const [data, setData] = useState<{ wallet: WalletType; transactions: Transaction[] } | null>(null);

    const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("lekan_user"); // ← ganti ini
    const token = localStorage.getItem("lekan_token"); // ← dan ini

    if (!raw || !token) {
      setError("Sesi tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }

    const { id: userId } = JSON.parse(raw);

    walletService
      .getWallet(userId, token)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

    // Derived stats from the last 10 transactions in the response
      const totalEarned =
        data?.transactions
          .filter((tx: Transaction) => tx.type === "auction_payout" && tx.status === "completed")
          .reduce((s: number, tx: Transaction) => s + tx.amount, 0) ?? 0;
    
      const successfulBids =
        data?.transactions.filter(
          (tx: Transaction) => tx.type === "auction_payout" && tx.status === "completed",
        ).length ?? 0;
    
      const totalWithdrawn =
        data?.transactions
          .filter((tx: Transaction) => tx.type === "withdrawal" && tx.status === "completed")
          .reduce((s: number, tx: Transaction) => s + tx.amount, 0) ?? 0;
      

    const [sidebarOpen, setSidebarOpen] = useState(false);
      const router  = useRouter();

    return(
        <div className={styles.all}>
            <SideFisherman
                        sidebarOpen={sidebarOpen}
                        setSidebarOpen={setSidebarOpen}
                      />
            <div className={styles.container}>
                <NavbarFisherman setSidebarOpen={setSidebarOpen}/>

                <div className={styles.content}>
                    
                    <div className={styles.notiHeader}>
                        <button onClick={() => router.back()} className={styles.backLink}>
                                    <ArrowLeft size={16} /> Kembali
                                  </button>
                        <div>
                        <h1 className={styles.notiTitle}>Riwayat Transaksi</h1>
                        <p className={styles.notiDescription}>
                            Kelola dana Anda dan lihat aktivitas keuangan terbaru.
                        </p>
                        </div>
                        
                    </div>
                    {/* Loading */}
                    {loading && (
                        <div
                        style={{ display: "flex", justifyContent: "center", padding: 60 }}
                        >
                        <Loader2
                            size={32}
                            style={{
                            animation: "spin 1s linear infinite",
                            color: "#1e3a8a",
                            }}
                        />
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div
                        style={{
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            borderRadius: 12,
                            padding: "16px 20px",
                            color: "#dc2626",
                            marginBottom: 24,
                        }}
                        >
                        {error}
                        </div>
                    )}
                    <div className={styles.transactionList}>
                        {data && (
                            <>
                    {data.transactions.length === 0 && (
                        <div
                        style={{
                            padding: 32,
                            textAlign: "center",
                            color: "#94a3b8",
                            fontSize: 14,
                        }}
                        >
                        Belum ada transaksi.
                        </div>
                    )}
                    {data.transactions.map((tx: Transaction) => (
                        <div key={tx.id} className={styles.txRow}>
                        <div
                            className={`${styles.txIcon} ${isIncome(tx) ? styles.txIconIncome : styles.txIconWithdraw}`}
                        >
                            <ArrowDownToLine
                            size={16}
                            style={{
                                transform: !isIncome(tx)
                                ? "rotate(180deg)"
                                : "none",
                            }}
                            />
                        </div>
                        <div className={styles.txInfo}>
                            <span className={styles.txTitle}>{txLabel(tx)}</span>
                            <span className={styles.txMeta}>
                            {formatTxDate(tx.created_at)} • ID:{" "}
                            {tx.id.slice(0, 8).toUpperCase()}
                            </span>
                        </div>
                        <div className={styles.txRight}>
                            <span
                            className={`${styles.txAmount} ${isIncome(tx) ? styles.txAmountIncome : styles.txAmountWithdraw}`}
                            >
                            {isIncome(tx) ? "+" : "-"} {formatRupiah(tx.amount)}
                            </span>
                            <span className={styles.txStatus}>
                            {formatTxStatus(tx.status)}
                            </span>
                        </div>
                        </div>
                        
                    ))}
                    </>
                    )}
                    </div>
                </div>

                
            </div>
        </div>
    );
}