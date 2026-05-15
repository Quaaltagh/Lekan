"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./BiddingStatus.module.css";
import SideFisherman from "../../components/sideFisherman";
import NavbarFisherman from "../../components/NavbarFisherman";
import { Search, Filter, ShieldCheck, Loader2 } from "lucide-react";
import { auctionService, BiddingStatusResponse } from "@/services/auctionService";
import { useAuth } from "@/context/AuthContext";

// Utility to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Utility to format time remaining
const getEndsIn = (endsAt: string) => {
  const diff = new Date(endsAt).getTime() - new Date().getTime();
  if (diff <= 0) return "Sudah Berakhir";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export default function BiddingStatusPage() {
  const { user, token } = useAuth();
  const [data, setData] = useState<BiddingStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!user?.id || !token) return;
    setLoading(true);
    try {
      const result = await auctionService.getBiddingStatus(user.id, token);
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Gagal memuat status lelang");
    } finally {
      setLoading(false);
    }
  }, [user?.id, token]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // If user is not ready but it's initially loading
  if (!user && !loading) {
    return <div className={styles.errorState}>Silakan masuk untuk melihat halaman ini.</div>;
  }

  return (
    <div className={styles.layout}>
      <SideFisherman />
      <div className={styles.mainWrapper}>
        <NavbarFisherman />
        
        <main className={styles.main}>
          {/* Header Section */}
          <div className={styles.headerContainer}>
            <div>
              <h1 className={styles.pageTitle}>Status Lelang</h1>
              <p className={styles.pageSubtitle}>
                Pantau daftar aktif Anda dan tinjau lelang yang sudah selesai.
              </p>
            </div>
            <div className={styles.searchBar}>
              <div className={styles.searchInputWrap}>
                <Search size={16} className={styles.searchIcon} />
                <input 
                  type="text" 
                  placeholder="Cari lelang..." 
                  className={styles.searchInput}
                />
              </div>
              <button className={styles.filterBtn}>
                <Filter size={18} />
              </button>
            </div>
          </div>

          {loading && (
            <div className={styles.loadingState}>
              <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 16px" }} />
              Memuat lelang Anda...
            </div>
          )}

          {error && (
            <div className={styles.errorState}>
              {error}
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* Active Auctions Section */}
              <div className={styles.sectionTitleWrap}>
                <h2 className={styles.sectionTitle}>Lelang Aktif</h2>
                <div className={styles.liveBadge}>
                  <div className={styles.liveDot}></div>
                  SEDANG BERLANGSUNG
                </div>
              </div>

              {data.active.length === 0 ? (
                <div className={styles.emptyState}>Tidak ada lelang aktif saat ini.</div>
              ) : (
                <div className={styles.activeAuctionsGrid}>
                  {data.active.map((auction) => (
                    <div key={auction.id} className={styles.auctionCard}>
                      <img 
                        src={auction.image_url || "/fish-placeholder.jpg"} 
                        alt={auction.name} 
                        className={styles.auctionImage} 
                        onError={(e) => {
                          // Fallback to a solid color block if image fails
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140"><rect width="100%" height="100%" fill="%230f172a"/></svg>';
                        }}
                      />
                      <div className={styles.auctionInfo}>
                        <div className={styles.auctionHeader}>
                          <h3 className={styles.auctionName}>{auction.name}</h3>
                          <div className={styles.endsInWrap}>
                            <span className={styles.endsInLabel}>Berakhir dalam</span>
                            <span className={styles.endsInTime}>{getEndsIn(auction.ends_at)}</span>
                          </div>
                        </div>
                        <div className={styles.metaRow}>
                          <span>BERAT: {auction.weight_kg}KG</span>
                          {auction.grade && <span>KELAS: {auction.grade}</span>}
                        </div>
                        <div className={styles.bidRow}>
                          <div>
                            <div className={styles.currentBidLabel}>
                              Bid Saat Ini ({auction.bidders_count} Penawar)
                            </div>
                            <div className={styles.currentBidPrice}>
                              {formatCurrency(auction.current_bid || auction.start_price)}
                            </div>
                          </div>
                          <button className={styles.viewDetailBtn}>
                            Lihat Detail
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Finished Auctions Section */}
              <div className={styles.sectionTitleWrap} style={{ marginTop: "40px" }}>
                <h2 className={styles.sectionTitle}>Lelang Selesai</h2>
              </div>

              {data.finished.length === 0 ? (
                <div className={styles.emptyState}>Belum ada lelang selesai.</div>
              ) : (
                <div className={styles.finishedContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>DETAIL IKAN</th>
                        <th>BID AKHIR</th>
                        <th>PENAWAR</th>
                        <th>PEMENANG</th>
                        <th style={{ textAlign: "right" }}>AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.finished.map((auction) => (
                        <tr key={auction.id}>
                          <td>
                            <div className={styles.fishDetailCell}>
                              <img 
                                src={auction.image_url || "/fish-placeholder.jpg"} 
                                alt={auction.name} 
                                className={styles.fishDetailImage}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44"><rect width="100%" height="100%" fill="%230f172a"/></svg>';
                                }}
                              />
                              <div>
                                <h4 className={styles.fishDetailName}>{auction.name}</h4>
                                <p className={styles.fishDetailWeight}>BERAT: {auction.weight_kg}KG</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className={styles.finalBidPrice}>
                              {formatCurrency(auction.final_price || auction.current_bid || 0)}
                            </div>
                          </td>
                          <td>
                            <div className={styles.biddersCount}>
                              {auction.bidders_count} Penawar
                            </div>
                          </td>
                          <td>
                            <div className={styles.winnerWrap}>
                              <ShieldCheck size={16} color="#94a3b8" />
                              {auction.winner_name || "Belum Ada Pemenang"}
                            </div>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <a href={`/fisherman/AuctionDetail/${auction.id}`} className={styles.actionLink}>
                              Lihat Detail
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
