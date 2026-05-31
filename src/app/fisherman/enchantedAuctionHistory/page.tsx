'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import styles from './page.module.css';
import SideFisherman from '../../components/sideFisherman';
import NavbarFisherman from '../../components/NavbarFisherman';
import { Fish, Search, ChevronLeft, ChevronRight, Calendar, Loader2 } from 'lucide-react';
import { useSellerAuctions } from '@/hooks/useSellerAuctions';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function safeSrc(url?: string | null): string | undefined {
  return url && url.trim() !== '' ? url : undefined;
}

interface DateRange {
  start: Date | null;
  end:   Date | null;
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
    const endIdx   = endOfWeek(endOfMonth(currentMonth));
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
          const isSelectedEnd   = dateRange.end   && isSameDay(day, dateRange.end);
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
                ${isInRange         ? styles.calendardayInRange    : ''}
                ${isSelectedStart   ? styles.calendardayStart      : ''}
                ${isSelectedEnd     ? styles.calendardayEnd        : ''}
                ${isSelectedStart && dateRange.end   ? styles.calendarroundRightNone : ''}
                ${isSelectedEnd   && dateRange.start ? styles.calendarroundLeftNone  : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      <div className={styles.calendarfooter}>
        <button
          onClick={() => { onSelect({ start: null, end: null }); setSelectingStep('START'); }}
          className={styles.calendarclearButton}
        >
          Reset
        </button>
        <button onClick={onClose} className={styles.calendardoneButton}>
          {dateRange.start && !dateRange.end ? 'Pilih Rentang' : 'Selesai'}
        </button>
      </div>
    </div>
  );
}

