'use client'
import { ArrowLeft, Clock, ShieldCheck, Truck, MessageSquare, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuctionDetail {
  id: string;
  name: string;
  species?: string;
  grade?: string;
  weight_kg: number;
  start_price: number;
  current_bid?: number;
  status: string;
  ends_at: string;
  image_url?: string;
  seller_id: string;
  created_at: string;
}

interface BidEntry {
  id: string;
  bidder_id: string;
  amount: number;
  created_at: string;
}

interface SellerProfile {
  full_name?: string;
  vessel_name?: string;
  verified?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCountdown(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'Berakhir';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { user, token } = useAuth();

  const [auction,    setAuction]    = useState<AuctionDetail | null>(null);
  const [seller,     setSeller]     = useState<SellerProfile | null>(null);
  const [bids,       setBids]       = useState<BidEntry[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [bidAmount,  setBidAmount]  = useState('');
  const [countdown,  setCountdown]  = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bidError,   setBidError]   = useState('');
  const [bidSuccess, setBidSuccess] = useState('');

  const walletBalance = 0; // TODO: sambungkan ke wallet API

  // ── Fetch auction + bids ──────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;

    async function fetchAll() {
      try {
        // Fetch auction detail
        const aRes = await fetch(`${API_URL}/api/auctions/${id}`);
        if (!aRes.ok) throw new Error('Lelang tidak ditemukan.');
        const aData: AuctionDetail = await aRes.json();
        setAuction(aData);

        // Set default bid amount = current_bid + 50.000
        const minBid = (aData.current_bid ?? aData.start_price) + 50000;
        setBidAmount(minBid.toLocaleString('id-ID'));

        // Fetch seller profile
        const sRes = await fetch(`${API_URL}/api/auth/profile/${aData.seller_id}`);
        if (sRes.ok) setSeller(await sRes.json());

        // Fetch bid history
        const bRes = await fetch(`${API_URL}/api/bids/${id}`);
        if (bRes.ok) setBids(await bRes.json());

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [id]);

  // ── Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!auction) return;
    const tick = () => setCountdown(formatCountdown(auction.ends_at));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [auction]);

  // ── Submit bid ────────────────────────────────────────────────────────────
  const handleBid = async () => {
    if (!auction || !user) return;
    setBidError('');
    setBidSuccess('');

    const amount = parseInt(bidAmount.replace(/\./g, ''));
    const currentBid = auction.current_bid ?? auction.start_price;

    if (amount <= currentBid) {
      setBidError(`Bid harus lebih dari Rp ${currentBid.toLocaleString('id-ID')}`);
      return;
    }
    if (amount < currentBid + 50000) {
      setBidError('Minimum kenaikan bid adalah Rp 50.000');
      return;
    }
    if (walletBalance < amount) {
      setBidError('Saldo wallet tidak mencukupi.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/bids/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ amount, bidder_id: user.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal melakukan bid.');

      // Update state lokal
      setAuction(prev => prev ? { ...prev, current_bid: amount } : prev);
      setBids(prev => [data, ...prev]);
      setBidAmount((amount + 50000).toLocaleString('id-ID'));
      setBidSuccess('Bid berhasil! Kamu sekarang penawar tertinggi.');
    } catch (err) {
      setBidError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setSubmitting(false);
    }
  };

  const bidAmountNumeric = parseInt(bidAmount.replace(/\./g, '')) || 0;
  const isInsufficient   = walletBalance < bidAmountNumeric;
  const currentBid       = auction?.current_bid ?? auction?.start_price ?? 0;
  const tags             = [
    'SUSTAINABLE',
    auction?.grade ? `GRADE ${auction.grade}` : 'SASHIMI GRADE',
    'VERIFIED SELLER',
  ];

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className={styles.all}>
      <Navbar />
      <main className={styles.mainContainer}>
        <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
          Memuat detail lelang...
        </div>
      </main>
    </div>
  );

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !auction) return (
    <div className={styles.all}>
      <Navbar />
      <main className={styles.mainContainer}>
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error || 'Lelang tidak ditemukan.'}</p>
          <button onClick={() => router.back()}
            style={{ color: '#1e3a8a', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Kembali
          </button>
        </div>
      </main>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.all}>
      <Navbar />
      <main className={styles.mainContainer}>
        <div className={styles.container}>

          {/* ── Kiri ── */}
          <div className={styles.mainContent}>

            {/* Back */}
            <button onClick={() => router.back()}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>
              <ArrowLeft size={16} /> Kembali
            </button>

            {/* Image */}
            <div className={styles.imageContainer}>
              <div className={styles.badgeWrapper}>
                <span className={styles.liveBadge}>
                  <span className={styles.dot}></span>
                  {auction.status === 'active' ? 'Live Now' : 'Ended'}
                </span>
              </div>
              <img
                src={auction.image_url || 'https://darilaut.id/wp-content/uploads/2021/09/Tuna-3.jpg'}
                alt={auction.name}
                className={styles.image}
              />
            </div>

            {/* Header */}
            <div className={styles.headerContainer}>
              <div className={styles.titleWrapper}>
                <h1 className={styles.title}>{auction.name}</h1>
                <p className={styles.subtitle}>
                  {auction.species || 'Ikan Segar'} • Ditambahkan {new Date(auction.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className={styles.weightBox}>
                <span className={styles.weightLabel}>Berat</span>
                <span className={styles.weightValue}>
                  {auction.weight_kg} <span className={styles.unit}>KG</span>
                </span>
              </div>
            </div>

            {/* Tags */}
            <div className={styles.tagContainer}>
              {tags.map(tag => <span key={tag} className={styles.tag}>{tag}</span>)}
            </div>

            <p className={styles.descriptionText}>
              Produk segar berkualitas tinggi dari nelayan terverifikasi. Ditangkap dengan metode yang berkelanjutan dan diproses dengan protokol rantai dingin ketat untuk menjaga kesegaran dan kualitas optimal.
            </p>

            {/* Bid History */}
            <div>
              <div className={styles.bidheader}>
                <h3 className={styles.bidtitle}>Bid History</h3>
                <span className={styles.bidtotalBids}>{bids.length} Total Bids</span>
              </div>

              <div className={styles.bidtable}>
                <div className={styles.bidtableHeader}>
                  <span>Bidder</span>
                  <span>Time</span>
                  <span>Amount</span>
                </div>

                {bids.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                    Belum ada bid — jadilah yang pertama!
                  </div>
                ) : (
                  bids.map((bid, idx) => (
                    <div key={bid.id} className={`${styles.row} ${idx === 0 ? styles.rowHighest : styles.rowHover}`}>
                      <div className={styles.bidderInfo}>
                        <div className={styles.avatar}>
                          {bid.bidder_id.slice(0, 2).toUpperCase()}
                        </div>
                        <div className={styles.bidderNameWrapper}>
                          <span className={styles.bidderName}>
                            {bid.bidder_id === user?.id ? 'Anda' : `Bidder ${bid.bidder_id.slice(0, 6)}...`}
                          </span>
                          {idx === 0 && <span className={styles.highestBadge}>Highest</span>}
                        </div>
                      </div>
                      <div className={styles.time}>
                        {new Date(bid.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div className={styles.amountWrapper}>
                        <span className={styles.currency}>Rp</span>
                        <span className={idx === 0 ? styles.amountHighest : styles.amountNormal}>
                          {bid.amount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── Kanan ── */}
          <div className={styles.rightwrapper}>
            <div className={styles.rightcard}>

              {/* Current Bid */}
              <div>
                <span className={styles.rightlabel}>Current Highest Bid</span>
                <div className={styles.priceRow}>
                  <span className={styles.currency}>Rp</span>
                  <span className={styles.price}>{currentBid.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Timer */}
              <div className={styles.timerCard}>
                <div>
                  <span className={styles.timerLabel}>Time Remaining</span>
                  <span className={styles.timerValue}>{countdown}</span>
                </div>
                <div className={styles.iconWrapper}>
                  <Clock className={styles.icon} />
                </div>
              </div>

              {/* Bid Form — hanya tampil kalau masih active */}
              {auction.status === 'active' ? (
                <>
                  <div>
                    <label className={styles.inputlabel}>Your Bid Amount</label>
                    <div className={styles.inputWrapper}>
                      <span className={styles.inputcurrency}>Rp</span>
                      <input
                        type="text"
                        value={bidAmount}
                        onChange={e => {
                          const raw = e.target.value.replace(/\./g, '').replace(/\D/g, '');
                          setBidAmount(raw ? Number(raw).toLocaleString('id-ID') : '');
                        }}
                        className={styles.input}
                      />
                    </div>
                    <p className={styles.hint}>Minimum bid increment: Rp 50.000</p>
                  </div>

                  {bidError && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem' }}>
                      {bidError}
                    </div>
                  )}

                  {bidSuccess && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem' }}>
                      {bidSuccess}
                    </div>
                  )}

                  <button
                    className={styles.button}
                    onClick={handleBid}
                    disabled={submitting || isInsufficient}
                    style={{ opacity: submitting || isInsufficient ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
                  >
                    {submitting ? 'Memproses...' : 'Tawar Sekarang'}
                  </button>

                  <div className={styles.devide} />

                  {/* Wallet */}
                  <div className={styles.walletcontainer}>
                    <div className={styles.balanceRow}>
                      <span className={styles.balanceLabel}>Your Wallet Balance</span>
                      <span className={styles.balanceValue}>Rp {walletBalance.toLocaleString('id-ID')}</span>
                    </div>
                    {isInsufficient && (
                      <div className={styles.warningBox}>
                        <AlertCircle className={styles.warningIcon} />
                        <span className={styles.warningText}>Insufficient balance for this bid.</span>
                      </div>
                    )}
                    <button className={styles.depositButton}>Deposit Saldo</button>
                  </div>
                </>
              ) : (
                <div style={{ background: '#f1f5f9', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
                  Lelang ini telah berakhir
                </div>
              )}
            </div>

            {/* Seller Card */}
            <div className={styles.sellercard}>
              <div className={styles.sellerleft}>
                <div className={styles.selleravatarWrapper}>
                  <div style={{ width: '100%', height: '100%', background: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1.25rem', borderRadius: '50%' }}>
                    {(seller?.full_name || 'NK').slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div>
                  <span className={styles.sellerlabel}>Seller</span>
                  <h5 className={styles.sellername}>
                    {seller?.full_name || 'Nelayan Terverifikasi'}
                    {seller?.verified && <ShieldCheck className={styles.verifiedIcon} />}
                  </h5>
                  <p className={styles.sellermeta}>
                    Verified Merchant{seller?.vessel_name ? ` • ${seller.vessel_name}` : ''}
                  </p>
                </div>
              </div>
              <button className={styles.chatButton}>
                <MessageSquare className={styles.chatIcon} />
              </button>
            </div>

            {/* Trust Badges */}
            <div className={styles.icongrid}>
              <div className={styles.iconcard}>
                <ShieldCheck className={styles.icon} />
                <span className={styles.text}>Payment Held in Escrow</span>
              </div>
              <div className={styles.iconcard}>
                <Truck className={styles.icon} />
                <span className={styles.text}>Insured Cold Chain</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}