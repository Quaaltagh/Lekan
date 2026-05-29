'use client';
import React, { useState, useEffect } from 'react';
import Navbar from '@/app/components/Navbar';
import Filter from '@/app/components/Filters';
import FilterMobile from '@/app/components/FiltersMobile';
import AuctionCard from '@/app/components/AuctionCard';
import styles from './page.module.css';
import '@/app/globals.css';
import { useBuyerAuctions, AuctionFilters, formatCountdown, formatRp } from '@/hooks/useBuyerAuctions';

function AuctionCardSkeleton() {
  return (
    <div style={{
      borderRadius: '16px', overflow: 'hidden',
      background: '#fff', border: '1px solid #f1f5f9',
      animation: 'pulse 1.5s infinite',
    }}>
      <div style={{ height: '200px', background: '#f1f5f9' }} />
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ height: '16px', background: '#e2e8f0', borderRadius: '4px', width: '60%' }} />
        <div style={{ height: '12px', background: '#e2e8f0', borderRadius: '4px', width: '40%' }} />
        <div style={{ height: '20px', background: '#e2e8f0', borderRadius: '4px', width: '50%' }} />
      </div>
    </div>
  );
}

export default function BrowseAuctions() {
  const [filters, setFilters] = useState<AuctionFilters>({ sort: 'newest' });
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});
  const [isMobile, setIsMobile] = useState(false);
  
  const { auctions, loading, error, refetch } = useBuyerAuctions(filters);

  // detect mobile
  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreen();

    window.addEventListener('resize', checkScreen);

    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  // Countdown timer update tiap detik
  useEffect(() => {
    if (auctions.length === 0) return;
    const tick = () => {
      const next: Record<string, string> = {};
      auctions.forEach(a => { next[a.id] = formatCountdown(a.ends_at); });
      setCountdowns(next);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [auctions]);

  const mappedAuctions = auctions.map(a => ({
    id:            a.id,
    name:          a.name,
    image:         a.image_url || 'https://darilaut.id/wp-content/uploads/2021/09/Tuna-3.jpg',
    weight:        `${a.weight_kg}Kg`,
    grade:         a.grade || '-',
    startingPrice: formatRp(a.start_price),
    highestBid:    formatRp(a.current_bid ?? a.start_price),
    timeLeft:      countdowns[a.id] || '00:00:00',
  }));

  return (
    <>
      <div className={styles.all}>
        <Navbar />
        <div className={styles.container}>

          <div className={styles.banner}>
            <img src="/images/banner.png" alt="" className={styles.bannerimg} />
            </div>

          {/* Filter — semua apply sekaligus saat klik Apply */}
          {/* Filter */}
          {isMobile ? (
            <FilterMobile
              onApply={(f) => setFilters({ ...f, sort: f.sort || 'newest' })}
            />
          ) : (
            <Filter
              onApply={(f) => setFilters({ ...f, sort: f.sort || 'newest' })}
            />
          )}

          {error && (
            <div style={{ textAlign: 'center', padding: '1rem', color: '#dc2626', fontSize: '0.875rem' }}>
              {error} —{' '}
              <button onClick={refetch} style={{ textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>
                Coba lagi
              </button>
            </div>
          )}

          <div className={styles.card}>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <AuctionCardSkeleton key={i} />)
            ) : mappedAuctions.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                <p className={styles.kosongT}>Tidak ada lelang ditemukan</p>
                <p className={styles.kosongP}>Coba ubah filter atau cari kata lain</p>
              </div>
            ) : (
              mappedAuctions.map(auction => (
                <AuctionCard key={auction.id} {...auction} />
              ))
            )}
          </div>

        </div>
      </div>
    </>
  );
}