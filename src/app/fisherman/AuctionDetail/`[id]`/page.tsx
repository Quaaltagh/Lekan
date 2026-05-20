'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, ShieldCheck, Truck, User, MapPin, Anchor, CheckCircle2, Loader2 } from 'lucide-react';
import SideFisherman from '../../../components/sideFisherman';
import NavbarFisherman from '../../../components/NavbarFisherman';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface AuctionData {
  name: string;
  weight_kg: number;
  image_url?: string;
  status: string;
  final_price?: number;
  grade?: string;
  seller_id: string;
  buyer_id?: string;
  ends_at: string;
}

interface LogisticsData {
  id: string;
  auction_id: string;
  seller_id: string;
  buyer_id: string;
  status: 'pending' | 'shipped' | 'arrived' | 'delivered';
  pickup_address?: string;
  delivery_address?: string;
  courier?: string;
  tracking_number?: string;
  estimated_arrival?: string;
  created_at: string;
  destination?: string;
  auctions: AuctionData;
}

interface BuyerProfile {
  full_name?: string;
  phone?: string;
  email?: string;
}

export default function FishermanAuctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token } = useAuth();

  const [logistics, setLogistics] = useState<LogisticsData | null>(null);
  const [buyer, setBuyer] = useState<BuyerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!id || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/logistics/auction/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal memuat detail logistik.');
      }
      const data: LogisticsData = await res.json();
      setLogistics(data);
      setError(null);

      // Fetch profile pembeli jika buyer_id tersedia
      if (data.buyer_id) {
        const pRes = await fetch(`${API_URL}/api/profile/${data.buyer_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (pRes.ok) {
          const pData = await pRes.json();
          setBuyer(pData);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    fetchDetails();
  }, [user, fetchDetails, router]);

  const handleUpdateStatus = async (action: 'depart' | 'arrived') => {
    if (!logistics || !token) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/logistics/${logistics.id}/${action}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal memperbarui status logistik.');
      }
      await fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.layout}>
        <SideFisherman />
        <div className={styles.mainWrapper}>
          <NavbarFisherman />
          <div className={styles.loadingState}>
            <Loader2 size={36} className="animate-spin" style={{ color: 'var(--clr-primary)' }} />
            <p>Memuat detail pemesanan...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !logistics) {
    return (
      <div className={styles.layout}>
        <SideFisherman />
        <div className={styles.mainWrapper}>
          <NavbarFisherman />
          <div className={styles.errorState}>
            <p className={styles.errorText}>{error || 'Detail pemesanan tidak ditemukan.'}</p>
            <button onClick={() => router.back()} className={styles.backBtn}>
              <ArrowLeft size={16} /> Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { auctions: auction, status } = logistics;
  const finalPrice = auction.final_price || 0;

  // Timeline tracking status
  const steps = [
    { label: 'Pesanan Diterima', desc: 'Pembayaran terverifikasi di Escrow', isDone: true, key: 'pending' },
    { label: 'Kapal Berangkat', desc: 'Tangkapan sedang dikirim via kapal logistik', isDone: status !== 'pending', key: 'shipped' },
    { label: 'Kapal Tiba', desc: 'Kargo telah tiba di pelabuhan tujuan', isDone: status === 'arrived' || status === 'delivered', key: 'arrived' },
    { label: 'Diterima Pembeli', desc: 'Pembeli mengonfirmasi penerimaan barang', isDone: status === 'delivered', key: 'delivered' },
  ];

  return (
    <div className={styles.layout}>
      <SideFisherman />
      <div className={styles.mainWrapper}>
        <NavbarFisherman />

        <main className={styles.main}>
          <div className={styles.container}>
            {/* Header / Back Link */}
            <div className={styles.header}>
              <button onClick={() => router.back()} className={styles.backLink}>
                <ArrowLeft size={18} /> Kembali ke Status Lelang
              </button>
              <h1 className={styles.pageTitle}>Detail Pemesanan & Logistik</h1>
              <p className={styles.pageSubtitle}>Lacak status pengiriman tangkapan Anda secara real-time.</p>
            </div>

            <div className={styles.contentGrid}>
              {/* Kolom Kiri: Info Ikan & Timeline */}
              <div className={styles.leftCol}>
                <div className={styles.card}>
                  <div className={styles.cardHeaderRow}>
                    <div className={styles.imageWrapper}>
                      <img
                        src={auction.image_url || 'https://darilaut.id/wp-content/uploads/2021/09/Tuna-3.jpg'}
                        alt={auction.name}
                        className={styles.fishImage}
                      />
                    </div>
                    <div className={styles.fishMeta}>
                      <span className={styles.badgeSelesai}>SELESAI</span>
                      <h2 className={styles.fishName}>{auction.name}</h2>
                      <div className={styles.tagGrid}>
                        <span className={styles.tag}>Grade {auction.grade || 'A'}</span>
                        <span className={styles.tag}>{auction.weight_kg} KG</span>
                      </div>
                    </div>
                  </div>

                  <p className={styles.description}>
                    Kargo ikan berkualitas tinggi Anda telah dilelang dengan sukses. Gunakan kontrol pengiriman di sebelah kanan untuk memperbarui status logistik perjalanan kapal dari dermaga asal ke pelabuhan tujuan pembeli.
                  </p>
                </div>

                {/* Timeline Pelacakan */}
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Status Pelacakan Logistik</h3>
                  <div className={styles.timeline}>
                    {steps.map((step, idx) => {
                      const isActive = step.isDone;
                      return (
                        <div key={step.key} className={`${styles.timelineItem} ${isActive ? styles.activeTimeline : ''}`}>
                          <div className={styles.timelineIconWrapper}>
                            {idx === 0 && <ShieldCheck size={20} />}
                            {idx === 1 && <Truck size={20} />}
                            {idx === 2 && <Anchor size={20} />}
                            {idx === 3 && <CheckCircle2 size={20} />}
                            {idx < steps.length - 1 && <div className={styles.timelineLine} />}
                          </div>
                          <div className={styles.timelineContent}>
                            <h4 className={styles.timelineLabel}>{step.label}</h4>
                            <p className={styles.timelineDesc}>{step.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Detail Ringkasan & Aksi Kontrol */}
              <div className={styles.rightCol}>
                {/* Rincian Harga & Pembeli */}
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Informasi Pesanan</h3>
                  
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Harga Akhir Terjual</span>
                    <span className={styles.priceValue}>
                      {finalPrice.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  <div className={styles.divider} />

                  <div className={styles.buyerInfoRow}>
                    <div className={styles.avatarCircle}>
                      <User size={20} />
                    </div>
                    <div>
                      <span className={styles.infoLabel}>Pemenang Lelang (Pembeli)</span>
                      <h4 className={styles.buyerName}>{buyer?.full_name || 'Pembeli Terverifikasi'}</h4>
                      <p className={styles.buyerContact}>{buyer?.phone || buyer?.email || 'No Telp Tidak Tersedia'}</p>
                    </div>
                  </div>
                </div>

                {/* Detail Pengiriman & Rute */}
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Detail Pengiriman</h3>

                  <div className={styles.routeContainer}>
                    <div className={styles.routeItem}>
                      <MapPin size={18} className={styles.pickupIcon} />
                      <div>
                        <span className={styles.routeLabel}>Lokasi Penjemputan (Asal)</span>
                        <p className={styles.routeAddress}>{logistics.pickup_address || 'Dermaga Asal Nelayan'}</p>
                      </div>
                    </div>

                    <div className={styles.routeItem}>
                      <Anchor size={18} className={styles.deliveryIcon} />
                      <div>
                        <span className={styles.routeLabel}>Pelabuhan Tujuan</span>
                        <p className={styles.routeAddress}>{logistics.delivery_address || logistics.destination || 'Pelabuhan Tujuan Buyer'}</p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.divider} />

                  <div className={styles.metaInfoGrid}>
                    <div>
                      <span className={styles.infoLabel}>Kurir / Cargo Kapal</span>
                      <p className={styles.metaValue}>{logistics.courier || 'Maritime Express'}</p>
                    </div>
                    <div>
                      <span className={styles.infoLabel}>No. Resi Pelacakan</span>
                      <p className={styles.metaValue}>{logistics.tracking_number || '-'}</p>
                    </div>
                    <div>
                      <span className={styles.infoLabel}>Estimasi Tiba</span>
                      <p className={styles.metaValue}>
                        {logistics.estimated_arrival ? new Date(logistics.estimated_arrival).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        }) : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Aksi Kontrol Nelayan */}
                <div className={styles.card} style={{ border: '1.5px solid var(--clr-primary-light)', background: 'var(--clr-primary-lightest)' }}>
                  <h3 className={styles.cardTitle}>Kontrol Pengiriman Nelayan</h3>
                  <p className={styles.controlHint}>
                    Perbarui status perjalanan cargo ikan Anda agar pembeli dapat melacak pengiriman secara real-time.
                  </p>

                  {status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus('depart')}
                      disabled={actionLoading}
                      className={styles.primaryActionBtn}
                    >
                      {actionLoading ? <Loader2 className="animate-spin" size={18} /> : 'Kirim Kargo (Kapal Berangkat)'}
                    </button>
                  )}

                  {status === 'shipped' && (
                    <button
                      onClick={() => handleUpdateStatus('arrived')}
                      disabled={actionLoading}
                      className={styles.secondaryActionBtn}
                    >
                      {actionLoading ? <Loader2 className="animate-spin" size={18} /> : 'Konfirmasi Kapal Tiba'}
                    </button>
                  )}

                  {status === 'arrived' && (
                    <div className={styles.statusBoxInfo}>
                      <Clock size={16} />
                      <span>Menunggu konfirmasi penerimaan barang dari pembeli di pelabuhan tujuan.</span>
                    </div>
                  )}

                  {status === 'delivered' && (
                    <div className={styles.statusBoxSuccess}>
                      <CheckCircle2 size={16} />
                      <span>Transaksi Selesai. Pengiriman telah dikonfirmasi oleh pembeli.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
