"use client";

import { useEffect, useState } from "react";
import styles from "./DompetPage.module.css";
import SideFisherman from "../../components/sideFisherman";
import NavbarFisherman from "../../components/NavbarFisherman";
import { useRouter } from 'next/navigation';
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

export default function DompetPage() {
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
  
  const router = useRouter();
   const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className={styles.layout}>
      <SideFisherman
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                />
      <div className={styles.mainWrapper}>
        <NavbarFisherman setSidebarOpen={setSidebarOpen}/>
        <main className={styles.main}>
          {/* Header */}
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>Dompet</h1>
              <p className={styles.pageSubtitle}>
                Kelola penghasilan dan penarikan Anda.
              </p>
            </div>
            <button className={styles.withdrawBtn} onClick={() => router.push(`/fisherman/withdraw`)}>
              <Wallet size={16} /> Tarik Dana
            </button>
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

          {data && (
            <>
              {/* Balance Card */}
              <div className={styles.balanceCard}>
                <div className={styles.balanceLeft}>
                  <span className={styles.balanceLabel}>
                    TOTAL SALDO TERSEDIA
                  </span>
                  <span className={styles.balanceAmount}>
                    {formatRupiah(data.wallet.balance)}
                  </span>
                  <span className={styles.balanceSafe}>
                    <span className={styles.safeIcon}>✓</span> Dana aman dan siap ditarik.
                  </span>
                </div>
                <div className={styles.pendingBox}>
                  <span className={styles.pendingLabel}>menunggu proses</span>
                  <span className={styles.pendingAmount}>
                    {formatRupiah(data.wallet.pending)}
                  </span>
                </div>
              </div>

              {/* Earnings Overview */}
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Ringkasan Pendapatan</h2>
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statTopRow}>
                      <div
                        className={`${styles.statIcon} ${styles.statIconBlue}`}
                      >
                        <TrendingUp size={18} />
                      </div>
                      <span className={styles.statBadge}>Terbaru</span>
                    </div>
                    <span className={styles.statLabel}>Total Pendapatan</span>
                    <span className={styles.statValue}>
                      {formatRupiah(totalEarned)}
                    </span>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statTopRow}>
                      <div
                        className={`${styles.statIcon} ${styles.statIconOrange}`}
                      >
                        <Anchor size={18} />
                      </div>
                      <span className={styles.statBadge}>Lelang</span>
                    </div>
                    <span className={styles.statLabel}>Lelang Sukses</span>
                    <span className={styles.statValue}>{successfulBids}</span>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statTopRow}>
                      <div
                        className={`${styles.statIcon} ${styles.statIconGray}`}
                      >
                        <Landmark size={18} />
                      </div>
                      <span className={styles.statBadge}>Terbaru</span>
                    </div>
                    <span className={styles.statLabel}>Total Penarikan</span>
                    <span className={styles.statValue}>
                      {formatRupiah(totalWithdrawn)}
                    </span>
                  </div>
                </div>
              </section>

              {/* Recent Transactions */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Transaksi Terbaru</h2>
                  <button className={styles.viewAllBtn} onClick={() => router.push(`/fisherman/transactionDetail`)}>
                    Lihat Semua <ChevronRight size={14} />
                  </button>
                </div>
                <div className={styles.transactionList}>
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
                  {data.transactions.slice(0, 5).map((tx: Transaction) => (
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
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
