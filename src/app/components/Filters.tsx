'use client';
import styles from './Filters.module.css';
import React, { useState, useEffect } from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import { AuctionFilters } from '@/hooks/useBuyerAuctions';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface FiltersProps {
  onApply?: (filters: AuctionFilters) => void;
}

export default function Filters({ onApply }: FiltersProps) {
  const [status,      setStatus]      = useState<'active' | 'done'>('active');
  const [species,     setSpecies]     = useState('all');
  const [sort,        setSort]        = useState<AuctionFilters['sort']>('newest');
  const [minPrice,    setMinPrice]    = useState('');
  const [maxPrice,    setMaxPrice]    = useState('');
  const [speciesList, setSpeciesList] = useState<string[]>([]);

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
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>

        {/* Species */}
        <div className={styles.colQuarter}>
          <label className={styles.label}>Species</label>
          <div className={styles.selectWrapper}>
            <select
              className={styles.select}
              value={species}
              onChange={e => setSpecies(e.target.value)}
            >
              <option value="all">All Types</option>
              {speciesList.length === 0 ? (
                <option disabled>Memuat...</option>
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
          <label className={styles.label}>Price Range (IDR)</label>
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
          <label className={styles.label}>Sort By</label>
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
              Live Now
            </button>
            <button
              onClick={() => setStatus('done')}
              className={status === 'done' ? styles.activeBtn : styles.inactiveBtn}
            >
              Ended
            </button>
          </div>
        </div>

        {/* Apply */}
        <button className={styles.applyBtn} onClick={handleApply}>
          <Filter className={styles.filterIcon} />
          Apply
        </button>

      </div>
    </div>
  );
}