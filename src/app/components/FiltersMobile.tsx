'use client';
import styles from './FiltersMobile.module.css';
import React, { useState, useEffect } from 'react';
import { ChevronDown, Filter, SlidersHorizontal } from 'lucide-react';
import { AuctionFilters } from '@/hooks/useBuyerAuctions';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface FiltersProps {
  onApply?: (filters: AuctionFilters) => void;
}

export default function FiltersMobile({ onApply }: FiltersProps) {
  const [status,       setStatus]       = useState<'active' | 'done'>('active');
  const [species,      setSpecies]      = useState('all');
  const [sort,         setSort]         = useState<AuctionFilters['sort']>('newest');
  const [minPrice,     setMinPrice]     = useState('');
  const [maxPrice,     setMaxPrice]     = useState('');
  const [speciesList,  setSpeciesList]  = useState<string[]>([]);
  const [mobileOpen,   setMobileOpen]   = useState(false);

  useEffect(() => {
    async function fetchSpecies() {
      try {
        const res = await fetch(`${API_URL}/api/auctions/buyer`);
        if (!res.ok) return;
        const data: { species?: string }[] = await res.json();
        const unique = Array.from(
          new Set(data.map(a => a.species).filter(Boolean) as string[])
        ).sort();
        setSpeciesList(unique);
      } catch {}
    }
    fetchSpecies();
  }, []);

  const handleApply = () => {
    onApply?.({
      species:   species !== 'all' ? species : undefined,
      status,
      sort,
      min_price: minPrice || undefined,
      max_price: maxPrice || undefined,
    });
    setMobileOpen(false); // Tutup accordion setelah apply
  };

  // Hitung jumlah filter aktif (selain default)
  const activeCount = [
    species !== 'all',
    minPrice !== '',
    maxPrice !== '',
    sort !== 'newest',
    status !== 'active',
  ].filter(Boolean).length;

  // ── Field JSX (dipakai di desktop & mobile) ──────────────────────────
  const fields = (
    <>
      {/* Species */}
      <div className={styles.colQuarter}>
        <label className={styles.label}>Jenis Ikan</label>
        <div className={styles.selectWrapper}>
          <select
            className={styles.select}
            value={species}
            onChange={e => setSpecies(e.target.value)}
          >
            <option value="all">Semua Jenis</option>
            {speciesList.length === 0 ? (
              <option disabled>Tidak ada Data</option>
            ) : (
              speciesList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))
            )}
          </select>
          <ChevronDown className={styles.chevron} />
        </div>
      </div>

      {/* Price Range */}
      <div className={styles.colThird}>
        <label className={styles.label}>Rentang Harga (IDR)</label>
        <div className={styles.range}>
          <input
            type="text"
            placeholder="Min"
            className={styles.input}
            value={minPrice}
            onChange={e => setMinPrice(e.target.value.replace(/\D/g, ''))}
          />
          <span className={styles.dash}>—</span>
          <input
            type="text"
            placeholder="Max"
            className={styles.input}
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value.replace(/\D/g, ''))}
          />
        </div>
      </div>

      {/* Sort By */}
      <div className={styles.colQuarter}>
        <label className={styles.label}>Urutkan</label>
        <div className={styles.selectWrapper}>
          <select
            className={styles.select}
            value={sort}
            onChange={e => setSort(e.target.value as AuctionFilters['sort'])}
          >
            <option value="newest">Terbaru</option>
            <option value="ending">Segera Berakhir</option>
            <option value="price_asc">Harga Terendah</option>
            <option value="price_desc">Harga Tertinggi</option>
          </select>
          <ChevronDown className={styles.chevron} />
        </div>
      </div>

      {/* Status */}
      <div className={styles.colAuto}>
        <label className={styles.label}>Status</label>
        <div className={styles.statusWrapper}>
          <button
            onClick={() => setStatus('active')}
            className={status === 'active' ? styles.activeBtn : styles.inactiveBtn}
          >
            Sedang Berlangsung
          </button>
          <button
            onClick={() => setStatus('done')}
            className={status === 'done' ? styles.activeBtn : styles.inactiveBtn}
          >
            Berakhir
          </button>
        </div>
      </div>

      {/* Apply */}
      <button className={styles.applyBtn} onClick={handleApply}>
        <Filter className={styles.filterIcon} />
        Terapkan
      </button>
    </>
  );

  return (
    <div className={styles.container}>

      {/* ── Desktop layout ── */}
      <div className={styles.wrapper}>
        {fields}
      </div>

      {/* ── Mobile accordion layout ── */}
      <div
        className={styles.mobileHeader}
        onClick={() => setMobileOpen(o => !o)}
        role="button"
        aria-expanded={mobileOpen}
        aria-controls="filter-mobile-body"
      >
        <div className={styles.mobileHeaderLeft}>
          <SlidersHorizontal size={16} />
          <span>Filter</span>
          {activeCount > 0 && (
            <span className={styles.mobileActiveCount}>{activeCount} aktif</span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`${styles.mobileChevron} ${mobileOpen ? styles.open : ''}`}
        />
      </div>

      <div
        id="filter-mobile-body"
        className={`${styles.mobileBody} ${mobileOpen ? styles.open : ''}`}
      >
        <div className={styles.mobileBodyInner}>
          {fields}
        </div>
      </div>

    </div>
  );
}