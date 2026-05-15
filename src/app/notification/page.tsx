'use client'
import { Bell, Circle, Clock, CreditCard, FileText, Shield, Ship, ChevronDown,Search,User,ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import styles from './page.module.css';
import Navbar from '@/app/components/Navbar';

interface NotificationItemProps {
  id: string;
  type: 'lelang' | 'pembayaran' | 'transaksi' | 'keamanan' | 'kapal';
  title: string;
  description: string;
  time: string;
  isNew: boolean;
}

function NotificationCard({ type, title, description, time, isNew}: NotificationItemProps) {

  const getIcon = () => {
    if(isNew === true){
        switch (type) {
            case 'lelang': 
                return <Bell className={`${styles.icon} ${styles.iconBlue}`} />;
            case 'pembayaran': 
                return <CreditCard className={`${styles.icon} ${styles.iconBlue}`} />;
            case 'transaksi': 
                return <FileText className={`${styles.icon} ${styles.iconBlue}`} />;
            case 'keamanan': 
                return <Shield className={`${styles.icon} ${styles.iconBlue}`} />;
            case 'kapal': 
                return <Ship className={`${styles.icon} ${styles.iconBlue}`} />;
        }
    }else{
        switch (type) {
            case 'lelang': 
                return <Bell className={`${styles.icon} ${styles.iconSeen}`} />;
            case 'pembayaran': 
                return <CreditCard className={`${styles.icon} ${styles.iconSeen}`} />;
            case 'transaksi': 
                return <FileText className={`${styles.icon} ${styles.iconSeen}`} />;
            case 'keamanan': 
                return <Shield className={`${styles.icon} ${styles.iconSeen}`} />;
            case 'kapal': 
                return <Ship className={`${styles.icon} ${styles.iconSeen}`} />;
        }
    }
    
  };
  

  const getIconBg = () => {
    if (isNew === true) {
        return styles.bgBidding;
    } else {
        return styles.bgDefault;
    }
  };

  return(
    <div className={`${styles.card} ${isNew ? styles.cardNew : styles.cardOld}`}>
        <div className={styles.cardContent}>
            <div className={`${styles.iconWrapper} ${getIconBg()}`}>
            {getIcon()}
            </div>
            
            <div className={styles.cardBody}>
                <div className={styles.cardHeader}>
                    <h4 className={`${styles.title} ${isNew ? styles.titleNew : styles.titleOld}`}>
                    {title}
                    </h4>

                    {isNew && (
                    <div className={styles.newBadge}>
                        <span className={styles.newDot}></span>
                        <span className={styles.newText}>Baru</span>
                    </div>
                    )}
                </div>
            
           
            <p className={styles.description}>
                {description}
            </p>
            
            <div className={styles.footer}>
                <div className={styles.time}>
                <Clock className={styles.timeIcon} />
                {time}
                </div>

            </div>
            </div> 
        </div>
    </div>
  );
}

export default function Notifications({ onBack }: { onBack: () => void }) {
  const [activeFilter, setActiveFilter] = useState('Semua');
  const filters = ['Semua', 'Transaksi', 'Lelang', 'Pembayaran', 'Sistem'];

  const [notifications, setNotifications] = useState<NotificationItemProps[]>([
    {
      id: '1',
      type: 'lelang',
      title: 'Pemberitahuan Tertawar: Batch Tuna Bluefin #092',
      description: 'Tawaran Anda sebesar Rp 2.450.000 dikalahkan oleh pembeli terverifikasi. Tawaran tertinggi saat ini Rp 2.600.000.',
      time: '2 menit lalu',
      isNew: true
    },
    {
      id: '2',
      type: 'pembayaran',
      title: 'Pembayaran Berhasil',
      description: 'Dana untuk "Pengiriman Makarel Atlantik - INV-882" telah dikirim ke rekening escrow Anda.',
      time: '14 menit lalu',
      isNew: true
    },
    {
      id: '3',
      type: 'transaksi',
      title: 'Transaksi Selesai',
      description: 'Kapal "Ocean Harvest" telah dikonfirmasi tiba di Pelabuhan Lisbon. Transaksi selesai.',
      time: '3 jam lalu',
      isNew: false
    },
    {
      id: '4',
      type: 'keamanan',
      title: 'Pembaruan Keamanan',
      description: 'Pengaturan keamanan akun Anda diperbarui dari perangkat baru di Tokyo, Jepang. Apakah ini Anda?',
      time: 'Kemarin, 23:20',
      isNew: false
    },
    {
      id: '5',
      type: 'kapal',
      title: 'Keberangkatan Kapal',
      description: 'Kapal "The Northern Star" berangkat dari dermaga Alpha-4 menuju Zona Atlantik Utara.',
      time: 'Kemarin, 09:45',
      isNew: false
    }
  ]);

  const filteredNotifications = notifications.filter(notif => {
    if (activeFilter === 'Semua') return true;
    if (activeFilter === 'Transaksi') return notif.type === 'transaksi';
    if (activeFilter === 'Lelang') return notif.type === 'lelang';
    if (activeFilter === 'Pembayaran') return notif.type === 'pembayaran';
    if (activeFilter === 'Sistem') return notif.type === 'keamanan' || notif.type === 'kapal';
    return true;
  });

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isNew: false })));
  };

  return(
    <div className={styles.all}>
      <Navbar />

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
                <button 
                onClick={markAllAsRead}
                className={styles.markReadButton}
                >
                        Tandai semua sudah dibaca
                </button>
            </div>

            {/* filter */}
            <div className={styles.filterContainer}>
                {filters.map((filter) => (
                    <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`${styles.filterButton} ${
                        activeFilter === filter
                        ? styles.filterActive
                        : styles.filterInactive
                    }`}
                    >
                    {filter}
                    </button>
                ))}
            </div>
            {/* Notification List */}
            <div className={styles.notificationWrapper}>
                <AnimatePresence mode="popLayout">
                    {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notif) => (
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
            </div>

            
        </main>

    </div>
  );
}