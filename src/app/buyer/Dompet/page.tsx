"use client";

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import Navbar from '@/app/components/Navbar';
import { Landmark, Coins, Receipt, MoveDownLeft, Handbag, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  walletService, Wallet, Transaction,
  formatRupiah, formatTxDate, txLabel, isIncome,
} from '@/services/walletService';

function txIcon(type: string) {
  switch (type) {
    case 'deposit':
    case 'auction_payout':
    case 'refund':   return <MoveDownLeft size={24} />;
    case 'fee':      return <Receipt size={24} />;
    default:         return <Coins size={24} />;
  }
}

const WalletDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const router = useRouter();

  const [wallet,       setWallet]       = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalSpent,   setTotalSpent]   = useState(0);
  const [activeBids,   setActiveBids]   = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  // ── FIX: tunggu AuthContext selesai hydrate sebelum redirect ──────────────
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!user || !token) { router.push('/'); return; }

    async function fetchAll() {
      try {
        const { wallet: w, transactions: recentTx } = await walletService.getWallet(user!.id, token!);
        setWallet(w);
        setTransactions(recentTx);
        const spent = recentTx
          .filter(tx => !isIncome(tx) && tx.status === 'completed')
          .reduce((s, tx) => s + tx.amount, 0);
        setTotalSpent(spent);

        const b = await walletService.getActiveBidsCount(user!.id, token!);
        setActiveBids(b.count);
      } catch (err) {
        setError('Gagal memuat data dompet.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [authReady, user, token, router]);

  // Tampilkan loading ringan saat auth belum siap
  if (!authReady) {
    return (
      <div className={styles.container}>
        <Navbar />
        <main className={styles.mainContent}>
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
            Memuat...
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={styles.container}>
      <Navbar />
      <main className={styles.mainContent}>

        <header className={styles.header}>
          <h1 className={styles.title}>Dompet</h1>
          <p className={styles.subtitle}>Kelola dana Anda dan lihat aktivitas keuangan terbaru.</p>
        </header>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* Balance Cards */}
        <div className={styles.cardGrid}>
          <div className={styles.balanceCard}>
            <div className={styles.balanceHeader}>
              <div className={styles.balance}>
                <span className={styles.label}>SALDO TERSEDIA</span>
                {loading
                  ? <Loader2 size={20} color="#fff" style={{ marginTop: '0.5rem' }} />
                  : <h2 className={styles.amount}>{formatRupiah(wallet?.balance ?? 0)}</h2>
                }
              </div>
              <div className={styles.bankIcon}><Landmark size={24} color='#fcfcfc' /></div>
            </div>
            <div className={styles.buttonGroup}>
              <button className={styles.btnDeposit} onClick={() => router.push('/buyer/Deposit')}>
                + Setor Dana
              </button>
              <button className={styles.btnTransfer}>Transfer</button>
            </div>
          </div>

          <div className={styles.spendingCard}>
            <div className={styles.spendingHeader}>
              <span className={styles.label}>TOTAL PENGELUARAN</span>
              <span className={styles.bagIcon}><Handbag size={24} color='#000000' /></span>
            </div>
            {loading
              ? <div style={{ height: '2rem', background: '#e2e8f0', borderRadius: '4px', width: '50%', margin: '0.5rem 0' }} />
              : <h2 className={styles.spentAmount}>{formatRupiah(totalSpent)}</h2>
            }
            <p className={styles.periodText}>Periode tagihan ini</p>
            <div className={styles.spendingFooter}>
              <div>
                <span className={styles.subLabel}>Penawaran Aktif</span>
                <p className={styles.footerValue}>{loading ? '—' : `${activeBids} Lots`}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={styles.subLabel}>Tertunda</span>
                <p className={`${styles.footerValue} ${styles.blueText}`}>
                  {loading ? '—' : formatRupiah(wallet?.pending ?? 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <section className={styles.transactionSection}>
          <div className={styles.sectionHeader}>
            <h3>Transaksi Terbaru</h3>
            <a href="/buyer/transactionHistory" className={styles.viewAll}>Lihat Semua →</a>
          </div>

          <div className={styles.transactionList}>
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className={styles.transactionItem}>
                  <div style={{ height: '1rem', background: '#e2e8f0', borderRadius: '4px', width: '60%' }} />
                </div>
              ))
            ) : transactions.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                Belum ada transaksi
              </div>
            ) : (
              transactions.slice(0, 10).map(tx => (
                <div key={tx.id} className={styles.transactionItem}>
                  <div className={styles.transactionDescription}>
                    <div className={styles.txIcon}>{txIcon(tx.type)}</div>
                    <div className={styles.txInfo}>
                      <p className={styles.txTitle}>{txLabel(tx)}</p>
                      <p className={styles.txDesc}>{formatTxDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <div className={styles.txAmountContainer}>
                    <p className={`${styles.txAmount} ${isIncome(tx) ? styles.positive : styles.negative}`}>
                      {isIncome(tx) ? '+' : '-'}{formatRupiah(tx.amount)}
                    </p>
                    {/* <p className={styles.txDate}>{tx.status.toUpperCase()}</p> */}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </main>
    </div>
  );
};

export default WalletDashboard;