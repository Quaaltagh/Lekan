"use client";

import { useEffect, useState } from "react";
import styles from "./DompetPage.module.css";
import SideFisherman from "../../components/sideFisherman";
import NavbarFisherman from "../../components/NavbarFisherman";
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
  type WalletData,
  type Transaction,
} from "../../../services/walletService";

export default function DompetPage() {
  const [data, setData] = useState<WalletData | null>(null);
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
      .filter((tx) => tx.type === "auction_payout" && tx.status === "completed")
      .reduce((s, tx) => s + tx.amount, 0) ?? 0;

  const successfulBids =
    data?.transactions.filter(
      (tx) => tx.type === "auction_payout" && tx.status === "completed",
    ).length ?? 0;

  const totalWithdrawn =
    data?.transactions
      .filter((tx) => tx.type === "withdrawal" && tx.status === "completed")
      .reduce((s, tx) => s + tx.amount, 0) ?? 0;

  return (
    <div className={styles.layout}>
      <SideFisherman />
      <div className={styles.mainWrapper}>
        <NavbarFisherman />
        <main className={styles.main}>
          {/* Header */}
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>Dompet</h1>
              <p className={styles.pageSubtitle}>
                Manage your maritime earnings and withdrawals.
              </p>
            </div>
            <button className={styles.withdrawBtn}>
              <Wallet size={16} /> Withdraw Funds
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
                    TOTAL AVAILABLE BALANCE
                  </span>
                  <span className={styles.balanceAmount}>
                    {formatRupiah(data.wallet.balance)}
                  </span>
                  <span className={styles.balanceSafe}>
                    <span className={styles.safeIcon}>✓</span> Funds are secure
                    and ready for withdrawal.
                  </span>
                </div>
                <div className={styles.pendingBox}>
                  <span className={styles.pendingLabel}>PENDING CLEARANCE</span>
                  <span className={styles.pendingAmount}>
                    {formatRupiah(data.wallet.pending)}
                  </span>
                </div>
              </div>

              {/* Earnings Overview */}
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Earnings Overview</h2>
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statTopRow}>
                      <div
                        className={`${styles.statIcon} ${styles.statIconBlue}`}
                      >
                        <TrendingUp size={18} />
                      </div>
                      <span className={styles.statBadge}>Recent</span>
                    </div>
                    <span className={styles.statLabel}>TOTAL EARNED</span>
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
                      <span className={styles.statBadge}>Auctions</span>
                    </div>
                    <span className={styles.statLabel}>SUCCESSFUL BIDS</span>
                    <span className={styles.statValue}>{successfulBids}</span>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statTopRow}>
                      <div
                        className={`${styles.statIcon} ${styles.statIconGray}`}
                      >
                        <Landmark size={18} />
                      </div>
                      <span className={styles.statBadge}>Recent</span>
                    </div>
                    <span className={styles.statLabel}>TOTAL WITHDRAWN</span>
                    <span className={styles.statValue}>
                      {formatRupiah(totalWithdrawn)}
                    </span>
                  </div>
                </div>
              </section>

              {/* Recent Transactions */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Recent Transactions</h2>
                  <button className={styles.viewAllBtn}>
                    View All <ChevronRight size={14} />
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
                          {tx.status.charAt(0).toUpperCase() +
                            tx.status.slice(1)}
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
