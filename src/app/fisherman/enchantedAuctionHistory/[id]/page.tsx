'use client';
 
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Clock, ShieldCheck, Truck, User, MapPin,
  Anchor, CheckCircle2, Loader2, Calendar, Gavel,
  Scale, DollarSign, Fish, Award, TrendingUp
} from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
 
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
 
// ======================
// DUMMY DATA PREVIEW
// HAPUS NANTI SAAT BACKEND SUDAH JADI
// ======================

const DUMMY_AUCTION: AuctionDetailData = {
  id: 'AUC12345678',
  name: 'Tuna Sirip Biru Premium',
  weight_kg: 120,
  grade: 'A',
  image_url: '',
  description: 'Dummy data preview untuk testing UI.',
  status: 'completed',

  start_price: 15000000,
  final_price: 24500000,

  created_at: new Date().toISOString(),
  ends_at: new Date().toISOString(),

  winner: {
    id: 'USR001',
    name: 'PT Laut Nusantara',
    verified: true,
  },

  seller: {
    id: 'SLR001',
    name: 'Pak Hasan',
    vessel_name: 'Samudra Jaya',
    verified: true,
  },

  bids: [
    {
      id: 'BID001',
      bidder_id: 'USR001',
      bidder_name: 'PT Laut Nusantara',
      amount: 24500000,
      created_at: new Date().toISOString(),
    },
    {
      id: 'BID002',
      bidder_id: 'USR002',
      bidder_name: 'CV Mina Segar',
      amount: 22000000,
      created_at: new Date().toISOString(),
    },
    {
      id: 'BID003',
      bidder_id: 'USR003',
      bidder_name: 'Seafood Makmur',
      amount: 20000000,
      created_at: new Date().toISOString(),
    },
  ],

  logistics: {
    id: 'LOG001',
    status: 'shipped',
    pickup_address: 'Pelabuhan Muara Baru, Jakarta',
    delivery_address: 'Pelabuhan Tanjung Perak, Surabaya',
    courier: 'JNE Cargo Laut',
    tracking_number: 'JNELAUT123456',
    estimated_arrival: new Date().toISOString(),
  },

  escrow: {
    amount: 24500000,
    is_released: false,
  },
};
// ------------------------------------------------------------------------------------------


interface BidHistory {
  id: string;
  bidder_id: string;
  bidder_name: string;
  amount: number;
  created_at: string;
}
 
interface LogisticsInfo {
  id: string;
  status: 'pending' | 'shipped' | 'arrived' | 'delivered';
  pickup_address?: string;
  delivery_address?: string;
  courier?: string;
  tracking_number?: string;
  estimated_arrival?: string;
}
 
interface WinnerInfo {
  id: string;
  name: string;
  phone?: string;
  verified: boolean;
}
 
interface SellerInfo {
  id: string;
  name: string;
  vessel_name?: string;
  verified: boolean;
}
 
interface EscrowInfo {
  amount: number;
  is_released: boolean;
}
 
interface AuctionDetailData {
  id: string;
  name: string;
  weight_kg: number;
  grade?: string;
  image_url?: string;
  description?: string;
  status: string;
  start_price: number;
  final_price: number;
  ends_at: string;
  created_at: string;
  winner: WinnerInfo | null;
  seller: SellerInfo | null;
  bids: BidHistory[];
  logistics: LogisticsInfo | null;
  escrow: EscrowInfo;
}
 
const formatIDR = (amount: number) =>
  amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
 
const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
 
const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
 
