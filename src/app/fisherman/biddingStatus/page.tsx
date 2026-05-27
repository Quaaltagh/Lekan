"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import styles from "./BiddingStatus.module.css";
import SideFisherman from "../../components/sideFisherman";
import NavbarFisherman from "../../components/NavbarFisherman";
import { Search, Filter, ShieldCheck, Loader2, ArrowRight, ChevronLeft, ChevronRight, Clock, Calendar } from "lucide-react";
import { auctionService, BiddingStatusResponse } from "@/services/auctionService";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';
import { useSellerAuctions } from '@/hooks/useSellerAuctions';

import {
  format,
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  eachDayOfInterval,
  isSameMonth, isSameDay,
  addMonths, subMonths,
  isWithinInterval,
  isBefore,
  startOfDay, endOfDay,
} from 'date-fns';
import { id } from 'date-fns/locale';

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
  bidders_count: number;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface DateRange {
  start: Date | null;
  end: Date | null;
}

// ─── CalendarPicker ───────────────────────────────────────────────────────────
function CalendarPicker({ onSelect, dateRange, onClose }: {
  onSelect: (range: DateRange) => void;
  dateRange: DateRange;
  onClose: () => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(dateRange.start || new Date());
  const [selectingStep, setSelectingStep] = useState<'START' | 'END'>(
    dateRange.start ? 'END' : 'START'
  );

  const days = useMemo(() => {
    const startIdx = startOfWeek(startOfMonth(currentMonth));
    const endIdx = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start: startIdx, end: endIdx });
  }, [currentMonth]);

  const handleDateClick = (day: Date) => {
    if (selectingStep === 'START' || !dateRange.start || isBefore(day, dateRange.start)) {
      onSelect({ start: day, end: null });
      setSelectingStep('END');
    } else {
      onSelect({ ...dateRange, end: day });
      setSelectingStep('START');
    }
  };

  return (
    <div className={styles.calendarcontainer}>
      <div className={styles.calendarheader}>
        <h4 className={styles.calendartitle}>{format(currentMonth, 'MMMM yyyy', { locale: id })}</h4>
        <div className={styles.calendarnav}>
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className={styles.calendarnavButton}>
            <ChevronLeft className={styles.calendarnavIcon} />
          </button>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className={styles.calendarnavButton}>
            <ChevronRight className={styles.calendarnavIcon} />
          </button>
        </div>
      </div>

      <div className={styles.calendardaysHeader}>
        {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d, i) => (
          <div key={i} className={styles.calendardayLabel}>{d}</div>
        ))}
      </div>

      <div className={styles.calendargrid}>
        {days.map((day, i) => {
          const isSelectedStart = dateRange.start && isSameDay(day, dateRange.start);
          const isSelectedEnd = dateRange.end && isSameDay(day, dateRange.end);
          const isInRange = dateRange.start && dateRange.end &&
            isWithinInterval(day, { start: startOfDay(dateRange.start), end: endOfDay(dateRange.end) });
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <button
              key={i}
              onClick={() => handleDateClick(day)}
              className={`
                ${styles.calendarday}
                ${!isCurrentMonth ? styles.calendardayOutside : styles.calendardayCurrent}
                ${isInRange ? styles.calendardayInRange : ''}
                ${isSelectedStart ? styles.calendardayStart : ''}
                ${isSelectedEnd ? styles.calendardayEnd : ''}
                ${isSelectedStart && dateRange.end ? styles.calendarroundRightNone : ''}
                ${isSelectedEnd && dateRange.start ? styles.calendarroundLeftNone : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      <div className={styles.calendarfooter}>
        <button onClick={() => { onSelect({ start: null, end: null }); setSelectingStep('START'); }}
          className={styles.calendarclearButton}>
          Reset
        </button>
        <button onClick={onClose} className={styles.calendardoneButton}>
          {dateRange.start && !dateRange.end ? 'Pilih Rentang' : 'Selesai'}
        </button>
      </div>
    </div>
  );
}

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

function AuctionCard({ auction }: { auction: ActiveAuction }) {
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
            Sedang Berlangsung
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
          <div className={`${styles.contentcard}`}>
            <div className={styles.bidcontent}>
              <span className={`${styles.label}`}>
                Penawar
              </span>
              <span className={`${styles.value} `}>
                {auction.bidders_count} 
              </span>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.bidcontent}>
              <span className={`${styles.label}`}>
                Bid Tertinggi
              </span>
              <span className={`${styles.value}`}>
                Rp {currentBid.toLocaleString('id-ID')}
              </span>
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
            Lihat Detail
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BiddingStatusPage() {
  const { user, token } = useAuth();
  const [data, setData] = useState<BiddingStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const { auctions} = useSellerAuctions();

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

  // Filter lelang berdasarkan pencarian (nama ikan/lelang)
  const filteredActive = data?.active.filter((auction) => 
    auction.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // const filteredFinished = data?.finished.filter((auction) => 
  //   auction.name.toLowerCase().includes(searchQuery.toLowerCase())
  // ) || [];

  

  const filteredFinished = useMemo(() => {
  return (
    data?.finished.filter(item => {
      const matchesSearch = searchQuery
        ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.species &&
            item.species.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;

      let matchesDate = true;

      if (dateRange.start) {
        const itemDate = new Date(item.ends_at);
        const start = startOfDay(dateRange.start);

        if (dateRange.end) {
          matchesDate =
            itemDate >= start &&
            itemDate <= endOfDay(dateRange.end);
        } else {
          matchesDate = itemDate >= start;
        }
      }

      return matchesSearch && matchesDate;
    }) || []
  );
}, [data, searchQuery, dateRange]);
  

  // If user is not ready but it's initially loading
  if (!user && !loading) {
    return <div className={styles.errorState}>Silakan masuk untuk melihat halaman ini.</div>;
  }

  // calendar
    

    const getLabel = () => {
        if (!dateRange.start) return 'Rentang Tanggal';
        if (dateRange.end) return `${format(dateRange.start, 'dd MMM')} - ${format(dateRange.end, 'dd MMM yyyy')}`;
        return format(dateRange.start, 'dd MMM yyyy');
      };

    
    

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
              </div>

              {filteredActive.length === 0 ? (
                <div className={styles.emptyState}>Tidak ada lelang aktif saat ini.</div>
              ) : (
                <div className={styles.activeAuctionsGrid}>
                  {filteredActive.map((auction) => (

                    <AuctionCard key={auction.id} auction={auction} />
                  ))}
                </div>
              )}

              {/* Finished Auctions Section */}
              <div className={styles.sectionTitleWrap} style={{ marginTop: "40px" }}>
                <h2 className={styles.sectionTitle}>Lelang Selesai</h2>

                <div className={styles.controls}>
                  <div className={styles.searchBar}>
                    <div className={styles.searchInputWrap}>
                      <Search size={16} className={styles.searchIcon} />
                      <input 
                        type="text" 
                        placeholder="Cari lelang..." 
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className={styles.dropdownWrapper}>
                    <button onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)} className={styles.filterButton}>
                      {getLabel()}
                      <Calendar className={styles.icon} />
                    </button>

                    {isDateDropdownOpen && (
                      <>
                        <div className={styles.overlay} onClick={() => setIsDateDropdownOpen(false)} />
                        <CalendarPicker
                          dateRange={dateRange}
                          onSelect={setDateRange}
                          onClose={() => { if (dateRange.start && dateRange.end) setIsDateDropdownOpen(false); }}
                        />
                      </>
                    )}
                  </div>
                </div>
                
              </div>

              {filteredFinished.length === 0 ? (
                <div className={styles.emptyState}>Belum ada lelang selesai.</div>
              ) : (
                <div className={styles.finishedContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>DETAIL IKAN</th>
                        <th>TANGGAL TRANSAKSI</th>
                        <th>BID AKHIR</th>
                        <th>PENAWAR</th>
                        <th>PEMENANG</th>
                        <th style={{ textAlign: "right" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFinished.map((auction) => (
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
                            <div className={styles.dateBid}>
                              {(() => {
                                const date = new Date(auction.ends_at);

                                const formatted = `${String(date.getDate()).padStart(2, '0')} ${date.toLocaleDateString('id-ID', {
                                  month: 'long',
                                  year: 'numeric',
                                })}`;

                                return formatted;
                              })()}
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
                              {/* <ShieldCheck size={16} color="#94a3b8" /> */}
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