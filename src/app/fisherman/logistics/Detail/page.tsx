"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./page.module.css";
import SideFisherman from "../../../components/sideFisherman";
import NavbarFisherman from "../../../components/NavbarFisherman";
import { Truck, Handshake, ArrowRight, ArrowLeft, Loader2, ChevronRight } from "lucide-react";
import { logisticsService, LogisticsResponse, LogisticsShipment } from "@/services/logisticsService";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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


export default function LogisticsDetailPage(){
    const { user, token } = useAuth();
    const router = useRouter();
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
            Selesai / Terkirim
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
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return(
        <div className={styles.all}>
            <SideFisherman
                              sidebarOpen={sidebarOpen}
                              setSidebarOpen={setSidebarOpen}
                            />
            <div className={styles.container}>
                <NavbarFisherman setSidebarOpen={setSidebarOpen}/>

                <div className={styles.content}>
                   
                    <div className={styles.notiHeader}>
                        <button onClick={() => router.back()}
                            className={styles.backLink}
                            >
                            <ArrowLeft size={16} /> Kembali
                        </button>
                        <div>
                        <h1 className={styles.notiTitle}>Pengiriman Aktif</h1>
                        <p className={styles.notiDescription}>
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
                      data.active.length === 0 ? (
                        <div className={styles.emptyState}>Tidak ada pengiriman aktif saat ini.</div>
                      ) : (
                        data.active.map((shipment) => (
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
                      )
                    )}

                </div>

                
            </div>
        </div>
    );
}