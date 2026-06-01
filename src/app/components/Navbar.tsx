'use client';
import styles from './Navbar.module.css';
import { Bell, Wallet, Search, LogOut, ChevronDown, X } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

function getInitials(name?: string, email?: string): string {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  if (email) return email[0].toUpperCase();
  return '?';
}

function UserAvatar({ avatarUrl, name, email }: {
  avatarUrl: string | null;
  name?: string;
  email?: string;
}) {
  const [imgError, setImgError] = useState(false);
  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name || 'Avatar'}
        className={styles.avatarImg}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div className={styles.avatarFallback}>
      {getInitials(name, email)}
    </div>
  );
}

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
                <div className={styles.searchThumb}>
                  <img
                    src={item.image_url || 'https://darilaut.id/wp-content/uploads/2021/09/Tuna-3.jpg'}
                    alt={item.name}
                    className={styles.searchThumbImg}
                  />
                </div>
                <div className={styles.searchItemInfo}>
                  <span className={styles.searchItemName}>{item.name}</span>
                  {item.species && (
                    <span className={styles.searchItemMeta}>{item.species} • {item.weight_kg}kg</span>
                  )}
                </div>
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

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router   = useRouter();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  const isNotification = pathname.startsWith('/notification');
  const isWallet       = pathname === '/buyer/Dompet';

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || !token) { setAvatarUrl(null); return; }
    if ((user as any).avatar_url) { setAvatarUrl((user as any).avatar_url); return; }
    fetch(`${API_URL}/api/profile/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.avatar_url) setAvatarUrl(data.avatar_url); })
      .catch(() => {});
  }, [user?.id, token]);

  useEffect(() => {
    if (!user) setAvatarUrl(null);
  }, [user]);

  const [searchQuery,   setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const searchRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.profileWrapper}`)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setSearchResults([]); setSearchOpen(false); return; }
    setSearchOpen(true);
    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/auctions/buyer?search=${encodeURIComponent(val.trim())}&limit=5`
        );
        if (res.ok) {
          const data = await res.json();
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/buyer?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
    if (e.key === 'Escape') clearSearch();
  };

  return (
    <>
      <header className={styles.header}>

        {/* Kiri - Logo */}
        <div className={styles.navLeft}>
          <Link href="/">
            <img src="/images/Lekan logo with tulisan.png" alt="LEKAN" className={styles.logoimages} />
          </Link>
        </div>

        {/* Tengah - Search (Desktop only, disembunyikan di mobile lewat CSS) */}
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
            {searchQuery && (
              <button className={styles.searchClear} onClick={clearSearch}>
                <X size={14} />
              </button>
            )}
          </div>
          {searchOpen && (
            <SearchDropdown
              results={searchResults}
              loading={searchLoading}
              query={searchQuery}
              onClose={clearSearch}
            />
          )}
        </div>

        {/* Kanan */}
        <div className={styles.navRight}>

          {/* Bell & Wallet — desktop only */}
          {user && (
            <div className={styles.desktopIconsOnly}>
              <Link href="/notification">
                <Bell
                  className={`${styles.icon} ${isNotification ? styles.iconActive : styles.iconInactive}`}
                  size={20}
                />
              </Link>
              <Link href={isWallet ? '/buyer' : '/buyer/Dompet'}>
                <Wallet
                  className={`${styles.icon} ${isWallet ? styles.iconActive : styles.iconInactive}`}
                  size={20}
                />
              </Link>
            </div>
          )}

          {/* Profile button — tampil di desktop DAN mobile */}
          {user ? (
            <div
              className={styles.profileWrapper}
            >
              <button
                className={styles.profileButton}
                onClick={() => setDropdownOpen(prev => !prev)}
              >
                <div className={styles.avatar}>
                  <UserAvatar avatarUrl={avatarUrl} name={user.full_name} email={user.email} />
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
                    <div className={styles.dropdownAvatar}>
                      <UserAvatar avatarUrl={avatarUrl} name={user.full_name} email={user.email} />
                    </div>
                    <div>
                      <p className={styles.dropdownName}>{user.full_name || '-'}</p>
                      <p className={styles.dropdownEmail}>{user.email}</p>
                    </div>
                  </div>
                  <hr className={styles.dropdownDivider} />
                  <Link href="/buyer/profile" className={styles.dropdownItem}>Profil Saya</Link>
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
              <span> | </span>
              <Link href="/auth?mode=register" className={styles.auth}>Daftar</Link>
            </div>
          )}

        </div>
      </header>

      {/* Sub-bar mobile: Search + Bell + Wallet */}
      {isMobile && (
        <div className={styles.mobileSubHeader}>
          <div className={styles.mobileSearchWrapper} ref={searchRef}>
            <div className={styles.searchwrapper}>
              <div className={styles.searchiconWrapper}>
                <Search className={styles.searchicon} />
              </div>
              <input
                type="text"
                className={styles.searchinput}
                placeholder="Cari lelang ikan..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                onFocus={() => { if (searchQuery.trim()) setSearchOpen(true); }}
                autoComplete="off"
              />
              {searchQuery && (
                <button className={styles.searchClear} onClick={clearSearch}>
                  <X size={14} />
                </button>
              )}
            </div>
            {searchOpen && (
              <SearchDropdown
                results={searchResults}
                loading={searchLoading}
                query={searchQuery}
                onClose={clearSearch}
              />
            )}
          </div>

          {user && (
            <div className={styles.mobileIconsWrapper}>
              <Link href="/notification">
                <Bell
                  className={`${styles.icon} ${isNotification ? styles.iconActive : styles.iconInactive}`}
                  size={22}
                />
              </Link>
              <Link href={isWallet ? '/buyer' : '/buyer/Dompet'}>
                <Wallet
                  className={`${styles.icon} ${isWallet ? styles.iconActive : styles.iconInactive}`}
                  size={22}
                />
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}