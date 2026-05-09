'use client';
import styles from './Navbar.module.css';
import { Bell, Wallet, Search, LogOut, ChevronDown, X } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SearchResult {
  id: string;
  name: string;
  species?: string;
  weight_kg: number;
  current_bid?: number;
  start_price: number;
  image_url?: string;
  ends_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatRp(amount: number): string {
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)     return `Rp ${(amount / 1_000).toFixed(0)}K`;
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

function formatCountdown(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'Berakhir';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}j ${m}m`;
  const s = Math.floor((diff % 60000) / 1000);
  return `${m}m ${s}s`;
}

// ─── SearchDropdown component ─────────────────────────────────────────────────
function SearchDropdown({ results, loading, query, onClose }: {
  results: SearchResult[];
  loading: boolean;
  query: string;
  onClose: () => void;
}) {
  const router = useRouter();

  if (!query) return null;

  return (
    <div className={styles.searchDropdown}>
      {loading ? (
        <div className={styles.searchDropdownState}>
          <span className={styles.searchDropdownLoading}>Mencari...</span>
        </div>
      ) : results.length === 0 ? (
        <div className={styles.searchDropdownState}>
          <span className={styles.searchDropdownEmpty}>
            Tidak ada lelang untuk &quot;{query}&quot;
          </span>
        </div>
      ) : (
        <>
          <div className={styles.searchDropdownHeader}>
            <span>Hasil pencarian</span>
            <span className={styles.searchDropdownCount}>{results.length} lelang</span>
          </div>

          {results.map(item => {
            const price = item.current_bid ?? item.start_price;
            return (
              <button
                key={item.id}
                className={styles.searchDropdownItem}
                onClick={() => {
                  router.push(`/buyer/auction/${item.id}`);
                  onClose();
                }}
              >
                {/* Thumbnail */}
                <div className={styles.searchThumb}>
                  <img
                    src={item.image_url || 'https://darilaut.id/wp-content/uploads/2021/09/Tuna-3.jpg'}
                    alt={item.name}
                    className={styles.searchThumbImg}
                  />
                </div>

                {/* Info */}
                <div className={styles.searchItemInfo}>
                  <span className={styles.searchItemName}>{item.name}</span>
                  {item.species && (
                    <span className={styles.searchItemMeta}>{item.species} • {item.weight_kg}kg</span>
                  )}
                </div>

                {/* Price + timer */}
                <div className={styles.searchItemRight}>
                  <span className={styles.searchItemPrice}>{formatRp(price)}</span>
                  <span className={styles.searchItemTimer}>{formatCountdown(item.ends_at)}</span>
                </div>
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
export default function Navbar() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router   = useRouter();
  const pathname = usePathname();

  const isNotification = pathname.startsWith('/notification');
  const isWallet       = pathname === '/buyer/Dompet';

  // ── Search state ──────────────────────────────────────────────────────────
  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const searchRef  = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounce fetch — tunggu 350ms setelah user berhenti mengetik
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!val.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    setSearchOpen(true);
    setSearchLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/auctions/buyer?search=${encodeURIComponent(val.trim())}&limit=5`
        );
        if (res.ok) {
          const data = await res.json();
          // Response bisa array langsung atau { data: [] } tergantung controller
          setSearchResults(Array.isArray(data) ? data.slice(0, 5) : (data.data ?? []).slice(0, 5));
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
  }, []);

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
  };

  // Enter → redirect ke /buyer dengan query
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/buyer?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
    if (e.key === 'Escape') clearSearch();
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className={styles.header}>
      {/* Kiri - Logo */}
      <div className={styles.navLeft}>
        <Link href="/">
          <img src="/images/Lekan logo with tulisan.png" alt="LEKAN" className={styles.logoimages} />
        </Link>
      </div>

      {/* Tengah - Search */}
      <div className={styles.searchcontainer} ref={searchRef}>
        <div className={styles.searchwrapper}>
          <div className={styles.searchiconWrapper}>
            <Search className={styles.searchicon} />
          </div>
          <input
            type="text"
            className={styles.searchinput}
            placeholder="Cari ikan..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (searchQuery.trim()) setSearchOpen(true); }}
            autoComplete="off"
          />
          {/* Tombol clear */}
          {searchQuery && (
            <button className={styles.searchClear} onClick={clearSearch}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Live dropdown */}
        {searchOpen && (
          <SearchDropdown
            results={searchResults}
            loading={searchLoading}
            query={searchQuery}
            onClose={clearSearch}
          />
        )}
      </div>

      {/* Kanan - Actions */}
      <div className={styles.navRight}>
        <Link href="/notification">
          <Bell
            className={`${styles.icon} ${isNotification ? styles.iconActive : styles.iconInactive}`}
            size={20}
          />
        </Link>
        <Link href={isWallet ? '/' : '/buyer/Dompet'}>
          <Wallet
            className={`${styles.icon} ${isWallet ? styles.iconActive : styles.iconInactive}`}
            size={20}
          />
        </Link>

        {user ? (
          <div
            className={styles.profileWrapper}
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button className={styles.profileButton}>
              <div className={styles.avatar} style={{
                background: '#1e3a8a', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700,
              }}>
                {getInitials(user.full_name || user.email)}
              </div>
              <div className={styles.profileInfo}>
                <span className={styles.profileName}>
                  {user.full_name || user.email.split('@')[0]}
                </span>
                <span className={styles.profileRole}>
                  {user.role === 'pembeli' ? 'Pembeli' : 'Nelayan'}
                </span>
              </div>
              <ChevronDown
                size={14}
                className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ''}`}
                color="#94a3b8"
              />
            </button>

            {dropdownOpen && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownHeader}>
                  <p className={styles.dropdownName}>{user.full_name || '-'}</p>
                  <p className={styles.dropdownEmail}>{user.email}</p>
                </div>
                <hr className={styles.dropdownDivider} />
                <Link href="" className={styles.dropdownItem}>Profil Saya</Link>
                <Link href="/buyer/statusLelang/" className={styles.dropdownItem}>Status Lelang</Link>
                <Link href="/buyer/historiLelang/" className={styles.dropdownItem}>Riwayat Lelang</Link>
                <hr className={styles.dropdownDivider} />
                <button
                  className={`${styles.dropdownItem} ${styles.dropdownLogout}`}
                  onClick={() => {
                    logout();
                    setDropdownOpen(false);
                    router.push('/');
                  }}
                >
                  <LogOut size={14} /> Keluar
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.divauth}>
            <Link href="/auth?mode=login" className={styles.auth}>Masuk</Link>
            {' | '}
            <Link href="/auth?mode=register" className={styles.auth}>Daftar</Link>
          </div>
        )}
      </div>
    </header>
  );
}