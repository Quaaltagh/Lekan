'use client';

import React, { useState, useMemo, useEffect }  from 'react';
import styles from './page.module.css';
import SideFisherman from '../../components/sideFisherman';
import NavbarFisherman from '../../components/NavbarFisherman';
import { Fish, Search, ChevronLeft, ChevronRight, ChevronDown, CalendarIcon } from 'lucide-react';
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
        <h4 className={styles.calendartitle}>{format(currentMonth, 'MMMM yyyy')}</h4>
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
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
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
          Bersihkan
        </button>
        <button onClick={onClose} className={styles.calendardoneButton}>
          {dateRange.start && !dateRange.end ? 'Pilih Akhir' : 'Selesai'}
        </button>
      </div>
    </div>
  );
}


function TransactionItem({ item }: any) {
  return (
    <tr>
      <td>
        <div className={styles.fishCell}>

          <div className={styles.imagePlaceholder}>
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <Fish size={24} color="#94a3b8" />
            )}
          </div>

          <div>
            <strong>{item.name}</strong>

            <p>
              {item.grade || 'STANDAR'} • {item.weight_kg}KG
            </p>
          </div>

        </div>
      </td>

      <td>
        {new Date(item.ends_at).toLocaleDateString('id-ID')}
      </td>

      <td>
        Pembeli Pasar
      </td>

      <td className={styles.price}>
        {item.current_bid
          ? `Rp ${item.current_bid.toLocaleString('id-ID')}`
          : `Rp ${item.start_price.toLocaleString('id-ID')}`}
      </td>

      {/* <td>
        <span
          className={`${styles.status} ${
            styles[item.status]
          }`}
        >
          ● {item.status.toUpperCase()}
        </span>
      </td> */}

      <td>
        <button className={styles.detailBtn}>
          Lihat Detail
        </button>
      </td>
    </tr>
  );
}

export default function AuctionHistory() {

  // DATA REALTIME DARI DATABASE
  const { auctions, loading, error } = useSellerAuctions();

  // TAMPILKAN SEMUA STATUS TERMASUK ACTIVE
  const historyAuctions = auctions;

// Filter state
  const [searchQuery, setSearchQuery]             = useState('');
  const [dateRange, setDateRange]                 = useState<DateRange>({ start: null, end: null });
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen]     = useState(false);
  
// ── Label tombol kalender ───────────────────────────────────────────────
  const getLabel = () => {
    if (!dateRange.start) return 'Rentang Tanggal';
    if (dateRange.end) return `${format(dateRange.start, 'dd MMM')} - ${format(dateRange.end, 'dd MMM yyyy')}`;
    return format(dateRange.start, 'dd MMM yyyy');
  };


  return (
    <div className={styles.container}>

      <SideFisherman />

      <main className={styles.mainContent}>

        <NavbarFisherman />

        <div className={styles.content}>

          <section className={styles.titleSection}>
            <h1>Histori Lelang</h1>

            <p className={styles.subtitle}>
              Riwayat seluruh transaksi hasil laut Anda.
            </p>
          </section>

          {/* ERROR */}
          {error && (
            <div
              style={{
                background: '#fef2f2',
                color: '#dc2626',
                padding: '1rem',
                borderRadius: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              {error}
            </div>
          )}

          <div className={styles.contentcontainer}>

          {/* Search */}
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

          {/* Controls */}
          <div className={styles.controls}>
            {/* Date dropdown */}
            <div className={styles.dropdownWrapper}>
              <button onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)} className={styles.filterButton}>
                {getLabel()}
                <CalendarIcon className={styles.icon} />
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

          <section className={styles.tableContainer}>

            <table className={styles.table}>

              <thead>
                <tr>
                  <th>SPESIES IKAN</th>
                  <th>TANGGAL TRANSAKSI</th>
                  <th>PEMBELI</th>
                  <th>HARGA AKHIR</th>
                  {/* <th>STATUS</th> */}
                  <th></th>
                </tr>
              </thead>

              <tbody>

                {loading ? (

                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: 'center',
                        padding: '2rem',
                      }}
                    >
                      Loading...
                    </td>
                  </tr>

                ) : historyAuctions.length === 0 ? (

                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: 'center',
                        padding: '2rem',
                      }}
                    >
                      Belum ada histori lelang
                    </td>
                  </tr>

                ) : (

                  historyAuctions.map((item) => (
                    <TransactionItem
                      key={item.id}
                      item={item}
                    />
                  ))

                )}

              </tbody>

            </table>

          </section>

        </div>

      </main>

    </div>
  );
}