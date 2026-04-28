'use client'
import { Bell, Circle, Clock, CreditCard, FileText, Shield, Ship, ChevronDown,Search,User,ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import styles from './page.module.css';
import Navbar from '@/app/components/Navbar';

interface NotificationItemProps {
  id: string;
  type: 'bidding' | 'payment' | 'transaction' | 'security' | 'vessel';
  title: string;
  description: string;
  time: string;
  isNew: boolean;
}

function NotificationCard({ type, title, description, time, isNew}: NotificationItemProps) {

  const getIcon = () => {
    if(isNew === true){
        switch (type) {
            case 'bidding': 
                return <Bell className={`${styles.icon} ${styles.iconBlue}`} />;
            case 'payment': 
                return <CreditCard className={`${styles.icon} ${styles.iconBlue}`} />;
            case 'transaction': 
                return <FileText className={`${styles.icon} ${styles.iconBlue}`} />;
            case 'security': 
                return <Shield className={`${styles.icon} ${styles.iconBlue}`} />;
            case 'vessel': 
                return <Ship className={`${styles.icon} ${styles.iconBlue}`} />;
        }
    }else{
        switch (type) {
            case 'bidding': 
                return <Bell className={`${styles.icon} ${styles.iconSeen}`} />;
            case 'payment': 
                return <CreditCard className={`${styles.icon} ${styles.iconSeen}`} />;
            case 'transaction': 
                return <FileText className={`${styles.icon} ${styles.iconSeen}`} />;
            case 'security': 
                return <Shield className={`${styles.icon} ${styles.iconSeen}`} />;
            case 'vessel': 
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
                        <span className={styles.newText}>New</span>
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
  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Transactions', 'Bidding', 'Payments', 'System'];

  const [notifications, setNotifications] = useState<NotificationItemProps[]>([
    {
      id: '1',
      type: 'bidding',
      title: 'Outbid Notice: Bluefin Tuna Batch #092',
      description: 'Your bid of $2,450.00 was surpassed by a verified buyer. The current highest bid is $2,600.00.',
      time: '2 minutes ago',
      isNew: true
    },
    {
      id: '2',
      type: 'payment',
      title: 'Payment Successful',
      description: 'Funds for "Atlantic Mackerel Shipment - INV-882" have been released to your escrow account.',
      time: '14 minutes ago',
      isNew: true
    },
    {
      id: '3',
      type: 'transaction',
      title: 'Transaction Complete',
      description: 'The vessel "Ocean Harvest" has confirmed delivery at Port of Lisbon. Transaction finalized.',
      time: '3 hours ago',
      isNew: false
    },
    {
      id: '4',
      type: 'security',
      title: 'Security Update',
      description: 'Your account security settings were updated from a new device in Tokyo, Japan. Was this you?',
      time: 'Yesterday, 11:20 PM',
      isNew: false
    },
    {
      id: '5',
      type: 'vessel',
      title: 'Vessel Departure',
      description: 'Vessel "The Northern Star" has departed from docking station Alpha-4 heading to North Atlantic Zone.',
      time: 'Yesterday, 09:45 AM',
      isNew: false
    }
  ]);

  const filteredNotifications = notifications.filter(notif => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Transactions') return notif.type === 'transaction';
    if (activeFilter === 'Bidding') return notif.type === 'bidding';
    if (activeFilter === 'Payments') return notif.type === 'payment';
    if (activeFilter === 'System') return notif.type === 'security' || notif.type === 'vessel';
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
                        Mark all as read
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
                        No signals found for {activeFilter}
                        </p>
                    </motion.div>
                    )}
                </AnimatePresence>
            </div>

            
        </main>

    </div>
  );
}