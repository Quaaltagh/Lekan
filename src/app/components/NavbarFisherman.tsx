'use client'
import styles from './NavbarFisherman.module.css';
import { LayoutDashboard, Radio, History, Ship, Settings, Bell, Wallet, Search, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter,usePathname } from 'next/navigation';

export default function NavbarFisherman() {
  const pathname = usePathname();
    const isNotification = pathname.startsWith("/notification");
  return (
    <header className={styles.header}>

      <div className={styles.navRight}>
        <Link href="/notification">
          <Bell
            className={`${styles.icon} ${
              isNotification ? styles.iconActive : styles.iconInactive
            }`}
            size={20}
          />
        </Link>
        <Link href=""><Wallet className={styles.icon} size={20} /></Link>
        
        <div className={styles.avatar}></div>
      </div>
      
    </header>
  );
}