'use client';
import React, { useEffect, useState} from 'react';
import { Activity, Wallet, Ellipsis, Fish, Link } from 'lucide-react';
import SideFisherman from '../../components/sideFisherman';
import NavbarFisherman from '../../components/NavbarFisherman';
import styles from './dashboard.module.css';
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
  const router = useRouter();
  const status = STATUS_CONFIG[auction.status] ?? { label: auction.status, color: '#94a3b8' };
  const currentPrice = auction.current_bid ?? auction.start_price;

  return (

    <div className={styles.auctionItem}>
  <div className={styles.imagePlaceholder}>
    {auction.image_url ? (
      <img src={auction.image_url} alt={auction.name} />
    ) : (
      <Fish size={32} color="#94a3b8" />
    )}
  </div>

  <div className={styles.auctionContent}>
    <div className={styles.auctionItemHeader}>
      <h3 className={styles.auctionTitle}>
        {auction.name}

        {auction.grade && (
          <span className={styles.gradeText}>
            Grade {auction.grade}
          </span>
        )}
      </h3>

      <span
        className={styles.statusText}
        style={{ color: status.color }}
      >
        ● {status.label}
      </span>
    </div>

    <div className={styles.auctionInfoGrid}>
      <div>
        <p className={styles.infoLabel}>Bid Saat Ini</p>

        <p className={styles.bidPrice}>
          {currentPrice.toLocaleString('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
          })}
        </p>
      </div>

      <div>
        <p className={styles.infoLabel}>Berat</p>
        <p className={styles.infoValue}>
          {auction.weight_kg} kg
        </p>
      </div>

      <div>
        <p className={styles.infoLabel}>BERAKHIR</p>

        <p className={styles.endDate}>
          {new Date(auction.ends_at).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {auction.species && (
        <div>
          <p className={styles.infoLabel}>SPESIES</p>

          <p className={styles.speciesText}>
            {auction.species}
          </p>
        </div>
      )}
    </div>

    <div className={styles.buttonGroup}>
      <button
        onClick={() => router.push(`/fisherman/enchantedAuctionHistory/${auction.id}`)}
        className={styles.detailButton}
      >
        Detail
      </button>

      {/* {auction.status === 'active' && (
        <button className={styles.upgradeButton}>
          Tingkatkan
        </button>
      )} */}
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    {/* Sidebar biasanya otomatis hilang/sembunyi di HP lewat CSS */}
    <SideFisherman
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
    />

    <main className={styles.mainContent}>
      <NavbarFisherman setSidebarOpen={setSidebarOpen}/>

      <div className={styles.dashboardPadding}>
        {/* BUNGKUS DENGAN CLASS CSS, JANGAN INLINE STYLE flex: 1 */}
        <div className={styles.dashboardContent}>

          {/* Stats Cards */}
          {/* <div className={styles.statCard}>
                <div className={styles.cardicon}>
                  <div style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.75rem', borderRadius: '0.75rem' }}>
                    <Activity size={20} />
                  </div>
                  {activeCount > 0 && <span className={styles.badgeLive}>SEDANG</span>}
                </div>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Lelang Aktif</p>
                <h3 style={{ fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-title)' }}>
                  {loading ? '—' : activeCount}{' '}
                  <span style={{ fontSize: '0.875rem', color: '#64748bbc', fontWeight: 'normal' }}>Lot</span>
                </h3>
              </div> */}


          <div className={styles.cardGrid}>
            <div className={styles.statCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                  <Activity size={20} />
                </div>
                {activeCount > 0 && <span className={styles.badgeLive}>Sedang Aktif</span>}
              </div>
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Lelang Aktif</p>
              <h3 style={{ fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-title)' }}>
                {loading ? '—' : activeCount}{' '}
                <span style={{ fontSize: '0.875rem', color: '#64748bbc', fontWeight: 'normal' }}>Lot</span>
              </h3>
            </div>

            <div className={styles.statCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ backgroundColor: '#effff1', color: '#0f911e', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                  <Wallet size={20} />
                </div>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Pendapatan</p>
              <h3 style={{ fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-title)' }}>
                {loading ? '—' : formatRp(totalEarnings)}
              </h3>
            </div>

            <div className={styles.statCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ backgroundColor: '#fff7ef', color: '#91430f', padding: '0.75rem', borderRadius: 'var(--radius-lg)' }}>
                  <Ellipsis size={20} />
                </div>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Menunggu Pembayaran</p>
              <h3 style={{ fontSize: 'var(--fs-xl)', fontWeight: 'var(--fw-title)' }}>
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
            <a href="/fisherman/enchantedAuctionHistory" className={styles.viewAllLink}>Lihat Semua →</a>
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
          {/* <div style={{ width: '20rem' }}>
            <div className={styles.ctaBox}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'white' }}>Siap Melantai di Bursa?</h3>
              <p style={{ color: '#bfdbfe', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Unggah hasil tangkapan Anda hari ini dan dapatkan harga terbaik dari pembeli global.
              </p>
              <button style={{ width: '100%', padding: '0.75rem', backgroundColor: 'white', color: '#1e3a8a', fontWeight: 'bold', borderRadius: '0.75rem', border: 'none', cursor: 'pointer' }}
              onClick={() => router.push('/fisherman/uploadAuction/')}>
                + Unggah Lelang Baru
              </button>
            </div> */}
          {/* </div> */}
      </div>
    </main>
  </div>
  );
}