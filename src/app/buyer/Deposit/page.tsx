'use client';
import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { Landmark, CreditCard, Wallet, QrCode, ShieldAlert, Headset, Info, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { walletService, formatRupiah } from '@/services/walletService';

const SERVICE_FEE     = 2_500;
const PRESET_AMOUNTS  = [50_000, 100_000, 500_000, 1_000_000];

type Method = 'bank_transfer' | 'e_wallet' | 'card' | 'qris';
type Status  = 'idle' | 'loading' | 'success' | 'error';

const METHODS: { id: Method; label: string; sub: string; icon: React.ReactNode }[] = [
  { id: 'bank_transfer', label: 'Bank Transfer', sub: 'BCA, Mandiri, BNI, BRI', icon: <Landmark   size={24} color="#004370" /> },
  { id: 'e_wallet',      label: 'E-Wallet',      sub: 'OVO, DANA, GoPay',       icon: <Wallet     size={24} color="#004370" /> },
  { id: 'card',          label: 'Cards',          sub: 'Visa, Mastercard',       icon: <CreditCard size={24} color="#004370" /> },
  { id: 'qris',          label: 'QRIS',           sub: 'Scan & Pay',             icon: <QrCode     size={24} color="#004370" /> },
];

function parseInput(raw: string): number {
  return parseInt(raw.replace(/\D/g, ''), 10) || 0;
}

const DepositPage: React.FC = () => {
  const { user, token } = useAuth();
  const router = useRouter();

  const [preset,    setPreset]    = useState<number | null>(100_000);
  const [custom,    setCustom]    = useState('');
  const [method,    setMethod]    = useState<Method>('bank_transfer');
  const [walletBal, setWalletBal] = useState<number | null>(null);
  const [status,    setStatus]    = useState<Status>('idle');
  const [errMsg,    setErrMsg]    = useState('');

  const amount = custom ? parseInput(custom) : (preset ?? 0);
  const total  = amount > 0 ? amount + SERVICE_FEE : 0;

  // ── Fetch wallet balance ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !token) { router.push('/'); return; }

    walletService.getWallet(user.id, token)
      .then(({ wallet }) => setWalletBal(wallet.balance))
      .catch(() => setWalletBal(0));
  }, [user, token, router]);

  // ── Submit deposit ────────────────────────────────────────────────────────
  const handleDeposit = async () => {
    if (!user || !token) return;
    if (amount < 10_000) { setErrMsg('Minimum deposit Rp 10.000.'); return; }

    setErrMsg('');
    setStatus('loading');

    try {
      await walletService.deposit(user.id, token, amount, `Deposit via ${method}`);
      setWalletBal(prev => (prev ?? 0) + amount);
      setStatus('success');
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Deposit gagal.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setErrMsg('');
    setCustom('');
    setPreset(100_000);
  };

  if (!user) return null;

  // ── Success state ─────────────────────────────────────────────────────────
  if (status === 'success') return (
    <div className={styles.all}>
      <Navbar />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem', textAlign: 'center' }}>
        <CheckCircle2 size={64} color="#16a34a" />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Deposit Berhasil!</h2>
        <p style={{ color: '#64748b' }}>{formatRupiah(amount)} telah ditambahkan ke saldo Anda.</p>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Saldo baru: {formatRupiah(walletBal ?? 0)}</p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            onClick={handleReset}
            style={{ padding: '0.625rem 1.5rem', background: '#004370', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Deposit Lagi
          </button>
          <button
            onClick={() => router.push('/buyer/Dompet')}
            style={{ padding: '0.625rem 1.5rem', background: 'white', color: '#004370', border: '1px solid #004370', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Lihat Dompet
          </button>
        </div>
      </div>
    </div>
  );

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className={styles.all}>
      <Navbar />
      <div className={styles.container}>

        <div className={styles.mainContent}>
          {/* Balance Header */}
          <header className={styles.balanceHeader}>
            <p className={styles.label}>TOTAL BALANCE</p>
            <h1 className={styles.balanceValue}>
              {walletBal !== null ? formatRupiah(walletBal) : '—'}
            </h1>
            <p className={styles.subtext}>Available for bidding</p>
          </header>

          {/* Step 1: Amount */}
          <section className={styles.stepSection}>
            <div className={styles.stepTitle}>
              <span className={styles.stepNumber}>1</span>
              <h3>Select Deposit Amount</h3>
            </div>

            <div className={styles.amountGrid}>
              {PRESET_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  className={`${styles.amountBtn} ${preset === amt && !custom ? styles.activeAmount : ''}`}
                  onClick={() => { setPreset(amt); setCustom(''); }}
                >
                  {formatRupiah(amt)}
                </button>
              ))}
            </div>

            <div className={styles.customInputWrapper}>
              <label>CUSTOM AMOUNT</label>
              <div className={styles.inputField}>
                <span>Rp</span>
                <input
                  type="text"
                  placeholder="Enter amount..."
                  value={custom}
                  onChange={e => { setCustom(e.target.value); setPreset(null); }}
                />
              </div>
            </div>
          </section>

          {/* Step 2: Payment Method */}
          <section className={styles.stepSection}>
            <div className={styles.stepTitle}>
              <span className={styles.stepNumber}>2</span>
              <h3>Payment Method</h3>
            </div>

            <div className={styles.methodGrid}>
              {METHODS.map(m => (
                <div
                  key={m.id}
                  className={`${styles.methodCard} ${method === m.id ? styles.selectedMethod : ''}`}
                  onClick={() => setMethod(m.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.methodIcon}>{m.icon}</div>
                  <div className={styles.methodText}>
                    <p className={styles.methodName}>{m.label}</p>
                    <p className={styles.methodSub}>{m.sub}</p>
                  </div>
                  {method === m.id && <div className={styles.checkIcon}>✔️</div>}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.safetyCard}>
            <p className={styles.safetyLabel}>SAFETY DEPOSIT</p>
            <p className={styles.safetyValue}>Rp 2.000.000</p>
            <p className={styles.safetySub}>Reserved for insurance compliance</p>
          </div>

          <div className={styles.summaryCard}>
            <h3>Summary</h3>
            <div className={styles.summaryRow}>
              <span>Amount</span>
              <span>{amount > 0 ? formatRupiah(amount) : '—'}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Service Fee</span>
              <span>{formatRupiah(SERVICE_FEE)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Admin Fee</span>
              <span className={styles.freeText}>Free</span>
            </div>
            <div className={styles.totalRow}>
              <div className={styles.totalLabel}>
                <p>Total</p>
                <p>Bill</p>
              </div>
              <p className={styles.totalAmount}>{total > 0 ? formatRupiah(total) : '—'}</p>
            </div>

            <div className={styles.infoBox}>
              <div className={styles.infoIcon}><Info size={24} color="#000" /></div>
              <p>Deposits via Bank Transfer usually settle within 2–5 minutes after verification.</p>
            </div>

            {errMsg && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                <XCircle size={16} /> {errMsg}
              </div>
            )}

            <button
              className={styles.btnDeposit}
              onClick={handleDeposit}
              disabled={status === 'loading' || amount < 10_000}
              style={{ opacity: status === 'loading' || amount < 10_000 ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {status === 'loading' && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
              {status === 'loading' ? 'Memproses...' : 'Deposit Now'}
            </button>

            <div className={styles.secureText}>
              <div className={styles.secureIcon}><ShieldAlert size={24} color="#000" /></div>
              <p>Secured by Maritime Exchange Payment Engine</p>
            </div>
          </div>

          <div className={styles.helpCard}>
            <div className={styles.helpIcon}><Headset size={24} color="#adb5bd" /></div>
            <div>
              <p className={styles.helpTitle}>Need help?</p>
              <p className={styles.helpSub}>Contact 24/7 Priority Support</p>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default DepositPage;