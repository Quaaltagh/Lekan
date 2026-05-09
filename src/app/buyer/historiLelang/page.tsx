'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import styles from './page.module.css';
import { useAuth } from '@/context/AuthContext';
import { getBidHistory, HistoryItem } from '@/services/historyService';

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
          Clear
        </button>
        <button onClick={onClose} className={styles.calendardoneButton}>
          {dateRange.start && !dateRange.end ? 'Select End' : 'Done'}
        </button>
      </div>
    </div>
  );
}

// ─── HistoryCard ──────────────────────────────────────────────────────────────
function HistoryCard({ name, image, vessel, seller, finalPrice, date, status }: HistoryItem) {
  const isWon = status === 'Won';

  return (
    <div className={styles.itemcard}>
      <div className={styles.itembadgeWrapper}>
        <div className={`${styles.itembadge} ${isWon ? styles.itembadgeWon : styles.itembadgeLost}`}>
          {status}
        </div>
      </div>

      <div className={styles.itemcontentWrapper}>
        <div className={styles.itemimageWrapper}>
          <img src={image || 'https://darilaut.id/wp-content/uploads/2021/09/Tuna-3.jpg'}
            className={styles.itemimage} alt={name} />
        </div>

        <div className={styles.itemcontent}>
          <div>
            <h3 className={styles.itemtitle}>{name}</h3>
            <div className={styles.itemmeta}>
              <span>KM {vessel}</span>
              <span className={styles.itemseparator}>|</span>
              <span>SELLER: {seller}</span>
            </div>
          </div>

          <div className={styles.iteminfoBox}>
            <div className={styles.iteminfowrap}>
              <div>
                <span className={styles.itemlabel}>{isWon ? 'FINAL PRICE' : 'WINNING BID'}</span>
                <span className={styles.itemprice}>Rp {finalPrice}</span>
              </div>
              <div className={styles.itemdivider}></div>
              <div>
                <span className={styles.itemlabel}>DATE</span>
                <span className={styles.itemdate}>{date}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.itemaction}>
          <button className={`${styles.itembutton} ${isWon ? styles.itembuttonWon : styles.itembuttonLost}`}>
            View Detail
            {isWon && <ArrowRight className={styles.itemicon} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HistoriLelang() {
  const { user, token } = useAuth();

  // Filter state
  const [searchQuery, setSearchQuery]             = useState('');
  const [statusFilter, setStatusFilter]           = useState<'All' | 'Won' | 'Lost'>('All');
  const [dateRange, setDateRange]                 = useState<DateRange>({ start: null, end: null });
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen]     = useState(false);

  // Data state
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [fetchError, setFetchError]     = useState('');
  const [total, setTotal]               = useState(0);

  // ── Fetch dari backend ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id || !token) return;

    setLoading(true);
    setFetchError('');

    getBidHistory(user.id, token, {
      search:    searchQuery || undefined,
      status:    statusFilter,
      startDate: dateRange.start?.toISOString(),
      endDate:   dateRange.end?.toISOString(),
    })
      .then(res => {
        setHistoryItems(res.data);
        setTotal(res.total);
      })
      .catch(err => setFetchError(err.message))
      .finally(() => setLoading(false));

  }, [user?.id, token, searchQuery, statusFilter, dateRange]);

  // ── Label tombol kalender ───────────────────────────────────────────────
  const getLabel = () => {
    if (!dateRange.start) return 'Date Range';
    if (dateRange.end) return `${format(dateRange.start, 'dd MMM')} - ${format(dateRange.end, 'dd MMM yyyy')}`;
    return format(dateRange.start, 'dd MMM yyyy');
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className={styles.all}>
      <Navbar />
      <div className={styles.container}>

        <div className={styles.titlecontainer}>
          <h1 className={styles.title}>Histori Lelang</h1>
          <p className={styles.titledescription}>Review your past auction activities and outcomes.</p>
        </div>

        <div className={styles.contentcontainer}>

          {/* Search */}
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search fish species, vessel, or seller..."
              className={styles.searchinput}
            />
          </div>

          {/* Controls */}
          <div className={styles.controls}>

            {/* Status dropdown */}
            <div className={styles.dropdownWrapper}>
              <button onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)} className={styles.filterButton}>
                Status: {statusFilter}
                <ChevronDown className={`${styles.icon} ${isStatusDropdownOpen ? styles.iconRotate : ''}`} />
              </button>

              {isStatusDropdownOpen && (
                <>
                  <div className={styles.overlay} onClick={() => setIsStatusDropdownOpen(false)} />
                  <div className={styles.dropdown}>
                    {(['All', 'Won', 'Lost'] as const).map(s => (
                      <button key={s}
                        onClick={() => { setStatusFilter(s); setIsStatusDropdownOpen(false); }}
                        className={`${styles.dropdownItem} ${statusFilter === s ? styles.dropdownItemActive : ''}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

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

        {/* Cards */}
        <div className={styles.cardcontainer}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
              Memuat histori lelang...
            </div>
          ) : fetchError ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#dc2626' }}>
              {fetchError}
            </div>
          ) : historyItems.length > 0 ? (
            historyItems.map(item => (
              <HistoryCard key={item.id} {...item} />
            ))
          ) : (
            <div className={styles.emptyState}>
              <h3 className={styles.emptytitle}>No results found</h3>
              <p className={styles.emptydescription}>
                Try adjusting your search or filters to find what you're looking for.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}