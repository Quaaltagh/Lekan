"use client";
import styles from './SideFisherman.module.css';
import { LayoutDashboard, Upload, History, Activity, Settings, Bell, Wallet, Search, Plus, Truck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from "next/navigation";

export default function SideFisherman() {
  const pathname = usePathname();

  const navItems = [
    { href: "/fisherman/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/fisherman/uploadAuction", icon: Upload, label: "Unggah Lelang" },
    { href: "/fisherman/biddingStatus", icon: Activity, label: "Status Lelang" },
    { href: "/fisherman/enchantedAuctionHistory", icon: History, label: "Histori Lelang" },
    { href: "/fisherman/settingsFisherman", icon: Settings, label: "Pengaturan" },
    { href: "/fisherman/logistics", icon: Truck, label: "Logistic" },
  ];

  return (

    <aside className={styles.sidebar}>
        <div>
          <div className={styles.sidebarHeader}>
            <div className={styles.logo}>
              <Link href="/fisherman/dashboard/">
                <img src="/images/Lekan logo with tulisan.png" alt="LEKAN" className={styles.logoimages} />
              </Link>
            </div>
          </div>

          <nav className={styles.navContainer}>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className={`${styles.navLink} ${
                    isActive ? styles.navLinkActive : ""
                  }`}
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
  );
}