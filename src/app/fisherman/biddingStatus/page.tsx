'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';
import SideFisherman from '../../components/sideFisherman';
import NavbarFisherman from '../../components/NavbarFisherman';
import styles from './BiddingStatus.module.css';
import { useAuth } from '@/context/AuthContext';
import { getActiveBidStatus, ActiveBidItem } from '@/services/statusLelangService';
import { useRouter } from 'next/navigation';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCountdown(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'Berakhir';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Hitung progress bar — sisa waktu relatif terhadap 24 jam (max display)
function getProgressPercent(endsAt: string): number {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 0;
  const maxMs = 24 * 60 * 60 * 1000;
  return Math.min(100, (diff / maxMs) * 100);
}

// ─── BidCard ──────────────────────────────────────────────────────────────────
function BidCard({ id, name, lot, weight, image, highestBid, yourBid, status, endsAt }: ActiveBidItem) {
  const router = useRouter();
  const isWinning = status === 'winning';
  const [countdown, setCountdown] = useState(formatCountdown(endsAt));
  const [progress, setProgress]   = useState(getProgressPercent(endsAt));

  useEffect(() => {
    const tick = () => {
      setCountdown(formatCountdown(endsAt));
      setProgress(getProgressPercent(endsAt));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

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
          <span className={`${styles.cardbadge} ${isWinning ? styles.winning : styles.losing}`}>
            {isWinning ? <TrendingUp className={styles.icon} /> : <AlertCircle className={styles.icon} />}
            {status}
          </span>
        </div>

        <img
          src={image || 'https://darilaut.id/wp-content/uploads/2021/09/Tuna-3.jpg'}
          className={styles.image}
          alt={name}
        />
      </div>

      <div className={styles.cardcontainer}>
        <div className={styles.name}>
          <h3 className={styles.cardtitle}>{name}</h3>
          <p className={styles.cardmeta}>LOT #{lot} • {weight}</p>
        </div>

        <div className={styles.bid}>
          <div className={`${styles.contentcard} ${isWinning ? styles.cardNeutral : styles.cardLosing}`}>
            <div className={styles.bidcontent}>
              <span className={`${styles.label} ${isWinning ? styles.cardNeutral : styles.cardLosing}`}>
                Highest Bid
              </span>
              <span className={`${styles.value} ${isWinning ? styles.cardNeutral : styles.cardLosing}`}>
                Rp {highestBid}
              </span>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.bidcontent}>
              <span className={`${styles.label} ${isWinning ? styles.labelNeutral : styles.labelLosing}`}>
                Your Bid
              </span>
              <span className={`${styles.value} ${isWinning ? styles.valueYourWin : styles.valueYourLose}`}>
                Rp {yourBid}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.timercontainer}>
          <div>
            <div className={styles.timerheader}>
              <span className={styles.timerlabel}>Time Remaining</span>
              <span className={styles.time}>{countdown}</span>
            </div>
            <div className={styles.timerprogressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>

          <button
            onClick={() => router.push(`/buyer/auction/${id}`)}
            className={`${styles.button} ${isWinning ? styles.buttonWin : styles.buttonLose}`}
          >
            {isWinning ? 'View Detail' : 'Bid Now'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BiddingStatusPage() {
 const { user, token } = useAuth();
   const [activeBids, setActiveBids] = useState<ActiveBidItem[]>([]);
   const [loading, setLoading]       = useState(true);
   const [fetchError, setFetchError] = useState('');
 
   const fetchStatus = useCallback(async () => {
     if (!user?.id || !token) return;
     try {
       const res = await getActiveBidStatus(user.id, token);
       setActiveBids(res.data);
     } catch (err) {
       setFetchError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
     } finally {
       setLoading(false);
     }
   }, [user?.id, token]);
 
   // Fetch awal + auto-refresh tiap 30 detik (status winning/outbid bisa berubah)
   useEffect(() => {
     fetchStatus();
     const interval = setInterval(fetchStatus, 30_000);
     return () => clearInterval(interval);
   }, [fetchStatus]);

  return (
    <div className={styles.all}>
      <SideFisherman />
      <div className={styles.container}>
        <NavbarFisherman />
        
        <div className={styles.content}>

          <div className={styles.headerContainer}>
          <section className={styles.titleSection}>
            <h1 className={styles.pageTitle}>Status Lelang</h1>
            <p className={styles.pageSubtitle}>
              Pantau daftar aktif Anda dan tinjau lelang yang sudah selesai.
            </p>
          </section>
          </div>

          <div className={styles.contentcontainer}>
          <div className={styles.contentheader}>
            <h2 className={styles.contenttitle}>Penawaran Aktif</h2>
            <span className={styles.badge}>{activeBids.length} Aktif</span>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              Memuat status lelang...
            </div>
          ) : fetchError ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#dc2626' }}>
              {fetchError}
            </div>
          ) : activeBids.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              Kamu belum memiliki bid aktif saat ini.
            </div>
          ) : (
            <div className={styles.grid}>
              {activeBids.map(bid => (
                <BidCard key={bid.id} {...bid} />
              ))}
            </div>
          )}
        </div>


      </div>
    </div>
    </div>
  );
}
