'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Clock, Loader2, Fish, ArrowRight, Truck } from 'lucide-react';
import SideFisherman from '../../components/sideFisherman';
import NavbarFisherman from '../../components/NavbarFisherman';
import styles from './BiddingStatus.module.css';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface ActiveAuction {
  id: string;
  name: string;
  weight_kg: number;
  image_url?: string;
  current_bid?: number;
  start_price: number;
  ends_at: string;
  status: string;
  grade?: string;
  species?: string;
  logistics?: { status: string } | Array<{ status: string }>;
}

function formatCountdown(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'Berakhir';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getProgressPercent(endsAt: string): number {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 0;
  const maxMs = 24 * 60 * 60 * 1000;
  return Math.min(100, (diff / maxMs) * 100);
}

// ─── PART 1: UI CARD KHUSUS UNTUK LELANG LIVE ───
function LiveAuctionCard({ auction }: { auction: ActiveAuction }) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(formatCountdown(auction.ends_at));
  const [progress, setProgress]   = useState(getProgressPercent(auction.ends_at));

  useEffect(() => {
    const tick = () => {
      setCountdown(formatCountdown(auction.ends_at));
      setProgress(getProgressPercent(auction.ends_at));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [auction.ends_at]);

  const currentBid  = auction.current_bid ?? auction.start_price;
  const shortId     = auction.id.replace(/-/g, '').slice(-4).toUpperCase();
  const lotPrefix   = auction.name.slice(0, 2).toUpperCase();
  const hasBid      = !!auction.current_bid && auction.current_bid > auction.start_price;

  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        <div className={styles.badgeWrapper}>
          <span className={styles.liveBadge}>
            <span className={styles.pulseDot}></span>
            Live
          </span>
        </div>

        <div className={styles.wrapper}>
          <span className={`${styles.cardbadge} ${hasBid ? styles.winning : styles.losing}`}>
            {hasBid ? <><TrendingUp className={styles.icon} /> Ada Penawaran</> : <><Clock className={styles.icon} /> Menunggu Bid</>}
          </span>
        </div>

        <img
          src={auction.image_url || 'https://darilaut.id/wp-content/uploads/2021/09/Tuna-3.jpg'}
          className={styles.image}
          alt={auction.name}
          onError={e => {
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%230f172a"/></svg>';
          }}
        />
      </div>

      <div className={styles.cardcontainer}>
        <div className={styles.name}>
          <h3 className={styles.cardtitle}>{auction.name}</h3>
          <p className={styles.cardmeta}>
            LOT #{lotPrefix}-{shortId} • {auction.weight_kg}KG
            {auction.grade ? ` • Grade ${auction.grade}` : ''}
          </p>
        </div>

        <div className={styles.bid}>
          <div className={`${styles.contentcard} ${hasBid ? styles.cardNeutral : styles.cardLosing}`}>
            <div className={styles.bidcontent}>
              <span className={`${styles.label} ${hasBid ? styles.cardNeutral : styles.cardLosing}`}>Harga Awal</span>
              <span className={`${styles.value} ${hasBid ? styles.cardNeutral : styles.cardLosing}`}>Rp {auction.start_price.toLocaleString('id-ID')}</span>
            </div>
            <div className={styles.divider}></div>
            <div className={styles.bidcontent}>
              <span className={`${styles.label} ${hasBid ? styles.labelNeutral : styles.labelLosing}`}>Bid Tertinggi</span>
              <span className={`${styles.value} ${hasBid ? styles.valueYourWin : styles.valueYourLose}`}>Rp {currentBid.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        <div className={styles.timercontainer}>
          <div>
            <div className={styles.timerheader}>
              <span className={styles.timerlabel}>Sisa Waktu</span>
              <span className={styles.time}>{countdown}</span>
            </div>
            <div className={styles.timerprogressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>

          <button
            onClick={() => router.push(`/fisherman/enchantedAuctionHistory/${auction.id}`)}
            className={`${styles.button} ${hasBid ? styles.buttonWin : styles.buttonLose}`}
          >
            Lihat Detail <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PART 2: UI TABEL ROW KHUSUS UNTUK LOGISTIK/PENGIRIMAN ───
function ShippingRowItem({ auction, token }: { auction: ActiveAuction; token: string }) {
  const router = useRouter();
  const [buyerName, setBuyerName] = useState('-');
  const [buyerLoading, setBuyerLoading] = useState(true);

  // Ambil data nama pembeli dari endpoint history detail
  useEffect(() => {
    if (!auction.id || !token) return;
    fetch(`${API_URL}/api/history/detail/${auction.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setBuyerName(data?.winner?.name || 'Tidak ada pemenang');
      })
      .catch(() => setBuyerName('-'))
      .finally(() => setBuyerLoading(false));
  }, [auction.id, token]);

  const deliveryStatus = Array.isArray(auction.logistics)
    ? auction.logistics[0]?.status
    : auction.logistics?.status;

  const isShipping = deliveryStatus === 'shipping' || deliveryStatus === 'on_progress';

  return (
    <div className={styles.itemRow}>
      {/* Kolom Produk */}
      <div className={styles.productCell}>
        <div className={styles.imageMiniWrapper}>
          {auction.image_url ? (
            <img src={auction.image_url} alt={auction.name} className={styles.imageMini} />
          ) : (
            <Fish size={18} color="#94a3b8" />
          )}
        </div>
        <div>
          <h4 className={styles.cardtitle} style={{ fontSize: '14px' }}>{auction.name}</h4>
          <p className={styles.cardmeta}>{auction.grade || 'STANDAR'} • {auction.weight_kg}KG</p>
        </div>
      </div>

      {/* Kolom Pembeli */}
      <div className={styles.textCell}>
        {buyerLoading ? <Loader2 size={12} className="animate-spin" /> : buyerName}
      </div>

      {/* Kolom Status Logistik */}
      <div>
        <span className={`${styles.deliveryBadge} ${isShipping ? styles.statusShipping : styles.statusPending}`}>
          <Truck size={12} /> {isShipping ? 'Dalam Perjalanan' : 'Menunggu Pengiriman'}
        </span>
      </div>

      {/* Kolom Harga Akhir */}
      <div className={styles.priceCell}>
        Rp {(auction.current_bid || auction.start_price).toLocaleString('id-ID')}
      </div>

      {/* Kolom Aksi */}
      <div className={styles.actionCell}>
        <button 
          onClick={() => router.push(`/fisherman/enchantedAuctionHistory/${auction.id}`)}
          className={styles.btnAction}
        >
          Detail
        </button>
      </div>
    </div>
  );
}

// ─── MAIN PAGE COMPONENT ───
export default function FishermanStatusPage() {
  const { user, token } = useAuth();
  const [liveAuctions, setLiveAuctions] = useState<ActiveAuction[]>([]);
  const [shippingAuctions, setShippingAuctions] = useState<ActiveAuction[]>([]);
  const [loading, setLoading]   = useState(true);
  const [fetchError, setFetchError] = useState('');

  const fetchAuctions = useCallback(async () => {
    if (!user?.id || !token) return;
    try {
      const res = await fetch(`${API_URL}/api/auctions/seller/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Gagal memuat lelang.');
      const data: ActiveAuction[] = await res.json();
      
      // 1. Filter lelang aktif (Tetap pakai struktur Card)
      const live = data.filter(item => item.status === 'active');
      
      // 2. Filter logistik jalan & Sembunyikan 'cancelled' (Masuk ke struktur Tabel)
      const shipping = data.filter(item => {
        if (item.status === 'active' || item.status === 'cancelled') return false;

        const deliveryStatus = Array.isArray(item.logistics)
          ? item.logistics[0]?.status
          : item.logistics?.status;

        return deliveryStatus !== 'delivered';
      });

      setLiveAuctions(live);
      setShippingAuctions(shipping);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, token]);

  useEffect(() => {
    fetchAuctions();
    const interval = setInterval(fetchAuctions, 30_000);
    return () => clearInterval(interval);
  }, [fetchAuctions]);

  const totalProses = liveAuctions.length + shippingAuctions.length;

  return (
    <div className={styles.all}>
      <SideFisherman />
      <div className={styles.container}>
        <NavbarFisherman />

        <div className={styles.content}>
          <div className={styles.headerContainer}>
            <section className={styles.titleSection}>
              <h1 className={styles.pageTitle}>Status & Pantauan Lelang</h1>
              <p className={styles.pageSubtitle}>
                Pantau jalannya lelang aktif serta monitor pengiriman hasil laut yang berhasil terjual.
              </p>
            </section>
          </div>

          {loading ? (
            <div style={{ padding: '6rem 0', textAlign: 'center', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <Loader2 size={32} className="animate-spin" />
              Memuat data pantauan lelang...
            </div>
          ) : fetchError ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#dc2626' }}>{fetchError}</div>
          ) : totalProses === 0 ? (
            <div className={styles.contentcontainer} style={{ padding: '4rem 1rem', textAlign: 'center', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <Fish size={48} style={{ opacity: 0.3 }} />
              <h3>Belum Ada Kegiatan Pantauan</h3>
              <p>Tidak ada lelang aktif maupun proses pengiriman barang saat ini.</p>
            </div>
          ) : (
            <>
              {/* SECTION 1: LELANG LIVE (GRID MODEL CARD) */}
              {liveAuctions.length > 0 && (
                <div className={styles.contentcontainer} style={{ marginBottom: '2.5rem' }}>
                  <div className={styles.contentheader}>
                    <h2 className={styles.contenttitle}>Lelang Live Anda</h2>
                    <span className={styles.badge} style={{ backgroundColor: '#ef4444', color: '#fff' }}>{liveAuctions.length} Live</span>
                  </div>
                  <div className={styles.grid}>
                    {liveAuctions.map(auction => (
                      <LiveAuctionCard key={auction.id} auction={auction} />
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 2: PROSES LOGISTIK (MODEL TABEL HORIZONTAL) */}
              {shippingAuctions.length > 0 && (
                <div className={styles.contentcontainer}>
                  <div className={styles.contentheader}>
                    <h2 className={styles.contenttitle}>Dalam Proses Pengiriman</h2>
                    <span className={styles.badge} style={{ backgroundColor: '#2563eb', color: '#fff' }}>{shippingAuctions.length} Transaksi</span>
                  </div>
                  
                  {/* Tampilan Tabel Ringkas */}
                  <div className={styles.tableContainer}>
                    <div className={styles.tableHeader}>
                      <div>Spesies</div>
                      <div>Pembeli</div>
                      <div>Status Pengiriman</div>
                      <div>Harga Akhir</div>
                      <div></div>
                    </div>
                    <div>
                      {shippingAuctions.map(auction => (
                        <ShippingRowItem key={auction.id} auction={auction} token={token ?? ''} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}