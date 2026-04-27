import styles from './NavbarFisherman.module.css';
import { LayoutDashboard, Radio, History, Ship, Settings, Bell, Wallet, Search, Plus } from 'lucide-react';
import Link from 'next/link';

export default function NavbarFisherman() {
  return (
    <header className={styles.header}>

      <div className={styles.navRight}>
        <a href="#"><Bell className={styles.icon} size={20} /></a>
        <a href=""><Wallet className={styles.icon} size={20} /></a>
        
        <div className={styles.avatar}></div>
      </div>
      
    </header>
  );
}