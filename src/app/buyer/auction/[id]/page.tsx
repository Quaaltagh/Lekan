'use client'
import { ArrowLeft, Clock, ShieldCheck, Truck, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const POLL_INTERVAL = 5000;

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

// ─── Avatar component ─────────────────────────────────────────────────────────
interface BidderProfile {
  full_name?: string;
  email?: string;
  avatar_url?: string;
}
function getInitials(name?: string, email?: string): string {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  if (email) return email[0].toUpperCase();
  return '?';
}

function UserAvatar({ avatarUrl, name, email }: {
  avatarUrl: string | null;
  name?: string;
  email?: string;
}) {
  const [imgError, setImgError] = useState(false);

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name || 'Avatar'}
        className={styles.avatarImg}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className={styles.avatarFallback}>
      {getInitials(name, email)}
    </div>
  );
}


// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AuctionDetailPage() {
  const { id }          = useParams<{ id: string }>();
  const router          = useRouter();
  const { user, token } = useAuth();

  const [auction,      setAuction]      = useState<AuctionDetail | null>(null);
  const [seller,       setSeller]       = useState<SellerProfile | null>(null);
  const [bids,         setBids]         = useState<BidEntry[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [countdown,    setCountdown]    = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [bidError,     setBidError]     = useState('');
  const [bidSuccess,   setBidSuccess]   = useState('');
  const [lastUpdated,  setLastUpdated]  = useState<Date | null>(null);
  const [bidIncrement, setBidIncrement] = useState('50.000');
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);

  const auctionRef = useRef<AuctionDetail | null>(null);
  auctionRef.current = auction;

  // ── Derived values ────────────────────────────────────────────────────────
  const currentBid              = auction?.current_bid ?? auction?.start_price ?? 0;
  const incrementNumeric        = parseInt(bidIncrement.replace(/\./g, '')) || 0;
  const totalBidAmount          = currentBid + incrementNumeric;
  const minIncrement            = 50000;
  const isInsufficient          = walletBalance < incrementNumeric;
  const isCurrentHighestBidder  = bids.length > 0 && bids[0].bidder_id === user?.id;

  const tags = [
    'SUSTAINABLE',
    auction?.grade ? `GRADE ${auction.grade}` : 'SASHIMI GRADE',
    'VERIFIED SELLER',
  ];

   // ── Avatar ────────────────────────────────────────────────────────
  const [bidderProfiles, setBidderProfiles] = useState<Record<string, BidderProfile>>({});
  useEffect(() => {
  if (!bids.length) return;

  const fetchProfiles = async () => {
    try {
      const profiles: Record<string, BidderProfile> = {};

      await Promise.all(
        bids.map(async bid => {
          if (profiles[bid.bidder_id]) return;

          const res = await fetch(
            `${API_URL}/api/profile/${bid.bidder_id}`,
            {
              headers: token
                ? { Authorization: `Bearer ${token}` }
                : {},
            }
          );

          if (res.ok) {
            const data = await res.json();
            console.log(data);
            profiles[bid.bidder_id] = {
              full_name: data.full_name,
              email: data.email,
              avatar_url: data.avatar_url,
            };
          }
        })
      );

      setBidderProfiles(prev => ({
        ...prev,
        ...profiles,
      }));
    } catch (err) {
      console.error(err);
    }
  };

  fetchProfiles();
}, [bids, token]);

  // ── Fetch wallet ────────────────────────────────────────────────────────
  const fetchWallet = useCallback(async () => {
    if (!user?.id || !token) return;
    setWalletLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/wallet/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.wallet?.balance ?? 0);
      }
    } catch { /* silent */ } finally {
      setWalletLoading(false);
    }
  }, [user?.id, token]);

  // ── Fetch auction + bids ──────────────────────────────────────────────────
  const fetchAuctionAndBids = useCallback(async (isInitial = false) => {
    if (!id) return;
    try {
      const [aRes, bRes] = await Promise.all([
        fetch(`${API_URL}/api/auctions/${id}`),
        fetch(`${API_URL}/api/bids/${id}`),
      ]);

      if (!aRes.ok) throw new Error('Lelang tidak ditemukan.');
      const aData: AuctionDetail = await aRes.json();
      const bData: BidEntry[]    = bRes.ok ? await bRes.json() : [];

      setAuction(prev => {
        if (prev && prev.current_bid !== aData.current_bid && !isInitial) {
          setBidIncrement('50.000');
          setBidSuccess('');
          setBidError('Harga bid telah diperbarui oleh penawar lain.');
          setTimeout(() => setBidError(''), 3000);
        }
        return aData;
      });

      // Deduplikasi by id — server sebagai sumber kebenaran
      setBids(() => {
        const seen = new Set<string>();
        return bData.filter(b => {
          if (seen.has(b.id)) return false;
          seen.add(b.id);
          return true;
        });
      });

      setLastUpdated(new Date());

      if (isInitial) {
        const sRes = await fetch(`${API_URL}/api/auth/profile/${aData.seller_id}`);
        if (sRes.ok) setSeller(await sRes.json());
      }
    } catch (err) {
      if (isInitial) setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [id]);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAuctionAndBids(true);
  }, [fetchAuctionAndBids]);

  // ── Redirect ke detail logistik jika user memenangkan lelang yang telah selesai ─
  // useEffect(() => {
  //   if (auction && auction.status === 'done' && bids.length > 0 && bids[0].bidder_id === user?.id) {
  //     router.push(`/buyer/orderDetail/${id}`);
  //   }
  // }, [auction, bids, user?.id, id, router]);

  // ── Polling tiap 5 detik ──────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(() => {
      if (auctionRef.current?.status === 'active') {
        fetchAuctionAndBids(false);
      }
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [id, fetchAuctionAndBids]);

  // ── Fetch wallet saat user ready ──────────────────────────────────────────
  useEffect(() => {
    if (user?.id && token) fetchWallet();
  }, [user?.id, token, fetchWallet]);

  // ── Countdown ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!auction?.ends_at) return;
    const tick = () => setCountdown(formatCountdown(auction.ends_at));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [auction?.ends_at]);

  // ── Submit bid ─────────────────────────────────────────────────────────────
  const handleBid = async () => {
    if (!user) { router.push('/auth?mode=login'); return; }
    if (!auction) return;

    setBidError('');
    setBidSuccess('');

    if (isCurrentHighestBidder) {
      setBidError('Kamu sudah menjadi penawar tertinggi saat ini.');
      return;
    }
    if (incrementNumeric < minIncrement) {
      setBidError(`Minimum kenaikan bid adalah Rp ${minIncrement.toLocaleString('id-ID')}`);
      return;
    }
    if (walletBalance < incrementNumeric) {
      setBidError(`Saldo tidak mencukupi. Butuh Rp ${incrementNumeric.toLocaleString('id-ID')} tapi saldo Rp ${walletBalance.toLocaleString('id-ID')}.`);
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
        body: JSON.stringify({ amount: totalBidAmount, bidder_id: user.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal melakukan bid.');

      // Fetch ulang dari server — hindari duplikat key
      await fetchAuctionAndBids(false);
      await fetchWallet();

      setBidIncrement('50.000');
      setBidSuccess(`Bid Rp ${totalBidAmount.toLocaleString('id-ID')} berhasil! Kamu penawar tertinggi.`);
      setLastUpdated(new Date());

    } catch (err) {
      setBidError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading / Error ────────────────────────────────────────────────────────
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
            <button onClick={() => router.back()}
              className={styles.backLink}
             >
              <ArrowLeft size={16} /> Kembali
            </button>

            {/* Image */}
            <div className={styles.imageContainer}>
              <div className={auction.status === 'active' ? styles.badgeWrapper : styles.badgeWrapperEnd}>
                <span className={styles.liveBadge}>
                  <span className={styles.dot}></span>
                  {auction.status === 'active' ? 'Sedang Berlangsung' : 'Selesai'}
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
                  {auction.species || 'Ikan Segar'} • Ditambahkan{' '}
                  {new Date(auction.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
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
              Produk segar berkualitas tinggi dari nelayan terverifikasi. Ditangkap dengan metode yang
              berkelanjutan dan diproses dengan protokol rantai dingin ketat untuk menjaga kesegaran
              dan kualitas optimal.
            </p>

            {/* Bid History */}
            <div>
              <div className={styles.bidheader}>
                <h3 className={styles.bidtitle}>Riwayat Penawaran</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {lastUpdated && (
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <RefreshCw size={11} />
                      {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  )}
                  <span className={styles.bidtotalBids}>{bids.length} Total Penawaran</span>
                </div>
              </div>

              <div className={styles.bidtable}>
                <div className={styles.bidtableHeader}>
                  <span>Penawar</span>
                  <span>Waktu</span>
                  <span>Jumlah</span>
                </div>

                {bids.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                    Belum ada penawaran — jadilah yang pertama!
                  </div>
                ) : (
                  bids.map((bid, idx) => (
                    <div key={bid.id} className={`${styles.row} ${idx === 0 ? styles.rowHighest : styles.rowHover}`}>
                      <div className={styles.bidderInfo}>
                        
                        <div className={styles.avatar}>
                          <UserAvatar
                          avatarUrl={bidderProfiles[bid.bidder_id]?.avatar_url || null}
                          name={bidderProfiles[bid.bidder_id]?.full_name}
                          email={bidderProfiles[bid.bidder_id]?.email}
                          />
                        </div>
                     
                        <div className={styles.bidderNameWrapper}>
                          <span className={styles.bidderName}>
                            {bid.bidder_id === user?.id ? 'Anda' : bidderProfiles[bid.bidder_id]?.full_name || bidderProfiles[bid.bidder_id]?.email?.split('@')[0]|| `Penawar ${bid.bidder_id.slice(0, 6)}...`}
                          </span>
                          {idx === 0 && <span className={styles.highestBadge}>Tertinggi</span>}
                        </div>
                      </div>
                      <div className={styles.time}>
                        {new Date(bid.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div className={styles.amountWrapper}>
                        <span className={idx === 0 ? styles.currencyHighest : styles.currencyNormal}>Rp</span>
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
                <span className={styles.rightlabel}>Bid Tertinggi Saat Ini</span>
                <div className={styles.priceRow}>
                  <span className={styles.bidcurrency}>Rp</span>
                  <span className={styles.price}>{currentBid.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Timer */}
              <div className={styles.timerCard}>
                <div>
                  <span className={styles.timerLabel}>Sisa Waktu</span>
                  <span className={
                      auction.status === 'active'
                        ? styles.timerValue
                        : styles.timerValueEnd
                    }>{countdown}</span>
                </div>
                <div className={styles.timericonWrapper}>
                  <Clock className={styles.timericon} />
                </div>
              </div>

              {/* Badge leading — tampil kalau sudah jadi penawar tertinggi */}
              {auction.status === 'active' && isCurrentHighestBidder && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.8rem',
                  color: '#16a34a',
                  fontWeight: 600,
                }}>
                  <ShieldCheck size={16} />
                  Kamu sedang memimpin penawaran!
                </div>
              )}

              {auction.status === 'active' ? (
                <>
                  {/* Bid Input — sembunyikan kalau sudah jadi penawar tertinggi */}
                  {!isCurrentHighestBidder && (
                    <div>
                      <label className={styles.inputlabel}>Kenaikan Bid Anda</label>

                      {/* Quick increment buttons */}
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                        {[50000, 100000, 250000, 500000].map(val => (
                          <button
                            key={val}
                            onClick={() => setBidIncrement(val.toLocaleString('id-ID'))}
                            style={{
                              flex: 1, padding: '4px 0', fontSize: '0.65rem', fontWeight: 600,
                              border: `1.5px solid ${incrementNumeric === val ? '#1e3a8a' : '#e2e8f0'}`,
                              borderRadius: '6px',
                              background: incrementNumeric === val ? '#eff6ff' : '#f8fafc',
                              color: incrementNumeric === val ? '#1e3a8a' : '#64748b',
                              cursor: 'pointer', transition: 'all 0.15s',
                            }}
                          >
                            +{val >= 1000000 ? `${val / 1000000}M` : `${val / 1000}K`}
                          </button>
                        ))}
                      </div>

                      {/* Input kenaikan */}
                      <div className={styles.inputWrapper}>
                        <span className={styles.inputcurrency}>+Rp </span>
                        <input
                          type="text"
                          value={bidIncrement}
                          onChange={e => {
                            const raw = e.target.value.replace(/\./g, '').replace(/\D/g, '');
                            setBidIncrement(raw ? Number(raw).toLocaleString('id-ID') : '');
                          }}
                          className={styles.winput}
                          // placeholder="50.000"
                        />
                      </div>
                      <p className={styles.hint}>Min. kenaikan Rp 50.000</p>

                      {/* Breakdown harga */}
                      <div className={styles.bidBreakdown}>
                        <div className={styles.bidBreakdownRow}>
                          <span className={styles.bidBreakdownLabel}>
                            Harga saat ini
                          </span>

                          <span className={styles.bidBreakdownValue}>
                            Rp {currentBid.toLocaleString('id-ID')}
                          </span>
                        </div>

                        <div className={`${styles.bidBreakdownRow} ${styles.bidBreakdownSpacing}`}>
                          <span className={styles.bidBreakdownLabel}>
                            Kenaikan Anda
                          </span>

                          <span className={styles.bidBreakdownIncrease}>
                            +Rp {incrementNumeric.toLocaleString('id-ID')}
                          </span>
                        </div>

                        <div className={styles.bidBreakdownTotal}>
                          <span className={styles.bidBreakdownTotalLabel}>
                            Total Bid Anda
                          </span>

                          <span className={styles.bidBreakdownTotalValue}>
                            Rp {totalBidAmount.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

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
                    disabled={submitting || isInsufficient || incrementNumeric < minIncrement || isCurrentHighestBidder}
                    style={{
                      opacity: (submitting || isInsufficient || incrementNumeric < minIncrement || isCurrentHighestBidder) ? 0.6 : 1,
                      cursor: (isCurrentHighestBidder || submitting) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {submitting
                      ? 'Memproses...'
                      : isCurrentHighestBidder
                        ? '✓ Kamu Penawar Tertinggi'
                        : `Tawar Rp ${totalBidAmount.toLocaleString('id-ID')}`}
                  </button>

                  <div className={styles.devide} />

                  {/* Wallet */}
                  <div className={styles.walletcontainer}>
                    <div className={styles.balanceRow}>
                      <span className={styles.balanceLabel}>Saldo Wallet</span>
                      <span className={styles.balanceValue}>
                        {walletLoading ? '...' : `Rp ${walletBalance.toLocaleString('id-ID')}`}
                      </span>
                    </div>
                    {isInsufficient && !isCurrentHighestBidder && (
                      <div className={styles.warningBox}>
                        <AlertCircle className={styles.warningIcon} />
                        <span className={styles.warningText}>
                          Saldo tidak cukup. Butuh Rp {(incrementNumeric - walletBalance).toLocaleString('id-ID')} lagi.
                        </span>
                      </div>
                    )}
                    <button
                      className={styles.depositButton}
                      onClick={() => {
                        sessionStorage.setItem('depositReturnUrl', `/buyer/auction/${id}`);
                        router.push('/buyer/Deposit');
                      }}
                    >
                      Deposit Saldo
                    </button>
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
                  <span className={styles.sellerlabel}>Penjual</span>
                  <h5 className={styles.sellername}>
                    {seller?.full_name || 'Nelayan Terverifikasi'}
                    {seller?.verified && <ShieldCheck className={styles.verifiedIcon} />}
                  </h5>
                  <p className={styles.sellermeta}>
                    Pedagang Terverifikasi{seller?.vessel_name ? ` • ${seller.vessel_name}` : ''}
                  </p>
                </div>
              </div>
              {/* <button className={styles.chatButton}>
                <MessageSquare className={styles.chatIcon} />
              </button> */}
            </div>

            {/* Trust Badges */}
            <div className={styles.icongrid}>
              <div className={styles.iconcard}>
                <ShieldCheck className={styles.icon} />
                <span className={styles.text}>Pembayaran Aman</span>
              </div>
              <div className={styles.iconcard}>
                <Truck className={styles.icon} />
                <span className={styles.text}>Distribusi Bersuhu Terkontrol</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}