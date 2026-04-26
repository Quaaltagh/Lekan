import styles from './Navbar.module.css';
import { LayoutDashboard, Radio, History, Ship, Settings, Bell, Wallet, Search, Plus } from 'lucide-react';
import Link from 'next/link';

export default function Navbar() {
  return (
    <header className={styles.header}>
      <div className={styles.navLeft}>
        <a href="#">
          <img src="/images/Lekan logo with tulisan.png" alt="LEKAN" className={styles.logoimages} />
        </a>
      </div>

      <div className={styles.searchcontainer}>
        <div className={styles.searchwrapper}>
          <div className={styles.searchiconWrapper}>
            <Search className={styles.searchicon} />
          </div>

          <input
            type="text"
            className={styles.searchinput}
            placeholder="Cari ikan..."
          />
        </div>
      </div>

      <div className={styles.navRight}>
        <a href="#"><Bell className={styles.icon} size={20} /></a>
        <a href=""><Wallet className={styles.icon} size={20} /></a>
        
        {/* <div className={styles.avatar}></div> */}
        <div className={styles.divauth}>
          <Link href="/auth?mode=login" className={styles.auth}>Masuk</Link> | <Link href="/auth?mode=register" className={styles.auth}>Daftar</Link>
        </div>
      </div>
      
    </header>
  );
}