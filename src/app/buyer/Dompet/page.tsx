"use client";

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import Navbar from '@/app/components/Navbar';
import { Landmark, Coins, Receipt, MoveDownLeft, Handbag, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  escrowed: number;
}

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  auction_id?: string;
  created_at: string;
}

function txIcon(type: string) {
  switch (type) {
    case 'deposit':  return <MoveDownLeft size={24} />;
    case 'fee':      return <Receipt size={24} />;
    default:         return <Coins size={24} />;
  }
}

function formatRp(value: number) {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}M`;
  return `Rp ${value.toLocaleString('id-ID')}`;
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

  useEffect(() => {
    if (!user) { router.push('/'); return; }

    async function fetchAll() {
      try {
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        // Wallet balance
        const wRes = await fetch(`${API_URL}/api/wallet/${user!.id}`, { headers });
        if (wRes.ok) setWallet(await wRes.json());

        // Transactions
        const tRes = await fetch(`${API_URL}/api/wallet/${user!.id}/transactions`, { headers });
        if (tRes.ok) {
          const raw = await tRes.json();
          // ✅ Pastikan selalu array, apapun bentuk response-nya
          const txData: Transaction[] = Array.isArray(raw) ? raw : (raw?.data ?? raw?.transactions ?? []);
          setTransactions(txData);
          const spent = txData
            .filter(t => t.type !== 'deposit' && t.status === 'completed')
            .reduce((s, t) => s + t.amount, 0);
          setTotalSpent(spent);
        }

        // Active bids count
        const bRes = await fetch(`${API_URL}/api/bids/user/${user!.id}/active`, { headers });
        if (bRes.ok) {
          const bData = await bRes.json();
          setActiveBids(bData.count ?? 0);
        }

      } catch (err) {
        console.error('fetchAll error:', err);
        setError('Gagal memuat data dompet.');
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [user, token, router]);

  if (!user) return null;

  return (
    <div className={styles.container}>
      <Navbar />

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1 className={styles.title}>Dompet</h1>
          <p className={styles.subtitle}>Manage your funds and view recent financial activity.</p>
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
                <span className={styles.label}>AVAILABLE BALANCE</span>
                {loading
                  ? <Loader2 size={20} color="#fff" style={{ marginTop: '0.5rem' }} />
                  : <h2 className={styles.amount}>{formatRp(wallet?.balance ?? 0)}</h2>
                }
              </div>
              <div className={styles.bankIcon}><Landmark size={24} color='#fcfcfc' /></div>
            </div>
            <div className={styles.buttonGroup}>
              <button className={styles.btnDeposit}>+ Deposit Funds</button>
              <button className={styles.btnTransfer}>Transfer</button>
            </div>
          </div>

          <div className={styles.spendingCard}>
            <div className={styles.spendingHeader}>
              <span className={styles.label}>TOTAL SPENT</span>
              <span className={styles.bagIcon}><Handbag size={24} color='#000000' /></span>
            </div>
            {loading
              ? <div style={{ height: '2rem', background: '#e2e8f0', borderRadius: '4px', width: '50%', margin: '0.5rem 0' }} />
              : <h2 className={styles.spentAmount}>{formatRp(totalSpent)}</h2>
            }
            <p className={styles.periodText}>This billing period</p>
            <div className={styles.spendingFooter}>
              <div>
                <span className={styles.subLabel}>Active Bids</span>
                <p className={styles.footerValue}>{loading ? '—' : `${activeBids} Lots`}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={styles.subLabel}>Escrowed</span>
                <p className={`${styles.footerValue} ${styles.blueText}`}>
                  {loading ? '—' : formatRp(wallet?.escrowed ?? 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <section className={styles.transactionSection}>
          <div className={styles.sectionHeader}>
            <h3>Recent Transactions</h3>
            <a href="#" className={styles.viewAll}>View All →</a>
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
                      <p className={styles.txTitle}>{tx.description}</p>
                      <p className={styles.txDesc}>
                        {new Date(tx.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className={styles.txAmountContainer}>
                    <p className={`${styles.txAmount} ${tx.type === 'deposit' ? styles.positive : styles.negative}`}>
                      {tx.type === 'deposit' ? '+' : '-'}{formatRp(tx.amount)}
                    </p>
                    <p className={styles.txDate}>{tx.status.toUpperCase()}</p>
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