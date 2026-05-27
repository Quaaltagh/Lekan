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
  created_at: string;
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

// Urutan status logistik
const STATUS_ORDER: LogisticsData['status'][] = ['pending', 'shipped', 'arrived', 'delivered'];

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

const STEP_CONFIG = [
  {
    key: 'pending'   as const,
    label: 'Pesanan Diterima',
    desc:  'Pembayaran terverifikasi di Escrow',
    Icon:  ShieldCheck,
  },
  {
    key: 'shipped'   as const,
    label: 'Kapal Berangkat',
    desc:  'Tangkapan sedang dikirim via kapal logistik',
    Icon:  Truck,
  },
  {
    key: 'arrived'   as const,
    label: 'Kapal Tiba',
    desc:  'Kargo telah tiba di pelabuhan tujuan',
    Icon:  Anchor,
  },
  {
    key: 'delivered' as const,
    label: 'Diterima Pembeli',
    desc:  'Pembeli mengonfirmasi penerimaan barang',
    Icon:  CheckCircle2,
  },
];

export default function FishermanAuctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  const [logistics, setLogistics]     = useState<LogisticsData | null>(null);
  const [buyer, setBuyer]             = useState<BuyerProfile | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
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

      if (data.buyer_id) {
        const pRes = await fetch(`${API_URL}/api/profile/${data.buyer_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (pRes.ok) setBuyer(await pRes.json());
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push('/'); return; }
    fetchDetails();
  }, [user, isLoading, fetchDetails, router]);

  const handleUpdateStatus = async (action: 'depart' | 'arrived') => {
    if (!logistics || !token) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/logistics/${logistics.id}/${action}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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

  /* ── Loading ── */
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

  /* ── Error ── */
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

  // ── Derive timeline steps dari status real ──────────────────────────────
  const currentIdx = STATUS_ORDER.indexOf(status);
  const steps = STEP_CONFIG.map((step, idx) => ({
    ...step,
    isDone:    idx <= currentIdx,
    isCurrent: idx === currentIdx,
  }));

  const tags = [
    'SUSTAINABLE',
    auction?.grade ? `GRADE ${auction.grade}` : 'SASHIMI GRADE',
  ]; 

  return (
    <div className={styles.layout}>
      <SideFisherman />
      <div className={styles.mainWrapper}>
        <NavbarFisherman />

        <main className={styles.main}>
          <div className={styles.container}>

            <div className={styles.header}>
              <button onClick={() => router.back()} className={styles.backLink}>
                <ArrowLeft size={18} /> Kembali 
              </button>
              <h1 className={styles.pageTitle}>Detail Pemesanan & Logistik</h1>
              <p className={styles.pageSubtitle}>Lacak status pengiriman tangkapan Anda secara real-time.</p>
            </div>

            <div className={styles.contentGrid}>

              {/* ── Kolom Kiri ── */}
              <div className={styles.leftCol}>

                {/* Info Ikan */}
                <div className={styles.ikan}>
                  <div className={styles.imageContainer}>
                    <img
                      src={auction.image_url || 'https://darilaut.id/wp-content/uploads/2021/09/Tuna-3.jpg'}
                      alt={auction.name}
                      className={styles.image}
                    />
                  </div>
                  <div className={styles.headerContainer}>
                      <div className={styles.titleWrapper}>
                        <h1 className={styles.title}>{auction.name}</h1>
                        <div className={styles.subtitle}>Ditambahkan {formatDate(auction.created_at)} • Berakhir {formatDate(auction.ends_at)}</div>
                      </div>
                      <div className={styles.weightBox}>
                        <span className={styles.weightLabel}>Berat</span>
                        <span className={styles.weightValue}>
                          {auction.weight_kg} <span className={styles.unit}>KG</span>
                        </span>
                      </div>
                  </div>
        
                  {/* Tags */}
                  <div className={styles.tagContainer}>
                    {tags.map(tag => <span key={tag} className={styles.tag}>{tag}</span>)}
                  </div>
                </div>

                {/* Timeline — sekarang dinamis dari status DB */}
                {/* <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Status Pelacakan Logistik</h3>
                  <div className={styles.timeline}>
                    {steps.map((step, idx) => {
                      const { Icon } = step;
                      return (
                        <div
                          key={step.key}
                          className={`
                            ${styles.timelineItem}
                            ${step.isDone    ? styles.activeTimeline   : ''}
                            ${step.isCurrent ? styles.currentTimeline  : ''}
                          `}
                        >
                          <div className={styles.timelineIconWrapper}>
                            <Icon size={20} />
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
                </div> */}

                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Status Logistik</h3>
                  <div className={styles.verticalTimeline}>
                    {steps.map((step, idx) => {
                      const { Icon } = step;
                      return (
                        <div
                          key={step.key}
                          className={`
                            ${styles.timelineStep}
                            ${step.isDone    ? styles.stepDone   : ''}
                            ${step.isCurrent ? styles.stepCurrent  : ''}
                          `}
                        >
                          <div className={styles.stepIconWrapper}>
                            <Icon size={25} />
                            {idx < steps.length - 1 && <div className={styles.verticalLine} />}
                          </div>
                          <div className={styles.stepContent}>
                            <h4 className={styles.stepLabel}>{step.label}</h4>
                            <p className={styles.stepDesc}>{step.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* ── Kolom Kanan ── */}
              <div className={styles.rightCol}>

                {/* Info Pesanan & Pembeli */}
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
                    <div className={styles.avatarCircle}><User size={20} /></div>
                    <div className={styles.buyerinfo}>
                      <span className={styles.infoLabel}>Pemenang Lelang</span>
                      <h4 className={styles.buyerName}>{buyer?.full_name || 'Pembeli Terverifikasi'}</h4>
                      <p className={styles.buyerContact}>{buyer?.phone ? `+62${buyer.phone}` : buyer?.email || 'Kontak tidak tersedia'}</p>
                    </div>
                  </div>
                </div>

                {/* Detail Pengiriman */}
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Detail Pengiriman</h3>

                  <div className={styles.routeContainer}>
                    <div className={styles.routeItem}>
                      <MapPin className={styles.pickupIcon} />
                      <div>
                        <span className={styles.routeLabel}>Asal</span>
                        <p className={styles.routeAddress}>{logistics.pickup_address || 'Dermaga Asal Nelayan'}</p>
                      </div>
                    </div>
                    <div className={styles.routeItem}>
                      <Anchor className={styles.deliveryIcon} />
                      <div>
                        <span className={styles.routeLabel}>Tujuan</span>
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
                        {logistics.estimated_arrival
                          ? new Date(logistics.estimated_arrival).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Kontrol Nelayan */}
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
                      {actionLoading
                        ? <Loader2 className="animate-spin" size={18} />
                        : 'Kirim Kargo (Kapal Berangkat)'}
                    </button>
                  )}

                  {status === 'shipped' && (
                    <button
                      onClick={() => handleUpdateStatus('arrived')}
                      disabled={actionLoading}
                      className={styles.secondaryActionBtn}
                    >
                      {actionLoading
                        ? <Loader2 className="animate-spin" size={18} />
                        : 'Konfirmasi Kapal Tiba'}
                    </button>
                  )}

                  {status === 'arrived' && (
                    <div className={styles.statusBoxInfo}>
                      <Clock size={20} />
                      <span>Menunggu konfirmasi penerimaan barang dari pembeli di pelabuhan tujuan.</span>
                    </div>
                  )}

                  {status === 'delivered' && (
                    <div className={styles.statusBoxSuccess}>
                      <CheckCircle2 size={20} />
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