export default function AuctionHistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
 
  const [auction, setAuction] = useState<AuctionDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
 
  const fetchAuctionDetails = useCallback(async () => {
    setLoading(true);

    try {

      // ==========================
      // BACKEND FETCH DI-COMMENT DULU
      // ==========================

      /*
      if (!id || !token) return;

      const res = await fetch(`${API_URL}/api/auctions/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal memuat detail riwayat lelang.');
      }

      const data: AuctionDetailData = await res.json();
      setAuction(data);
      */

      // ==========================
      // DUMMY DATA
      // ==========================

      setAuction(DUMMY_AUCTION);

      setError(null);

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  }, []);
 
  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push('/'); return; }
    fetchAuctionDetails();
  }, [user, isLoading, fetchAuctionDetails, router]);
 
  if (loading) {
    return (
      <div className={styles.all}>
        <Navbar />
        <div className={styles.loadingState}>
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--clr-primary)' }} />
          <p>Memuat detail riwayat lelang...</p>
        </div>
      </div>
    );
  }
 
  if (error || !auction) {
    return (
      <div className={styles.all}>
        <Navbar />
        <div className={styles.errorState}>
          <p className={styles.errorText}>{error || 'Detail lelang tidak ditemukan.'}</p>
          <button onClick={() => router.back()} className={styles.backBtn}>
            <ArrowLeft size={16} /> Kembali
          </button>
        </div>
      </div>
    );
  }
 
  const highestBidAmount = auction.bids.length > 0
    ? Math.max(...auction.bids.map((b) => b.amount))
    : 0;
 
  const profit = auction.final_price - auction.start_price;
  const profitPct = auction.start_price > 0
    ? ((profit / auction.start_price) * 100).toFixed(1)
    : '0';
 
  const logisticSteps = [
    { label: 'Pesanan Dikonfirmasi', desc: 'Dana disimpan aman di Escrow LEKAN', statusKey: 'pending', icon: <ShieldCheck size={16} /> },
    { label: 'Dalam Perjalanan',     desc: 'Kapal kargo telah berangkat dari dermaga', statusKey: 'shipped', icon: <Truck size={16} /> },
    { label: 'Tiba di Pelabuhan',    desc: 'Kargo siap diambil di pelabuhan tujuan', statusKey: 'arrived', icon: <Anchor size={16} /> },
    { label: 'Barang Diterima',      desc: 'Transaksi selesai & dana dirilis ke nelayan', statusKey: 'delivered', icon: <CheckCircle2 size={16} /> },
  ];
 
  const currentStepIndex = logisticSteps.findIndex(
    (s) => s.statusKey === (auction.logistics?.status ?? 'pending')
  );
 
  const statusLabel: Record<string, { label: string; cls: string }> = {
    active:    { label: 'Aktif',      cls: styles.statusActive },
    completed: { label: 'Selesai',    cls: styles.statusCompleted },
    cancelled: { label: 'Dibatalkan', cls: styles.statusCancelled },
  };
  const statusInfo = statusLabel[auction.status] ?? { label: auction.status, cls: '' };
 
  return (
    <div className={styles.all}>
      <Navbar />
      <main className={styles.mainContainer}>
        <div className={styles.container}>
 
          {/* Header */}
          <div className={styles.header}>
            <button onClick={() => router.back()} className={styles.backLink}>
              <ArrowLeft size={16} /> Kembali ke Daftar Histori
            </button>
            <div className={styles.pageTitleRow}>
              <div>
                <h1 className={styles.pageTitle}>Detail Riwayat Lelang</h1>
                <p className={styles.pageSubtitle}>ID: #{auction.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <span className={`${styles.statusBadge} ${statusInfo.cls}`}>{statusInfo.label}</span>
            </div>
          </div>
 
          <div className={styles.contentGrid}>
 
            {/* ── KIRI: Info Ikan & Riwayat Bid ── */}
            <div className={styles.leftCol}>
 
              {/* Card Info Ikan */}
              <div className={styles.card}>
                <div className={styles.fishSection}>
                  <div className={styles.imageWrapper}>
                    <img
                      src={auction.image_url || '/fish-placeholder.jpg'}
                      alt={auction.name}
                      className={styles.fishImage}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="100%" height="100%" fill="%230f172a"/></svg>';
                      }}
                    />
                  </div>
                  <div className={styles.fishMeta}>
                    <div className={styles.fishTagRow}>
                      <Fish size={12} />
                      <span>Produk Lelang</span>
                    </div>
                    <h2 className={styles.fishName}>{auction.name}</h2>
                    <div className={styles.tagGrid}>
                      {auction.grade && <span className={styles.tag}>Grade {auction.grade}</span>}
                      <span className={styles.tag}>{auction.weight_kg} KG</span>
                      <span className={styles.tag}>{auction.bids.length} Penawar</span>
                    </div>
                    <div className={styles.specsGrid}>
                      <div className={styles.specItem}>
                        <Calendar size={14} />
                        <span>{formatDate(auction.created_at)}</span>
                      </div>
                      <div className={styles.specItem}>
                        <Clock size={14} />
                        <span>Berakhir {formatDate(auction.ends_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
 
              {/* Stats */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIconWrap} style={{ background: '#eff6ff' }}>
                    <TrendingUp size={16} color="var(--clr-primary)" />
                  </div>
                  <span className={styles.statLabel}>Harga Awal</span>
                  <span className={styles.statValue}>{formatIDR(auction.start_price)}</span>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIconWrap} style={{ background: '#f0fdf4' }}>
                    <Award size={16} color="#16a34a" />
                  </div>
                  <span className={styles.statLabel}>Harga Final</span>
                  <span className={styles.statValue} style={{ color: '#16a34a' }}>{formatIDR(auction.final_price)}</span>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIconWrap} style={{ background: '#fff7ed' }}>
                    <DollarSign size={16} color="#ea580c" />
                  </div>
                  <span className={styles.statLabel}>Kenaikan</span>
                  <span className={styles.statValue} style={{ color: '#ea580c' }}>+{profitPct}%</span>
                </div>
              </div>
 
              {/* Card Riwayat Bid */}
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Riwayat Penawaran ({auction.bids.length})</h3>
                {auction.bids.length === 0 ? (
                  <p className={styles.emptyStateText}>Belum ada riwayat penawaran.</p>
                ) : (
                  <div className={styles.bidTableWrapper}>
                    <table className={styles.bidTable}>
                      <thead>
                        <tr>
                          <th>Waktu</th>
                          <th>Penawar</th>
                          <th style={{ textAlign: 'right' }}>Nilai Bid</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auction.bids.map((bid) => {
                          const isHighest = bid.amount === highestBidAmount;
                          return (
                            <tr key={bid.id} className={isHighest ? styles.highestBidRow : ''}>
                              <td className={styles.bidTimeCell}>
                                {formatDateTime(bid.created_at)}
                              </td>
                              <td>
                                <div className={styles.bidderNameCell}>
                                  <User size={13} />
                                  <span>{bid.bidder_name}</span>
                                  {isHighest && <span className={styles.highestBadge}>Tertinggi</span>}
                                </div>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                {formatIDR(bid.amount)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
 
            {/* ── KANAN: Info Lelang, Logistik, Escrow ── */}
            <div className={styles.rightCol}>
 
              {/* Card Pemenang & Seller */}
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Informasi Transaksi</h3>
 
                {auction.winner && (
                  <div className={styles.personRow}>
                    <div className={styles.avatarCircle}>
                      <User size={18} />
                    </div>
                    <div>
                      <span className={styles.infoLabel}>Pemenang Lelang</span>
                      <h4 className={styles.personName}>
                        {auction.winner.name}
                        {auction.winner.verified && <ShieldCheck size={12} className={styles.verifiedIcon} />}
                      </h4>
                    </div>
                  </div>
                )}
 
                {auction.winner && auction.seller && <div className={styles.divider} />}
 
                {auction.seller && (
                  <div className={styles.personRow}>
                    <div className={styles.avatarCircle}>
                      <Anchor size={18} />
                    </div>
                    <div>
                      <span className={styles.infoLabel}>Nelayan Penjual</span>
                      <h4 className={styles.personName}>
                        {auction.seller.name}
                        {auction.seller.verified && <ShieldCheck size={12} className={styles.verifiedIcon} />}
                      </h4>
                      {auction.seller.vessel_name && (
                        <p className={styles.personSub}>KM {auction.seller.vessel_name}</p>
                      )}
                    </div>
                  </div>
                )}
 
                <div className={styles.divider} />
 
                <div className={styles.infoRowBetween}>
                  <span className={styles.infoLabel}>Nilai Transaksi</span>
                  <span className={styles.priceValue}>{formatIDR(auction.final_price)}</span>
                </div>
 
                <div className={styles.infoRowBetween} style={{ marginTop: 8 }}>
                  <div className={styles.infoLabelPair}>
                    <Calendar size={14} />
                    <span>Tanggal Berakhir</span>
                  </div>
                  <span className={styles.infoValue}>{formatDate(auction.ends_at)}</span>
                </div>
              </div>
 
              {/* Card Logistik */}
              {auction.logistics ? (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Status Logistik</h3>
                  <div className={styles.verticalTimeline}>
                    {logisticSteps.map((step, index) => {
                      const isPassed  = index <= currentStepIndex;
                      const isCurrent = index === currentStepIndex;
                      return (
                        <div
                          key={step.statusKey}
                          className={`${styles.timelineStep} ${isPassed ? styles.stepDone : ''} ${isCurrent ? styles.stepCurrent : ''}`}
                        >
                          <div className={styles.stepIconWrapper}>
                            {step.icon}
                            {index < logisticSteps.length - 1 && <div className={styles.verticalLine} />}
                          </div>
                          <div className={styles.stepContent}>
                            <h4 className={styles.stepLabel}>{step.label}</h4>
                            <p className={styles.stepDesc}>{step.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
 
                  <div className={styles.divider} />
 
                  <div className={styles.routeContainer}>
                    <div className={styles.routeItem}>
                      <MapPin size={14} className={styles.pickupIcon} />
                      <div>
                        <span className={styles.routeLabel}>Asal</span>
                        <p className={styles.routeAddress}>{auction.logistics.pickup_address || 'Dermaga Nelayan'}</p>
                      </div>
                    </div>
                    <div className={styles.routeItem}>
                      <Anchor size={14} className={styles.deliveryIcon} />
                      <div>
                        <span className={styles.routeLabel}>Tujuan</span>
                        <p className={styles.routeAddress}>{auction.logistics.delivery_address || 'Pelabuhan Tujuan'}</p>
                      </div>
                    </div>
                  </div>
 
                  <div className={styles.metaInfoGrid}>
                    <div>
                      <span className={styles.infoLabel}>Ekspedisi</span>
                      <p className={styles.metaValue}>{auction.logistics.courier || '-'}</p>
                    </div>
                    <div>
                      <span className={styles.infoLabel}>No. Resi</span>
                      <p className={styles.metaValue}>{auction.logistics.tracking_number || '-'}</p>
                    </div>
                    <div>
                      <span className={styles.infoLabel}>Est. Tiba</span>
                      <p className={styles.metaValue}>
                        {auction.logistics.estimated_arrival
                          ? formatDate(auction.logistics.estimated_arrival)
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Status Logistik</h3>
                  <div className={styles.statusBoxInfo}>
                    <Clock size={15} />
                    <span>
                      {auction.status === 'active'
                        ? 'Lelang masih berlangsung. Logistik dibuat setelah lelang selesai.'
                        : 'Belum ada data logistik untuk lelang ini.'}
                    </span>
                  </div>
                </div>
              )}
 
              {/* Card Escrow Status — pengganti Payment card */}
              <div
                className={styles.card}
                style={{
                  border: auction.escrow.is_released ? '1.5px solid #bbf7d0' : '1.5px solid #bfdbfe',
                  background: auction.escrow.is_released ? '#f0fdf4' : '#eff6ff',
                }}
              >
                <h3 className={styles.cardTitle}>Status Escrow</h3>
 
                {auction.escrow.is_released ? (
                  <div className={styles.statusBoxSuccess}>
                    <CheckCircle2 size={16} />
                    <div>
                      <strong>Dana Telah Dirilis</strong>
                      <p>
                        Sebesar {formatIDR(auction.escrow.amount)} telah dikirim ke saldo nelayan
                        setelah pembeli mengonfirmasi penerimaan barang.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className={styles.statusBoxEscrow}>
                    <ShieldCheck size={16} />
                    <div>
                      <strong>Dana Aman di Escrow</strong>
                      <p>
                        Sebesar {formatIDR(auction.escrow.amount)} sedang disimpan di sistem escrow LEKAN
                        dan akan otomatis dirilis ke nelayan setelah barang diterima pembeli.
                      </p>
                    </div>
                  </div>
                )}
              </div>
 
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}