'use client';
import React, { useEffect } from 'react';
import { Activity, Wallet, Ellipsis, Fish } from 'lucide-react';
import SideFisherman from '../../components/sideFisherman';
import NavbarFisherman from '../../components/NavbarFisherman';
import styles from './page.module.css';
import { useSellerAuctions, Auction, AuctionStatus } from '@/hooks/useSellerAuctions';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// ─── Status config — sesuai constraint DB: active | done | pending | cancelled ──
const STATUS_CONFIG: Record<AuctionStatus, { label: string; color: string }> = {
  active:    { label: 'AKTIF',      color: '#dc2626' },
  pending:   { label: 'PENDING',    color: '#d97706' },
  done:      { label: 'SELESAI',    color: '#16a34a' },
  cancelled: { label: 'DIBATALKAN', color: '#94a3b8' },
};

function formatRp(value: number) {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}M`;
  return `Rp ${value.toLocaleString('id-ID')}`;
}

// ─── Auction Item ─────────────────────────────────────────────────────────────
function AuctionItem({ auction }: { auction: Auction }) {
  const status = STATUS_CONFIG[auction.status] ?? { label: auction.status, color: '#94a3b8' };
  const currentPrice = auction.current_bid ?? auction.start_price;

  return (
    <div className={styles.auctionItem}>
      <div className={styles.imagePlaceholder} style={{
        overflow: 'hidden', display: 'flex',
        alignItems: 'center', justifyContent: 'center', background: '#f1f5f9',
      }}>
        {auction.image_url ? (
          <img src={auction.image_url} alt={auction.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Fish size={32} color="#94a3b8" />
        )}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
            {auction.name}
            {auction.grade && (
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'normal', marginLeft: '6px' }}>
                Grade {auction.grade}
              </span>
            )}
          </h3>
          <span style={{ color: status.color, fontSize: '0.75rem', fontWeight: 'bold' }}>
            ● {status.label}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Bid Saat Ini</p>
            <p style={{ fontWeight: 'bold', color: '#1e40af' }}>
              {currentPrice.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Berat</p>
            <p style={{ fontWeight: 'bold' }}>{auction.weight_kg} kg</p>
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>BERAKHIR</p>
            <p style={{ fontSize: '0.8rem', color: '#f97316' }}>
              {new Date(auction.ends_at).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
          {auction.species && (
            <div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>SPESIES</p>
              <p style={{ fontSize: '0.8rem', fontWeight: '500' }}>{auction.species}</p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer' }}>
            Detail
          </button>
          {auction.status === 'active' && (
            <button style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', background: '#1e40af', color: 'white', border: 'none', cursor: 'pointer' }}>
              Tingkatkan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AuctionSkeleton() {
  return (
    <div className={styles.auctionItem} style={{ opacity: 0.6 }}>
      <div className={styles.imagePlaceholder} style={{ background: '#e2e8f0' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ height: '1rem', background: '#e2e8f0', borderRadius: '4px', width: '40%' }} />
        <div style={{ height: '0.875rem', background: '#e2e8f0', borderRadius: '4px', width: '60%' }} />
        <div style={{ height: '0.875rem', background: '#e2e8f0', borderRadius: '4px', width: '30%' }} />
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function FishermanDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { auctions, loading, error } = useSellerAuctions();

  useEffect(() => {
    if (!user) { router.push('/'); return; }
    if (user.role !== 'nelayan') { router.push('/buyer'); }
  }, [user, router]);

  if (!user) return null;

  // Stats — gunakan 'done' bukan 'completed'
  const activeCount   = auctions.filter(a => a.status === 'active').length;
  const totalEarnings = auctions.filter(a => a.status === 'done').reduce((s, a) => s + (a.final_price || 0), 0);
  const pendingTotal  = auctions.filter(a => a.status === 'pending').reduce((s, a) => s + (a.final_price || a.start_price), 0);

  const recentAuctions = auctions.slice(0, 3);

  return (
    <div className={styles.container}>
      <SideFisherman />

      <main className={styles.mainContent}>
        <NavbarFisherman />

        <div className={styles.dashboardPadding}>
          <div style={{ flex: 1 }}>

            {/* Stats Cards */}
            <div className={styles.cardGrid}>
              <div className={styles.statCard}>
                <div className={styles.cardicon}>
                  <div style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.75rem', borderRadius: '0.75rem' }}>
                    <Activity size={20} />
                  </div>
                  {activeCount > 0 && <span className={styles.badgeLive}>SEDANG</span>}
                </div>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Lelang Aktif</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {loading ? '—' : activeCount}{' '}
                  <span style={{ fontSize: '0.875rem', color: '#64748bbc', fontWeight: 'normal' }}>Lot</span>
                </h3>
              </div>

              <div className={styles.statCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ backgroundColor: '#effff1', color: '#0f911e', padding: '0.75rem', borderRadius: '0.75rem' }}>
                    <Wallet size={20} />
                  </div>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Pendapatan</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {loading ? '—' : formatRp(totalEarnings)}
                </h3>
              </div>

              <div className={styles.statCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ backgroundColor: '#fff7ef', color: '#91430f', padding: '0.75rem', borderRadius: '0.75rem' }}>
                    <Ellipsis size={20} />
                  </div>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Menunggu Pembayaran</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {loading ? '—' : formatRp(pendingTotal)}
                </h3>
              </div>
            </div>

            {/* List Header */}
            <div className={styles.auctionHeader}>
              <div>
                <h2 className={styles.auctionHeaderTitle}>Daftar Lelang Terkini</h2>
                <p className={styles.auctionHeaderSubtitle}>Monitor hasil tangkapan Anda secara real-time.</p>
              </div>
              <a href="#" className={styles.viewAllLink}>Lihat Semua →</a>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            {loading ? (
              <><AuctionSkeleton /><AuctionSkeleton /></>
            ) : recentAuctions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: '#f8fafc', borderRadius: '1rem', border: '1px dashed #e2e8f0' }}>
                <Fish size={40} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: '#64748b', fontWeight: '500' }}>Belum ada lelang</p>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Mulai buat lelang pertama Anda</p>
              </div>
            ) : (
              recentAuctions.map(auction => (
                <AuctionItem key={auction.id} auction={auction} />
              ))
            )}
          </div>

          {/* Sidebar Kanan */}
          <div style={{ width: '20rem' }}>
            <div className={styles.ctaBox}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Siap Melantai di Bursa?</h3>
              <p style={{ color: '#bfdbfe', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Unggah hasil tangkapan Anda hari ini dan dapatkan harga terbaik dari pembeli global.
              </p>
              <button style={{ width: '100%', padding: '0.75rem', backgroundColor: 'white', color: '#1e3a8a', fontWeight: 'bold', borderRadius: '0.75rem', border: 'none', cursor: 'pointer' }}
              onClick={() => router.push('/fisherman/uploadAuction/')}>
                + Unggah Lelang Baru
              </button>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <p className={styles.marketTrendTitle}>Trend Pasar</p>
              <div className={styles.marketTrendCard}>
                {[
                  { name: 'Cakalang',     change: '+12.4%', positive: true },
                  { name: 'Udang Vaname', change: '-2.1%',  positive: false },
                  { name: 'Kerapu',       change: '+8.5%',  positive: true },
                ].map(item => (
                  <div key={item.name} className={styles.marketTrendItem}>
                    <div className={styles.trendInfo}>
                      <span className={styles.indicatorDot} style={{ backgroundColor: item.positive ? '#3b82f6' : '#ef4444' }} />
                      {item.name}
                    </div>
                    <span className={item.positive ? styles.trendPositive : styles.trendNegative}>
                      {item.change}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}