"use client";
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
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const transactions = [
  {
    id: "TR-99281",
    type: "income",
    title: "Auction Payout: Yellowfin Tuna",
    date: "Today, 14:30",
    amount: "+ Rp 15.000.000",
    status: "Completed",
  },
  {
    id: "WT-44102",
    type: "withdrawal",
    title: "Bank Transfer (Mandiri)",
    date: "Yesterday, 09:15",
    amount: "- Rp 20.000.000",
    status: "Completed",
  },
  {
    id: "TR-99280",
    type: "income",
    title: "Auction Payout: Skipjack Batch",
    date: "Oct 24, 16:45",
    amount: "+ Rp 8.500.000",
    status: "Completed",
  },
  {
    id: "TR-99271",
    type: "income",
    title: "Auction Payout: Red Snapper",
    date: "Oct 22, 11:00",
    amount: "+ Rp 11.200.000",
    status: "Completed",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function DompetPage() {
  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <SideFisherman />

      {/* Main Content */}
      <div className={styles.mainWrapper}>
        {/* Top Navbar */}
        <NavbarFisherman />

        <main className={styles.main}>
          {/* ── Page Header ── */}
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>Dompet</h1>
              <p className={styles.pageSubtitle}>
                Manage your maritime earnings and withdrawals.
              </p>
            </div>
            <button className={styles.withdrawBtn}>
              <Wallet size={16} />
              Withdraw Funds
            </button>
          </div>

          {/* ── Balance Card ── */}
          <div className={styles.balanceCard}>
            <div className={styles.balanceLeft}>
              <span className={styles.balanceLabel}>
                TOTAL AVAILABLE BALANCE
              </span>
              <span className={styles.balanceAmount}>Rp 48.500.000</span>
              <span className={styles.balanceSafe}>
                <span className={styles.safeIcon}>✓</span> Funds are secure and
                ready for withdrawal.
              </span>
            </div>
            <div className={styles.pendingBox}>
              <span className={styles.pendingLabel}>PENDING CLEARANCE</span>
              <span className={styles.pendingAmount}>Rp 12.200.000</span>
            </div>
          </div>

          {/* ── Earnings Overview ── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Earnings Overview</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statTopRow}>
                  <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                    <TrendingUp size={18} />
                  </div>
                  <span className={styles.statBadge}>This Month</span>
                </div>
                <span className={styles.statLabel}>TOTAL EARNED</span>
                <span className={styles.statValue}>Rp 82.400.000</span>
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
                <span className={styles.statValue}>14</span>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statTopRow}>
                  <div className={`${styles.statIcon} ${styles.statIconGray}`}>
                    <Landmark size={18} />
                  </div>
                  <span className={styles.statBadge}>All Time</span>
                </div>
                <span className={styles.statLabel}>TOTAL WITHDRAWN</span>
                <span className={styles.statValue}>Rp 340.000.000</span>
              </div>
            </div>
          </section>

          {/* ── Recent Transactions ── */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recent Transactions</h2>
              <button className={styles.viewAllBtn}>
                View All <ChevronRight size={14} />
              </button>
            </div>

            <div className={styles.transactionList}>
              {transactions.map((tx) => (
                <div key={tx.id} className={styles.txRow}>
                  <div
                    className={`${styles.txIcon} ${tx.type === "income" ? styles.txIconIncome : styles.txIconWithdraw}`}
                  >
                    <ArrowDownToLine
                      size={16}
                      style={{
                        transform:
                          tx.type === "withdrawal" ? "rotate(180deg)" : "none",
                      }}
                    />
                  </div>
                  <div className={styles.txInfo}>
                    <span className={styles.txTitle}>{tx.title}</span>
                    <span className={styles.txMeta}>
                      {tx.date} • ID: {tx.id}
                    </span>
                  </div>
                  <div className={styles.txRight}>
                    <span
                      className={`${styles.txAmount} ${tx.type === "income" ? styles.txAmountIncome : styles.txAmountWithdraw}`}
                    >
                      {tx.amount}
                    </span>
                    <span className={styles.txStatus}>{tx.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
