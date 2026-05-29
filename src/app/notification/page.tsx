'use client'
import { Bell, Clock, CreditCard, FileText, Shield, Ship } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import styles from './page.module.css';
import BuyerNavbar from '@/app/components/Navbar';
import SellerNavbar from '@/app/components/NavbarFisherman';
import SideFisherman from '@/app/components/sideFisherman'
import { useAuth } from '@/context/AuthContext';
import {
  getNotifications,
  markAllAsRead as apiMarkAllAsRead,
  Notification,
} from '@/services/notificationService';

function NotificationCard({ type, title, description, created_at, is_read }: Notification) {
  const iconClass = is_read ? styles.iconSeen : styles.iconBlue;
  const bgClass   = is_read ? styles.bgDefault : styles.bgBidding;

  const getIcon = () => {
    switch (type) {
      case 'lelang':     return <Bell        className={`${styles.icon} ${iconClass}`} />;
      case 'pembayaran': return <CreditCard  className={`${styles.icon} ${iconClass}`} />;
      case 'transaksi':  return <FileText    className={`${styles.icon} ${iconClass}`} />;
      case 'keamanan':   return <Shield      className={`${styles.icon} ${iconClass}`} />;
      case 'kapal':      return <Ship        className={`${styles.icon} ${iconClass}`} />;
    }
  };

  const formatTime = (iso: string) => {
    const diff  = Date.now() - new Date(iso).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 1)  return 'Baru saja';
    if (mins  < 60) return `${mins} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return `${days} hari lalu`;
  };

  const getTime = (iso: string) => {
    const diff  = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / 3600000);
    return hours;
  };

  return (
    <div className={`${styles.card} ${!is_read ? styles.cardNew : styles.cardOld}`}>
      <div className={styles.cardContent}>
        <div className={`${styles.iconWrapper} ${bgClass}`}>
          {getIcon()}
        </div>

        <div className={styles.cardBody}>
          <div className={styles.cardHeader}>
            <h4 className={`${styles.title} ${!is_read ? styles.titleNew : styles.titleOld}`}>
              {title}
            </h4>
            {!is_read && getTime(created_at) <= 1 && (
              <div className={styles.newBadge}>
                <span className={styles.newDot}></span>
                <span className={styles.newText}>Baru</span>
              </div>
            )}
          </div>

          <p className={styles.description}>{description}</p>

          <div className={styles.footer}>
            <div className={styles.time}>
              <Clock className={styles.timeIcon} />
              {formatTime(created_at)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Notifications({ onBack }: { onBack: () => void }) {
  const { user, token } = useAuth(); // ← tambah token
  const isSeller = user?.role === 'nelayan';

  const [activeFilter, setActiveFilter]   = useState('Semua');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [error, setError]                 = useState('');

  const filters = ['Semua', 'Transaksi', 'Lelang', 'Pembayaran', 'Sistem'];

  // ── Fetch notifications ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id || !token) return; // ← guard token

    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        const data = await getNotifications(user.id, token); // ← pass token
        setNotifications(data);
      } catch (err) {
        setError('Gagal memuat notifikasi. Coba lagi.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [user?.id, token]); // ← tambah token sebagai dependency

  // ── Filter ────────────────────────────────────────────────────────────────
  const filteredNotifications = notifications.filter(notif => {
    if (activeFilter === 'Semua')      return true;
    if (activeFilter === 'Transaksi')  return notif.type === 'transaksi';
    if (activeFilter === 'Lelang')     return notif.type === 'lelang';
    if (activeFilter === 'Pembayaran') return notif.type === 'pembayaran';
    if (activeFilter === 'Sistem')     return notif.type === 'keamanan' || notif.type === 'kapal';
    return true;
  });

  // ── Mark all as read ──────────────────────────────────────────────────────
  const markAllAsRead = async () => {
    if (!user?.id || !token) return; // ← guard token
    try {
      await apiMarkAllAsRead(user.id, token); // ← pass token
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {
      setError('Gagal menandai notifikasi.');
    }
  };

  const content = (
    <main className={styles.mainContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.notiHeader}>
          <div>
            <h1 className={styles.notiTitle}>Notifikasi</h1>
            <p className={styles.notiDescription}>
              Kelola pembaruan secara real-time dan aktivitas ledger Anda.
            </p>
          </div>
        </div>
        <button onClick={markAllAsRead} className={styles.markReadButton}>
          Tandai semua sudah dibaca
        </button>
      </div>

      {/* Filter */}
      <div className={styles.filterContainer}>
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`${styles.filterButton} ${
              activeFilter === filter ? styles.filterActive : styles.filterInactive
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className={styles.notificationWrapper}>
        {isLoading ? (
          <p className={styles.emptyText}>Memuat notifikasi...</p>
        ) : error ? (
          <p className={styles.emptyText}>{error}</p>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.slice(0, 10).map(notif => (
                <NotificationCard key={notif.id} {...notif} />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.emptyState}
              >
                <p className={styles.emptyText}>
                  Tidak ada notifikasi untuk {activeFilter}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </main>
  );

  if (isSeller) {
    return (
      <div className={styles.all}>
        <SideFisherman />
        <div className={styles.container}>
          <SellerNavbar />
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.all}>
      <div className={styles.container}>
        <BuyerNavbar />
        {content}
      </div>
    </div>
  );
}