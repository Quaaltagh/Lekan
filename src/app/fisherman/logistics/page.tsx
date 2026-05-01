"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./Logistics.module.css";
import SideFisherman from "../../components/sideFisherman";
import NavbarFisherman from "../../components/NavbarFisherman";
import { Truck, Handshake, ArrowRight, Loader2 } from "lucide-react";
import { logisticsService, LogisticsResponse, LogisticsShipment } from "@/services/logisticsService";
import { useAuth } from "@/context/AuthContext";

// Utility to format date nicely (e.g., "Oct 24, 2023")
const formatDate = (dateString: string) => {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Utility to format time for arrival (e.g., "Today, 14:00")
const formatEstArrival = (dateString: string) => {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  const today = new Date();
  
  const isToday = d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  
  if (isToday) {
    return `Today, ${timePart}`;
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
      setError(err.message || "Failed to load logistics data");
    } finally {
      setLoading(false);
    }
  }, [user?.id, token]);

  useEffect(() => {
    fetchLogistics();
  }, [fetchLogistics]);

  // Define our static partners
  const STATIC_PARTNERS = [
    { id: 'boa', initials: 'BOa', name: 'Blue Ocean Freight', desc: 'Premium Cold Chain' },
    { id: 'me', initials: 'ME', name: 'Maritime Express', desc: 'Standard Shipping' },
    { id: 'jni', initials: 'JNI', name: 'Jalur Negara Ikan', desc: 'Domestic Partner' }
  ];

  if (!user && !loading) {
    return <div className={styles.errorState}>Please login to view this page.</div>;
  }

  const renderStatusBadge = (status: LogisticsShipment['status']) => {
    switch (status) {
      case 'in_transit':
        return (
          <div className={`${styles.badge} ${styles.badgeInTransit}`}>
            <div className={styles.badgeDot}></div>
            In Transit
          </div>
        );
      case 'out_for_delivery':
        return (
          <div className={`${styles.badge} ${styles.badgeOutForDelivery}`}>
            <div className={styles.badgeDot}></div>
            Out for Delivery
          </div>
        );
      case 'delivered':
        return (
          <div className={`${styles.badge} ${styles.badgeDelivered}`}>
            Delivered
          </div>
        );
      default:
        return (
          <div className={`${styles.badge} ${styles.badgeDelivered}`}>
            {status}
          </div>
        );
    }
  };

  return (
    <div className={styles.layout}>
      <SideFisherman />
      <div className={styles.mainWrapper}>
        <NavbarFisherman />
        
        <main className={styles.main}>
          {/* Header */}
          <div className={styles.headerContainer}>
            <div>
              <h1 className={styles.pageTitle}>Logistics Control</h1>
              <p className={styles.pageSubtitle}>
                Manage shipments, track active deliveries, and review historical logistics data.
              </p>
            </div>
          </div>

          {loading && (
            <div className={styles.loadingState}>
              <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 16px" }} />
              Loading logistics data...
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
                    <Truck size={20} color="#0f172a" />
                    <h2 className={styles.sectionTitle}>Active Shipments</h2>
                  </div>

                  {data.active.length === 0 ? (
                    <div className={styles.emptyState}>No active shipments at the moment.</div>
                  ) : (
                    data.active.map((shipment) => (
                      <div key={shipment.id} className={styles.shipmentCard}>
                        <div className={styles.shipmentHeader}>
                          <div>
                            <div className={styles.fishMeta}>
                              {shipment.auctions?.name || 'Unknown Item'} • {shipment.auctions?.weight_kg || 0}KG
                            </div>
                            <h3 className={styles.destination}>{shipment.destination || 'Unknown Hub'}</h3>
                          </div>
                          {renderStatusBadge(shipment.status)}
                        </div>
                        
                        <div className={styles.shipmentFooter}>
                          <div className={styles.estArrival}>
                            Est. Arrival: {formatEstArrival(shipment.estimated_arrival)}
                          </div>
                          <a href="#" className={styles.trackLink}>
                            Track <ArrowRight size={14} />
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Shipping History Box */}
                <div className={styles.sectionBox}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>Shipping History</h2>
                  </div>

                  {data.history.length === 0 ? (
                    <div className={styles.emptyState}>No historical data available.</div>
                  ) : (
                    <table className={styles.historyTable}>
                      <thead>
                        <tr>
                          <th>DATE</th>
                          <th>DESTINATION</th>
                          <th>CARGO</th>
                          <th>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.history.map((shipment) => (
                          <tr key={shipment.id}>
                            <td>{formatDate(shipment.created_at)}</td>
                            <td className={styles.historyDest}>{shipment.destination || 'Unknown'}</td>
                            <td>{shipment.auctions?.weight_kg || 0}kg {shipment.auctions?.name || 'Item'}</td>
                            <td>{renderStatusBadge(shipment.status)}</td>
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
                    <Handshake size={20} color="#0f172a" />
                    <h2 className={styles.sectionTitle}>Logistics Partners</h2>
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
