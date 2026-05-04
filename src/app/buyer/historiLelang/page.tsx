'use client';
import React from 'react';
import { Search, ChevronDown,  Calendar as CalendarIcon, ChevronLeft, ChevronRight, ArrowRight} from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import styles from './page.module.css';
import { useState, useMemo } from 'react';

import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  parse,
  isValid,
  isWithinInterval,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay
} from 'date-fns';

interface HistoryItemProps {
  id: string;
  name: string;
  image: string;
  vessel: string;
  seller: string;
  finalPrice: string;
  date: string;
  status: 'Won' | 'Lost';
}

interface DateRange {
  start: Date | null;
  end: Date | null;
}

function CalendarPicker({ onSelect, dateRange, onClose }: { onSelect: (range: DateRange) => void, dateRange: DateRange, onClose: () => void }) {
  const [currentMonth, setCurrentMonth] = useState(dateRange.start || new Date(2026, 5, 1)); 
  const [selectingStep, setSelectingStep] = useState<'START' | 'END'>(dateRange.start ? 'END' : 'START');

  const days = useMemo(() => {
    const startIdx = startOfWeek(startOfMonth(currentMonth));
    const endIdx = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start: startIdx, end: endIdx });
  }, [currentMonth]);

  const handleDateClick = (day: Date) => {
    if (selectingStep === 'START' || !dateRange.start || (dateRange.start && isBefore(day, dateRange.start))) {
      onSelect({ start: day, end: null });
      setSelectingStep('END');
    } else {
      onSelect({ ...dateRange, end: day });
      setSelectingStep('START');
    }
  };

  return (
     <div className={styles.calendarcontainer}>
      
      {/* Header */}
      <div className={styles.calendarheader}>
        <h4 className={styles.calendartitle}>
          {format(currentMonth, 'MMMM yyyy')}
        </h4>

        <div className={styles.calendarnav}>
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className={styles.calendarnavButton}
          >
            <ChevronLeft className={styles.calendarnavIcon} />
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className={styles.calendarnavButton}
          >
            <ChevronRight className={styles.calendarnavIcon} />
          </button>
        </div>
      </div>

      {/* Days label */}
      <div className={styles.calendardaysHeader}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className={styles.calendardayLabel}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={styles.calendargrid}>
        {days.map((day, i) => {
          const isSelectedStart = dateRange.start && isSameDay(day, dateRange.start);
          const isSelectedEnd = dateRange.end && isSameDay(day, dateRange.end);
          const isInRange =
            dateRange.start &&
            dateRange.end &&
            isWithinInterval(day, {
              start: startOfDay(dateRange.start),
              end: endOfDay(dateRange.end),
            });

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

      {/* Footer */}
      <div className={styles.calendarfooter}>
        <button
          onClick={() => {
            onSelect({ start: null, end: null });
            setSelectingStep('START');
          }}
          className={styles.calendarclearButton}
        >
          Clear
        </button>

        <button
          onClick={onClose}
          className={styles.calendardoneButton}
        >
          {dateRange.start && !dateRange.end ? 'Select End' : 'Done'}
        </button>
      </div>
    </div>
  );
}

function HistoryCard({ name, image, vessel, seller, finalPrice, date, status }: HistoryItemProps) {
  const isWon = status === 'Won';

  return (
    <div className={styles.itemcard}>
      
      {/* Badge */}
      <div className={styles.itembadgeWrapper}>
        <div
          className={`${styles.itembadge} ${
            isWon ? styles.itembadgeWon : styles.itembadgeLost
          }`}
        >
          {status}
        </div>
      </div>

      <div className={styles.itemcontentWrapper}>
        
        {/* Image */}
        <div className={styles.itemimageWrapper}>
          <img
            src={image}
            className={styles.itemimage}
            alt={name}
          />
        </div>

        {/* Content */}
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
                <span className={styles.itemlabel}>
                    {isWon ? 'FINAL PRICE' : 'WINNING BID'}
                </span>
                <span className={styles.itemprice}>
                    Rp {finalPrice}
                </span>
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
          <button
            className={`${styles.itembutton} ${
              isWon ? styles.itembuttonWon : styles.itembuttonLost
            }`}
          >
            View Detail
            {isWon && <ArrowRight className={styles.itemicon} />}
          </button>
        </div>
      </div>
    </div>
  );
}


export default function HistoriLelang({ onBack }: { onBack: () => void }) {
   const [activeMenu, setActiveMenu] = useState('history');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Won' | 'Lost'>('All');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('All');
   const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const historyItems: HistoryItemProps[] = [
    {
      id: '1',
      name: 'Premium Yellowfin Tuna',
      image: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?q=80&w=400&auto=format&fit=crop',
      vessel: 'BINTANG LAUT',
      seller: 'BUDI M.',
      finalPrice: '45.000.000',
      date: '12 May 2026',
      status: 'Won'
    },
    {
      id: '2',
      name: 'Giant Tiger Prawns (50kg)',
      image: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?q=80&w=400&auto=format&fit=crop',
      vessel: 'SAMUDERA',
      seller: 'AGUS P.',
      finalPrice: '12.500.000',
      date: '10 April 2026',
      status: 'Lost'
    },
    {
      id: '3',
      name: 'Red Snapper Grade A',
      image: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?q=80&w=400&auto=format&fit=crop',
      vessel: 'NELAYAN JAYA',
      seller: 'JOKO W.',
      finalPrice: '8.200.000',
      date: '05 May 2026',
      status: 'Won'
    }
  ];

    const filteredItems = historyItems.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vessel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.seller.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    
    let matchesDate = true;
    if (dateRange.start && dateRange.end) {
      const itemDate = parse(item.date, 'dd MMM yyyy', new Date());
      matchesDate = isValid(itemDate) && isWithinInterval(itemDate, { 
        start: startOfDay(dateRange.start), 
        end: endOfDay(dateRange.end) 
      });
    } else if (dateRange.start) {
      const itemDate = parse(item.date, 'dd MMM yyyy', new Date());
      matchesDate = isValid(itemDate) && isSameDay(itemDate, dateRange.start);
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const getLabel = () => {
    if (!dateRange.start) return 'Date Range';

    if (dateRange.start && dateRange.end) {
      return `${format(dateRange.start, 'dd MMM')} - ${format(dateRange.end, 'dd MMM yyyy')}`;
    }

    return format(dateRange.start, 'dd MMM yyyy');
  };


    return(
    <>
    <div className={styles.all}>
        <Navbar />
        <div className={styles.container}>
            <div className={styles.titlecontainer}>
                <h1 className={styles.title}>Histori Lelang</h1>
                <p className={styles.titledescription}>
                    Review your past auction activities and outcomes.
                </p>
            </div>

            <div className={styles.contentcontainer}>
      
                {/* Search */}
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} />
                    <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search fish species, vessel, or ID..."
                    className={styles.searchinput}
                    />
                </div>

                {/* Controls */}
                <div className={styles.controls}>
                    
                    {/* Dropdown */}
                    <div className={styles.dropdownWrapper}>
                        <button
                            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                            className={styles.filterButton}
                        >
                            Status: {statusFilter.charAt(0) + statusFilter.slice(1).toLowerCase()}
                            <ChevronDown
                            className={`${styles.icon} ${isStatusDropdownOpen ? styles.iconRotate : ''}`}
                            />
                        </button>

                        {isStatusDropdownOpen && (
                            <>
                            <div
                                className={styles.overlay}
                                onClick={() => setIsStatusDropdownOpen(false)}
                            />

                            <div className={styles.dropdown}>
                                {(['All', 'Won', 'Lost'] as const).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => {
                                    setStatusFilter(status);
                                    setIsStatusDropdownOpen(false);
                                    }}
                                    className={`${styles.dropdownItem} ${
                                    statusFilter === status ? styles.dropdownItemActive : ''
                                    }`}
                                >
                                    {status}
                                </button>
                                ))}
                            </div>
                            </>
                        )}
                    </div>

                    <div className={styles.dropdownWrapper}>
                        <button
                            onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                            className={styles.filterButton}
                        >
                            {getLabel()}
                            <CalendarIcon
                            className={styles.icon}
                            />
                        </button>

                        {isDateDropdownOpen && (
                            <>
                            <div
                                className={styles.overlay}
                                onClick={() => setIsDateDropdownOpen(false)}
                            />

                            <CalendarPicker
                                dateRange={dateRange}
                                onSelect={setDateRange}
                                onClose={() => {
                                if (dateRange.start && dateRange.end) {
                                    setIsDateDropdownOpen(false);
                                }
                                }}
                            />
                            </>
                        )}
                        </div>
                    

                </div>
            </div>
            

            <div className={styles.cardcontainer}>
                    {filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                        <HistoryCard 
                        key={item.id}
                        id={item.id}
                        name={item.name}
                        image={item.image}
                        vessel={item.vessel}
                        seller={item.seller}
                        finalPrice={item.finalPrice}
                        date={item.date}
                        status={item.status}
                        />
                    ))
                    ) : (
                    <div className={styles.emptyState}>
                        <h3 className={styles.emptytitle}>
                        No results found
                        </h3>

                        <p className={styles.emptydescription}>
                        Try adjusting your search or filters to find what you're looking for.
                        </p>
                    </div>
                    )}
            </div>

        </div>
    </div>
  </>
  );
}