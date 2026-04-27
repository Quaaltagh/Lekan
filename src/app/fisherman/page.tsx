import React from 'react';
import { 
  LayoutDashboard, Upload, Activity, Wallet, Settings, Bell, 
  Search, Plus, History, BanknoteArrowDown, Ellipsis
} from 'lucide-react';
import SideFisherman from '../components/sideFisherman';
import NavbarFisherman from '../components/NavbarFisherman';
import styles from './page.module.css';


export default function FishermanDashboard() {
  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <SideFisherman />

      {/* Main Content */}
      <main className={styles.mainContent}>
        <NavbarFisherman />
        

        <div className={styles.dashboardPadding}>
          <div style={{ flex: 1 }}>
            {/* Stats */}
            <div className={styles.cardGrid}>
              <div className={styles.statCard}>
                <div className={styles.cardicon}>
                  
                  <div style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.75rem', borderRadius: '0.75rem' }}>
                    <Activity size={20} />
                  </div>

                  <span className={styles.badgeLive}>LIVE</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Active Auctions</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>12 <span style={{ fontSize: '0.875rem', color: '#64748bbc', fontWeight:'normal' }}>Lots</span></h3>
              </div>

              <div className={styles.statCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ backgroundColor: '#effff1', color: '#0f911e', padding: '0.75rem', borderRadius: '0.75rem' }}>
                    <Wallet size={20} />
                  </div>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Earnings</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Rp 42.8M</h3>
              </div>

              <div className={styles.statCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ backgroundColor: '#fff7ef', color: '#91430f', padding: '0.75rem', borderRadius: '0.75rem' }}>
                    <Ellipsis size={20} />
                  </div>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Earnings</p>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Rp 42.8M</h3>
              </div>
              
            </div>

            {/* List Lelang Header */}
            <div className={styles.auctionHeader}>
              <div>
                <h2 className={styles.auctionHeaderTitle}>Daftar Lelang Terkini</h2>
                <p className={styles.auctionHeaderSubtitle}>
                  Monitor hasil tangkapan Anda secara real-time.
                </p>
              </div>
              <a href="#" className={styles.viewAllLink}>
                Lihat Semua →
              </a>
            </div>

            {/* List */}
            <div className={styles.auctionItem}>
              <div className={styles.imagePlaceholder}></div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Tuna Bluefin Grade A</h3>
                  <span style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 'bold' }}>● AKTIF</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>CURRENT BID</p>
                    <p style={{ fontWeight: 'bold', color: '#1e40af' }}>Rp 12.500.000</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>WEIGHT</p>
                    <p style={{ fontWeight: 'bold' }}>85.4 kg</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer' }}>Details</button>
                  <button style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', background: '#1e40af', color: 'white', border: 'none', cursor: 'pointer' }}>Boost</button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Kanan */}
          <div style={{ width: '20rem' }}>
            <div className={styles.ctaBox}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Siap Melantai di Bursa?</h3>
              <p style={{ color: '#bfdbfe', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Unggah hasil tangkapan Anda hari ini dan dapatkan harga terbaik dari pembeli global.</p>
              <button style={{ width: '100%', padding: '0.75rem', backgroundColor: 'white', color: '#1e3a8a', fontWeight: 'bold', borderRadius: '0.75rem', border: 'none', cursor: 'pointer' }}>
                + Unggah Lelang Baru
              </button>
            </div>

            {/* Market Trend Section */}
        <div style={{ marginTop: '1.5rem' }}>
          <p className={styles.marketTrendTitle}>Market Trend</p>
          
          <div className={styles.marketTrendCard}>
            {/* Item: Cakalang */}
            <div className={styles.marketTrendItem}>
              <div className={styles.trendInfo}>
                <span className={styles.indicatorDot} style={{ backgroundColor: '#3b82f6' }}></span>
                Cakalang
              </div>
              <span className={styles.trendPositive}>+12.4%</span>
            </div>

            {/* Item: Udang Vaname */}
            <div className={styles.marketTrendItem}>
              <div className={styles.trendInfo}>
                <span className={styles.indicatorDot} style={{ backgroundColor: '#ef4444' }}></span>
                Udang Vaname
              </div>
              <span className={styles.trendNegative}>-2.1%</span>
            </div>

            {/* Item: Kerapu */}
            <div className={styles.marketTrendItem}>
              <div className={styles.trendInfo}>
                <span className={styles.indicatorDot} style={{ backgroundColor: '#3b82f6' }}></span>
                Kerapu
              </div>
              <span className={styles.trendPositive}>+8.5%</span>
            </div>
          </div>
        </div>

          </div>

          
        </div>
      </main>
    </div>
  );
}