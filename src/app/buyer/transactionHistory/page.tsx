'use client';
import { Coins, Receipt, MoveDownLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import styles from '@/app/buyer/transactionHistory/page.module.css';
import Navbar from '@/app/components/Navbar';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  walletService, Transaction,
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

const PAGE_SIZE = 20;

export default function TransactionHistory() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total,        setTotal]        = useState(0);
  const [page,         setPage]         = useState(1);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  // ── FIX: tunggu AuthContext selesai hydrate sebelum redirect ──────────────
  // authReady = true setelah useEffect pertama jalan (setelah mount di client)
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Tandai bahwa AuthContext sudah selesai di-read dari localStorage
    setAuthReady(true);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchPage = useCallback(async (p: number) => {
    if (!user?.id || !token) return;
    setLoading(true);
    setError('');
    try {
      const res = await walletService.getTransactions(user.id, token, p, PAGE_SIZE);
      setTransactions(res.transactions);
      setTotal(res.total);
    } catch (err) {
      setError('Gagal memuat riwayat transaksi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, token]);

  useEffect(() => {
    // Tunggu authReady dulu — jangan redirect saat masih hydrating
    if (!authReady) return;

    if (!user || !token) {
      router.push('/');
      return;
    }

    fetchPage(page);
  }, [authReady, user, token, page, fetchPage, router]);

  // Selama auth belum siap, tampilkan loading ringan — jangan render apapun
  // yang membutuhkan user (mencegah flash redirect)
  if (!authReady) {
    return (
      <div className={styles.all}>
        <Navbar />
        <main className={styles.mainContainer}>
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
            Memuat...
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={styles.all}>
      <div className={styles.container}>
      <Navbar />
      <main className={styles.mainContainer}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.notiHeader}>
            <div>
              <h1 className={styles.notiTitle}>Riwayat Transaksi</h1>
              <p className={styles.notiDescription}>
                Kelola dana Anda dan lihat aktivitas keuangan terbaru.
              </p>
            </div>
            <Link href="/buyer/Dompet" className={styles.viewAll}>
              ← Kembali ke halaman Dompet
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <section className={styles.transactionSection}>
          <div className={styles.transactionList}>

            {loading ? (
              [1, 2, 3, 4, 5].map(i => (
                <div key={i} className={styles.transactionItem}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e2e8f0', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: '0.85rem', background: '#e2e8f0', borderRadius: 4, width: '55%', marginBottom: '0.4rem' }} />
                      <div style={{ height: '0.75rem', background: '#f1f5f9', borderRadius: 4, width: '35%' }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ height: '0.85rem', background: '#e2e8f0', borderRadius: 4, width: 80, marginBottom: '0.4rem' }} />
                    <div style={{ height: '0.75rem', background: '#f1f5f9', borderRadius: 4, width: 60 }} />
                  </div>
                </div>
              ))
            ) : transactions.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                Belum ada transaksi
              </div>
            ) : (
              transactions.map(tx => (
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
                    <p className={styles.txDate}>{tx.status.toUpperCase()}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {!loading && total > PAGE_SIZE && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '0.5rem 0.9rem', borderRadius: '0.6rem',
                  border: '1px solid #e2e8f0',
                  background: page === 1 ? '#f8fafc' : 'white',
                  color: page === 1 ? '#cbd5e1' : '#334155',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem', fontWeight: 600,
                }}
              >
                <ChevronLeft size={16} /> Sebelumnya
              </button>

              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                {page} / {totalPages}
              </span>

              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === totalPages}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '0.5rem 0.9rem', borderRadius: '0.6rem',
                  border: '1px solid #e2e8f0',
                  background: page === totalPages ? '#f8fafc' : 'white',
                  color: page === totalPages ? '#cbd5e1' : '#334155',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem', fontWeight: 600,
                }}
              >
                Berikutnya <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Info total */}
          {!loading && total > 0 && (
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.75rem' }}>
              Menampilkan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} dari {total} transaksi
            </p>
          )}
        </section>

      </main>
    </div>
    </div>
  );
}