// ─── TransactionItem — fetch buyer name dari /api/history/detail/:auctionId ──
function TransactionItem({ item, token }: { item: any; token: string }) {
  const imgSrc = safeSrc(item.image_url);

  const date = new Date(item.ends_at);
  const formatted = `${String(date.getDate()).padStart(2, '0')} ${date.toLocaleDateString('id-ID', {
    month: 'long', year: 'numeric',
  })}`;

  // ── Fetch buyer name ────────────────────────────────────────────────────
  const [buyerName, setBuyerName] = useState<string>('-');
  const [buyerLoading, setBuyerLoading] = useState(true);

  useEffect(() => {
    if (!item.id || !token) return;

    // Hanya fetch untuk auction yang sudah done (ada pemenangnya)
    if (item.status !== 'done') {
      setBuyerName('-');
      setBuyerLoading(false);
      return;
    }

    fetch(`${API_URL}/api/history/detail/${item.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.winner?.name) {
          setBuyerName(data.winner.name);
        } else {
          setBuyerName('Tidak ada pemenang');
        }
      })
      .catch(() => setBuyerName('-'))
      .finally(() => setBuyerLoading(false));
  }, [item.id, item.status, token]);

  const displayPrice = item.status === 'done'
    ? (item.final_price ?? item.current_bid ?? item.start_price)
    : (item.current_bid ?? item.start_price);

  const [isMobile, setIsMobile] = useState(false);
        
    // detect mobile
    useEffect(() => {
      const checkScreen = () => {
        setIsMobile(window.innerWidth <= 768);
      };
  
      checkScreen();
  
      window.addEventListener('resize', checkScreen);
  
      return () => window.removeEventListener('resize', checkScreen);
    }, []);

  return (
    isMobile ? (
      <div className={styles.itemrow}>
        <div className={styles.kiri}>
          <div className={styles.itemimageWrapper}>
            {imgSrc
            ? <img src={imgSrc} alt={item.name} />
            : <Fish size={24} color="#94a3b8" />}
          </div>
        </div>
        <div className={styles.kanan}>
          <div className={styles.atas}>
          {/* Product */}
          <div className={styles.itemproduct}>
            
            
              <h4 className={styles.itemname}>{item.name}</h4>
              <p className={styles.itemmeta}>
                {item.grade || 'STANDAR'} • {item.weight_kg}KG • {formatted}
              </p>
            
          </div>

          </div>

          <div className={styles.itemtext}>
        {buyerLoading
          ? <Loader2 size={14} className="animate-spin" style={{ color: '#94a3b8' }} />
          : <span style={{ fontWeight: 600 }}>{ buyerName !== '-' ? buyerName : 'Tidak Ada Pembeli'}</span>}
      </div>

          {/* Price */}
          <div className={styles.itempriceWrapper}>
            <span className={styles.itemprice}>
              Rp {displayPrice?.toLocaleString('id-ID') ?? '-'}
            </span>
          </div>

          

          {/* Action — FIX: pakai Link bukan button biasa */}
          <div className={styles.itemactions}>
            <Link href={`/fisherman/enchantedAuctionHistory/${item.id}`} className={styles.itembutton}>
              Lihat Detail
            </Link>
          </div>
        </div>
      </div>
    ): (
      <div className={styles.itemrow}>
      {/* Ikan */}
      <div className={styles.itemproduct}>
        <div className={styles.itemimageWrapper}>
          {imgSrc
            ? <img src={imgSrc} alt={item.name} />
            : <Fish size={24} color="#94a3b8" />}
        </div>
        <div>
          <h4 className={styles.itemname}>{item.name}</h4>
          <p className={styles.itemmeta}>
            {item.grade || 'STANDAR'} • {item.weight_kg}KG
          </p>
        </div>
      </div>

      {/* Tanggal */}
      <div className={styles.itemtext}>{formatted}</div>

      {/* Pembeli — dari backend */}
      <div className={styles.itemtext}>
        {buyerLoading
          ? <Loader2 size={14} className="animate-spin" style={{ color: '#94a3b8' }} />
          : <span style={{ fontWeight: buyerName !== '-' ? 600 : 400 }}>{buyerName}</span>}
      </div>

      {/* Harga */}
      <div className={styles.itempriceWrapper}>
        <span className={styles.itemprice}>
          Rp {displayPrice?.toLocaleString('id-ID') ?? '-'}
        </span>
      </div>

      {/* Aksi */}
      <div className={styles.itemactions}>
        <Link href={`/fisherman/enchantedAuctionHistory/${item.id}`} className={styles.itembutton}>
          Lihat Detail
        </Link>
      </div>
    </div>
    )
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AuctionHistory() {
  const { auctions, loading, error } = useSellerAuctions();
  const { token } = useAuth();

  const [searchQuery,        setSearchQuery]        = useState('');
  const [dateRange,          setDateRange]          = useState<DateRange>({ start: null, end: null });
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);

  // Filter hanya yang sudah done atau cancelled (history)
  const historyAuctions = useMemo(() => {
    return auctions.filter(item => {

      // Tampilkan semua status kecuali active
      if (item.status === 'active') return false;

      const deliveryStatus = Array.isArray(item.logistics) 
        ? item.logistics[0]?.status 
        : item.logistics?.status;

      // 2. Cek apakah statusnya 'delivered'
      if (item.status === 'done' && deliveryStatus !== 'delivered') return false;

      const matchesSearch = searchQuery
        ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.species && item.species.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;

      let matchesDate = true;
      if (dateRange.start) {
        const itemDate = new Date(item.ends_at);
        const start    = startOfDay(dateRange.start);
        if (dateRange.end) {
          matchesDate = itemDate >= start && itemDate <= endOfDay(dateRange.end);
        } else {
          matchesDate = itemDate >= start;
        }
      }

      return matchesSearch && matchesDate;
    });
  }, [auctions, searchQuery, dateRange]);

  const getLabel = () => {
    if (!dateRange.start) return 'Rentang Tanggal';
    if (dateRange.end)    return `${format(dateRange.start, 'dd MMM')} - ${format(dateRange.end, 'dd MMM yyyy')}`;
    return format(dateRange.start, 'dd MMM yyyy');
  };
const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.all}>
      <SideFisherman
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                />
      <div className={styles.container}>
        <NavbarFisherman setSidebarOpen={setSidebarOpen}/>

        <div className={styles.content}>
          <section className={styles.titleSection}>
            <h1>Histori Lelang</h1>
            <p className={styles.subtitle}>Riwayat seluruh transaksi hasil laut Anda.</p>
          </section>

          {error && (
            <div style={{
              background: '#fef2f2', color: '#dc2626',
              padding: '1rem', borderRadius: '0.75rem', marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}

          {/* Search & Filter */}
          <div className={styles.contentcontainer}>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari spesies ikan, kapal, atau pembeli..."
                className={styles.searchinput}
              />
            </div>

            <div className={styles.controls}>
              <div className={styles.dropdownWrapper}>
                <button
                  onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                  className={styles.filterButton}
                >
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

          {/* Table */}
          <div className={styles.cardcontainer}>
            <div className={styles.cardheader}>
              <div className={styles.cardheaderText}>Spesies Ikan</div>
              <div className={styles.cardheaderText}>Tanggal Transaksi</div>
              <div className={styles.cardheaderText}>Pembeli</div>
              <div className={styles.cardheaderText}>Harga Akhir</div>
              <div className={styles.cardheaderText}></div>
            </div>

            <div>
              {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <Loader2 size={20} className="animate-spin" />
                  Memuat histori lelang...
                </div>
              ) : historyAuctions.length === 0 ? (
                <div className={styles.emptyState}>
                  <h3 className={styles.emptytitle}>Tidak ada hasil ditemukan</h3>
                  <p className={styles.emptydescription}>
                    Coba sesuaikan pencarian atau filter Anda untuk menemukan apa yang Anda cari.
                  </p>
                </div>
              ) : (
                historyAuctions.map(item => (
                  <TransactionItem key={item.id} item={item} token={token ?? ''} />
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}