'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Clock, ShieldCheck, Truck, User, MapPin,
  Anchor, CheckCircle2, Loader2, Calendar, Gavel,
  Scale, DollarSign, Fish, Award, TrendingUp, BadgeCheck
} from 'lucide-react';
import SideFisherman from '../../../components/sideFisherman';
import NavbarFisherman from '../../../components/NavbarFisherman';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/* ─── Types ─── */
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

/* ─── Formatters ─── */
const formatIDR = (amount: number) =>
  amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

/* ─── Component ─── */
export default function AuctionHistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  const [auction, setAuction]   = useState<AuctionDetailData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const fetchAuctionDetails = useCallback(async () => {
    if (!id || !token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/history/detail/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal memuat detail riwayat lelang.');
      }

      const data: AuctionDetailData = await res.json();
      setAuction(data);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push('/'); return; }
    fetchAuctionDetails();
  }, [user, isLoading, fetchAuctionDetails, router]);

  const tags = [
    'SUSTAINABLE',
    auction?.grade ? `GRADE ${auction.grade}` : 'SASHIMI GRADE',
  ]; 

  const [sidebarOpen, setSidebarOpen] = useState(false);
  

  /* ─── Loading ─── */
  if (loading) {
    return (
       <div className={styles.all}>
      <SideFisherman
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                />
      <div className={styles.container}>
        <NavbarFisherman setSidebarOpen={setSidebarOpen}/>


        <div className={styles.content}>
            <Loader2 size={36} className="animate-spin" style={{ color: 'var(--clr-primary)' }} />
          <p>Memuat detail riwayat lelang...</p>
        </div>
      </div>
    </div>
    
      // <div className={styles.all}>
      //   <Navbar />
      //   <div className={styles.loadingState}>
      //     <Loader2 size={36} className="animate-spin" style={{ color: 'var(--clr-primary)' }} />
      //     <p>Memuat detail riwayat lelang...</p>
      //   </div>
      // </div>
    );
  }

  /* ─── Error ─── */
  if (error || !auction) {
    return (
       <div className={styles.all}>
      <SideFisherman
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                />
      <div className={styles.container}>
        <NavbarFisherman setSidebarOpen={setSidebarOpen}/>


        <div className={styles.content}>
           <p className={styles.errorText}>{error || 'Detail lelang tidak ditemukan.'}</p>
          <button onClick={() => router.back()} className={styles.backBtn}>
            <ArrowLeft size={16} /> Kembali
          </button>
        </div>
      </div>
    </div>
    );
  }

  /* ─── Derived values ─── */
  const highestBidAmount = auction.bids.length > 0
    ? Math.max(...auction.bids.map(b => b.amount))
    : 0;

  const profit    = auction.final_price - auction.start_price;
  const profitPct = auction.start_price > 0
    ? ((profit / auction.start_price) * 100).toFixed(1)
    : '0';

  const logisticSteps = [
    { label: 'Pesanan Dikonfirmasi', desc: 'Dana disimpan aman di Escrow LEKAN',              statusKey: 'pending',   icon: <ShieldCheck className={styles.logisticIcon} /> },
    { label: 'Dalam Perjalanan',     desc: 'Kapal kargo telah berangkat dari dermaga',         statusKey: 'shipped',   icon: <Truck className={styles.logisticIcon} /> },
    { label: 'Tiba di Pelabuhan',    desc: 'Kargo siap diambil di pelabuhan tujuan',           statusKey: 'arrived',   icon: <Anchor className={styles.logisticIcon} /> },
    { label: 'Barang Diterima',      desc: 'Transaksi selesai & dana dirilis ke nelayan',      statusKey: 'delivered', icon: <CheckCircle2 className={styles.logisticIcon} /> },
  ];

  const currentStepIndex = logisticSteps.findIndex(
    s => s.statusKey === (auction.logistics?.status ?? 'pending')
  );

  const statusLabel: Record<string, { label: string; cls: string }> = {
    active:    { label: 'Aktif',      cls: styles.statusActive },
    done:      { label: 'Selesai',    cls: styles.statusCompleted },
    completed: { label: 'Selesai',    cls: styles.statusCompleted },
    cancelled: { label: 'Dibatalkan', cls: styles.statusCancelled },
    pending:   { label: 'Pending',    cls: styles.statusPending },
  };
  const statusInfo = statusLabel[auction.status] ?? { label: auction.status, cls: '' };

  

  /* ─── Render ─── */
  return (
      <div className={styles.all}>
      <SideFisherman
                  sidebarOpen={sidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                />
      <div className={styles.container}>
        <NavbarFisherman setSidebarOpen={setSidebarOpen}/>


        <div className={styles.content}>
          <div className={styles.header}>
            <button onClick={() => router.back()} className={styles.backLink}>
              <ArrowLeft size={18} /> Kembali 
            </button>
            <div className={styles.pageTitleRow}>
              <div>
                <h1 className={styles.pageTitle}>Detail Lelang</h1>
                <p className={styles.pageSubtitle}>ID: #{auction.id.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
          </div>

          <div className={styles.contentGrid}>

            {/* ── KIRI ── */}
            <div className={styles.leftCol}>
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

              {/* Stats */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard} style={{order: 1}}>
                  <div className= {styles.cardwrapper}>
                    <div className={styles.statIconWrap} style={{ background: '#eff6ff' }}>
                      <TrendingUp size={20} color="var(--clr-primary)" />
                    </div>
                    <span className={styles.statLabel}>Harga Awal</span>
                  </div>
                  <span className={styles.statValue}>{formatIDR(auction.start_price)}</span>
                </div>
                <div className={styles.statCard} style={{order: 3}}>
                  <div className= {styles.cardwrapper}>
                    <div className={styles.statIconWrap} style={{ background: '#f0fdf4' }}>
                      <Award size={20} color="#16a34a" />
                    </div>
                    <span className={styles.statLabel}>
                      {auction.status === 'active'
                        ? 'Harga Sekarang'
                        : 'Harga Final'}

                    </span>
                  </div>
                  
                  <span className={styles.statValue} style={{ color: '#16a34a' }}>{formatIDR(auction.final_price)}</span>
                </div>
                <div className={styles.statCard} style={{order: 2}}>
                  <div className= {styles.cardwrapper}>
                    <div className={styles.statIconWrap} style={{ background: '#fff7ed' }}>
                      <DollarSign size={20} color="#ea580c" />
                    </div>
                    <span className={styles.statLabel}>Kenaikan</span>
                  </div>
                  <span className={styles.statValue} style={{ color: '#ea580c' }}>
                    {profit >= 0 ? '+' : ''}{profitPct}%
                  </span>
                </div>
              </div>

              {/* Riwayat Bid */}

              <div className={styles.card}>
                <div className={styles.bidheader}>
                  <h3 className={styles.cardTitle}>Riwayat Penawaran ({auction.bids.length})</h3>
                </div>
                  {auction.bids.length === 0 ? (
                    <p className={styles.emptyStateText}>Belum ada riwayat penawaran.</p>
                  ) : (
                    <div className={styles.bidtable}>
                      <div className={styles.bidtableHeader}>
                        <span>Waktu</span>
                        <span>Penawar</span>
                        <span>Nilai Bid</span>
                      </div>
                      {auction.bids.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                        Belum ada penawaran
                      </div>
                      ) : (
                        auction.bids.map(bid => {
                          const isHighest = bid.amount === highestBidAmount;
                          return(
                            <div key={bid.id} className={`${styles.row} ${isHighest ? styles.rowHighest : styles.rowHover}`}>
                              <div className={styles.time}>
                                {formatDateTime(bid.created_at)}
                              </div>

                              <div className={`${isHighest ? styles.bidderNameCellHighest : styles.bidderNameCell}`}>
                                {/* <User size={13} /> */}
                                {bid.bidder_name}
                                {isHighest && <span className={styles.highestBadge}>Tertinggi</span>}
                              </div>

                              <div className={styles.amountWrapper}>
                                {formatIDR(bid.amount)}
                              </div>
                            </div>
                          );
                        })
                      )}

                    </div>
                  )}
              </div>

            </div>
            {/* ── KANAN ── */}
            <div className={styles.rightCol}>

              {/* Informasi Transaksi */}
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Informasi Transaksi</h3>

                {auction.winner && (
                  <div className={styles.personRow}>
                    <div className={styles.avatarCircle}><User size={18} /></div>
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
                    <div className={styles.avatarCircle}><Anchor size={18} /></div>
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

              {/* Logistik */}
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
                      <MapPin className={styles.pickupIcon} />
                      <div>
                        <span className={styles.routeLabel}>Asal</span>
                        <p className={styles.routeAddress}>{auction.logistics.pickup_address || 'Dermaga Nelayan'}</p>
                      </div>
                    </div>
                    <div className={styles.routeItem}>
                      <Anchor className={styles.deliveryIcon} />
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
                        {auction.logistics.estimated_arrival ? formatDate(auction.logistics.estimated_arrival) : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Status Logistik</h3>
                  <div className={styles.statusBoxInfo}>
                    <Clock className={styles.logisticIcon}/>
                    <span>
                      {auction.status === 'active'
                        ? 'Lelang masih berlangsung. Logistik dibuat setelah lelang selesai.'
                        : 'Belum ada data logistik untuk lelang ini.'}
                    </span>
                  </div>
                </div>
              )}

              {/* Escrow */}
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
                    <CheckCircle2 className={styles.logisticIcon} />
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
                    <ShieldCheck className={styles.logisticIcon} />
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

      </div>
    </div>
  );
}