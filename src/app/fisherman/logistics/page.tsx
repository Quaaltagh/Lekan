"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./Logistics.module.css";
import SideFisherman from "../../components/sideFisherman";
import NavbarFisherman from "../../components/NavbarFisherman";
import { Truck, Handshake, ArrowRight, Loader2, ChevronRight } from "lucide-react";
import { logisticsService, LogisticsResponse, LogisticsShipment } from "@/services/logisticsService";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';

// Utility to format date nicely (e.g., "Oct 24, 2023")
const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  return d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Utility to format time for arrival (e.g., "Hari Ini, 14:00")
const formatEstArrival = (dateString: string) => {
  if (!dateString) return "Tidak tersedia";
  const d = new Date(dateString);
  const today = new Date();
  
  const isToday = d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  const timePart = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  
  if (isToday) {
    return `Hari Ini, ${timePart}`;
  }
  return `${formatDate(dateString)}, ${timePart}`;
};

export default function LogisticsPage() {
  const { user, token } = useAuth();
  const [data, setData] = useState<LogisticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogistics = useCallback(async () => {
    if (!user?.id || !token) return;
    setLoading(true);
    try {
      const result = await logisticsService.getLogistics(user.id, token);
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data logistik");
    } finally {
      setLoading(false);
    }
  }, [user?.id, token]);

  useEffect(() => {
    fetchLogistics();
  }, [fetchLogistics]);

  // Define our static partners
  const STATIC_PARTNERS = [
    { id: 'boa', initials: 'BOa', name: 'Blue Ocean Freight', desc: 'Rantai Dingin Premium' },
    { id: 'me', initials: 'ME', name: 'Maritime Express', desc: 'Pengiriman Standar' },
    { id: 'jni', initials: 'JNI', name: 'Jalur Negara Ikan', desc: 'Mitra Domestik' }
  ];

  if (!user && !loading) {
    return <div className={styles.errorState}>Silakan masuk untuk melihat halaman ini.</div>;
  }

  const renderStatusBadge = (status: LogisticsShipment['status']) => {
    switch (status) {
      case 'pending':
        return (
          <div className={`${styles.badge} ${styles.badgePending}`}>
            <div className={styles.badgeDot}></div>
            Menunggu Pengiriman
          </div>
        );
      case 'shipped':
        return (
          <div className={`${styles.badge} ${styles.badgeShipped}`}>
            <div className={styles.badgeDot}></div>
            Dalam Perjalanan
          </div>
        );
      case 'arrived':
        return (
          <div className={`${styles.badge} ${styles.badgeArrived}`}>
            <div className={styles.badgeDot}></div>
            Tiba di Pelabuhan
          </div>
        );
      case 'delivered':
        return (
          <div className={`${styles.badge} ${styles.badgeDelivered}`}>
            <div className={styles.badgeDot}></div>
            Terkirim
          </div>
        );
      default:
        return (
          <div className={`${styles.badge} ${styles.badgePending}`}>
            <div className={styles.badgeDot}></div>
            {status}
          </div>
        );
    }
  };

  const router = useRouter();

  return (
    <div className={styles.layout}>
      <SideFisherman />
      <div className={styles.mainWrapper}>
        <NavbarFisherman />
        
        <main className={styles.main}>
          {/* Header */}
          <div className={styles.headerContainer}>
            <div>
              <h1 className={styles.pageTitle}>Kontrol Logistik</h1>
              <p className={styles.pageSubtitle}>
                Kelola pengiriman, lacak pengiriman aktif, dan tinjau riwayat logistik.
              </p>
            </div>
          </div>

          {loading && (
            <div className={styles.loadingState}>
              <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 16px" }} />
              Memuat data logistik...
            </div>
          )}

          {error && (
            <div className={styles.errorState}>
              {error}
            </div>
          )}

          {!loading && !error && data && (
            <div className={styles.contentGrid}>
              
              {/* LEFT COLUMN: Active Shipments & History */}
              <div className={styles.leftCol}>
                
                {/* Active Shipments Box */}
                <div className={styles.sectionBox}>
                  <div className={styles.sectionTitleWrap}>
                    {/* <Truck size={20} color="var(--clr-primary)" /> */}
                    <h2 className={styles.sectionTitle}>Pengiriman Aktif</h2>
                    <button className={styles.viewAllBtn} onClick={() => router.push(`/fisherman/logistics/Detail`)}>
                    Lihat Semua <ChevronRight size={14} />
                  </button>
                  </div>

                  {data.active.length === 0 ? (
                    <div className={styles.emptyState}>Tidak ada pengiriman aktif saat ini.</div>
                  ) : (
                    data.active.slice(0,3).map((shipment) => (
                      <div key={shipment.id} className={styles.shipmentCard}>
                        <div className={styles.shipmentHeader}>
                          <div>
                            
                            <h3 className={styles.destination}>{shipment.auctions?.name || 'Item Tidak Diketahui'} • {shipment.auctions?.weight_kg || 0}KG</h3>
                            <div className={styles.fishMeta}>
                              {shipment.destination || 'Lokasi Tidak Diketahui'}
                            </div>
                          </div>
                          {renderStatusBadge(shipment.status)}
                        </div>
                        
                        <div className={styles.shipmentFooter}>
                          <div className={styles.estArrival}>
                            Estimasi Sampai: {formatEstArrival(shipment.estimated_arrival)}
                          </div>
                          <a href={`/fisherman/AuctionDetail/${shipment.auction_id}`} className={styles.trackLink}>
                            Lacak <ArrowRight size={14} />
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Shipping History Box */}
                <div className={styles.sectionBox}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>Riwayat Pengiriman</h2>

                      <button className={styles.viewAllBtn} onClick={() => router.push(`/fisherman/logistics/History`)}>
                      Lihat Semua <ChevronRight size={14} />
                    </button>
                  </div>

                  {data.history.length === 0 ? (
                    <div className={styles.emptyState}>Tidak ada data histori.</div>
                  ) : (
                    <table className={styles.historyTable}>
                      <thead>
                        <tr>
                          <th>TANGGAL</th>
                          <th>TUJUAN</th>
                          <th>KARGO</th>
                          <th>STATUS</th>
                          <th>AKSI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.history.slice(0,5).map((shipment) => (
                          <tr key={shipment.id}>
                            <td>{formatDate(shipment.created_at)}</td>
                            <td className={styles.historyDest}>{shipment.destination || 'Unknown'}</td>
                            <td>{shipment.auctions?.weight_kg || 0}kg {shipment.auctions?.name || 'Barang'}</td>
                            <td>{renderStatusBadge(shipment.status)}</td>
                            <td>
                              <a href={`/fisherman/AuctionDetail/${shipment.auction_id}`} className={styles.trackLink}>
                                Detail
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

              </div>

              {/* RIGHT COLUMN: Partners */}
              <div className={styles.rightCol}>
                <div className={styles.partnersBox}>
                  <div className={styles.sectionTitleWrap}>
                    {/* <Handshake size={20} color="#0f172a" /> */}
                    <h2 className={styles.sectionTitle}>Mitra Logistik</h2>
                  </div>

                  {STATIC_PARTNERS.map(partner => (
                    <div key={partner.id} className={styles.partnerCard}>
                      <div className={styles.partnerIconWrap}>
                        {partner.initials}
                      </div>
                      <div className={styles.partnerInfo}>
                        <h4>{partner.name}</h4>
                        <p>{partner.desc}</p>
                      </div>
                    </div>
                  ))}
                  
                </div>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}
