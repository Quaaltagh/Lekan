'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Clock, ShieldCheck, Truck, User, MapPin, Anchor,
  CheckCircle2, Loader2, Edit3, Check, X, Award, FileText, Calendar,
} from 'lucide-react';
import Navbar from '@/app/components/Navbar';
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
  ends_at: string;
  species?: string;
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

interface SellerProfile {
  full_name?: string;
  vessel_name?: string;
  verified?: boolean;
  phone?: string;
}

interface InvoiceMeta {
  invoice_number: string;
  created_at: string;
}

const STATUS_ORDER = ['pending', 'shipped', 'arrived', 'delivered'] as const;

const STEP_CONFIG = [
  { key: 'pending',   label: 'Pesanan Diterima',  desc: 'Dana disimpan aman di Escrow LEKAN',              Icon: ShieldCheck  },
  { key: 'shipped',   label: 'Dalam Perjalanan',  desc: 'Kapal Cargo telah berangkat dari dermaga nelayan', Icon: Truck        },
  { key: 'arrived',   label: 'Tiba di Pelabuhan', desc: 'Kargo ikan siap diambil di pelabuhan tujuan',     Icon: Anchor       },
  { key: 'delivered', label: 'Barang Diterima',   desc: 'Transaksi selesai & dana dirilis ke nelayan',      Icon: CheckCircle2 },
];

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export default function BuyerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { user, token, isLoading } = useAuth();

  const [logistics,      setLogistics]      = useState<LogisticsData | null>(null);
  const [seller,         setSeller]         = useState<SellerProfile | null>(null);
  const [invoiceMeta,    setInvoiceMeta]    = useState<InvoiceMeta | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [actionLoading,  setActionLoading]  = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressInput,   setAddressInput]   = useState('');

  /* ── Fetch logistik + seller + invoice ── */
  const fetchDetails = useCallback(async () => {
    if (!id || !token) return;
    setLoading(true);
    try {
      // 1. Logistik
      const res = await fetch(`${API_URL}/api/logistics/auction/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Gagal memuat detail logistik.');
      const data: LogisticsData = await res.json();
      setLogistics(data);
      setAddressInput(data.delivery_address || data.destination || '');
      setError(null);

      // 2. Seller profile
      if (data.seller_id) {
        const sRes = await fetch(`${API_URL}/api/profile/${data.seller_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (sRes.ok) setSeller(await sRes.json());
      }

      // 3. Invoice meta (nomor faktur + tanggal)
      const iRes = await fetch(`${API_URL}/api/invoice/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (iRes.ok) {
        const inv = await iRes.json();
        setInvoiceMeta({ invoice_number: inv.invoice_number, created_at: inv.created_at });
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

  /* ── Konfirmasi barang diterima (buyer) ── */
  const handleConfirmReceipt = async () => {
    if (!logistics || !token) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/logistics/${logistics.id}/delivered`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Gagal mengonfirmasi barang diterima.');
      await fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan.');
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Update alamat pengiriman ── */
  const handleUpdateAddress = async () => {
    if (!logistics || !token || !addressInput.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/logistics/${logistics.id}/address`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ deliveryAddress: addressInput }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Gagal mengubah alamat pengiriman.');
      setIsEditingAddress(false);
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
      <div className={styles.all}>
        <Navbar />
        <div className={styles.loadingState}>
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--clr-primary)' }} />
          <p>Memuat detail pelacakan pemesanan Anda...</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !logistics) {
    return (
      <div className={styles.all}>
        <Navbar />
        <div className={styles.errorState}>
          <p className={styles.errorText}>{error || 'Detail pemesanan tidak ditemukan.'}</p>
          <button onClick={() => router.back()} className={styles.backBtn}>
            <ArrowLeft size={16} /> Kembali
          </button>
        </div>
      </div>
    );
  }

  const { auctions: auction, status } = logistics;
  const finalPrice  = auction.final_price || 0;
  const currentIdx  = STATUS_ORDER.indexOf(status);

  const steps = STEP_CONFIG.map((step, idx) => ({
    ...step,
    stepStatus: idx < currentIdx ? 'completed' : idx === currentIdx ? 'active' : 'inactive',
  }));

  const tags = [
    'SUSTAINABLE',
    auction?.grade ? `GRADE ${auction.grade}` : 'SASHIMI GRADE',
    'VERIFIED SELLER',
  ];

  return (
    <div className={styles.all}>
      <Navbar />
      <main className={styles.mainContainer}>
        <div className={styles.container}>

          {/* ── Kiri ── */}
          <div className={styles.mainContent}>

            <div className={styles.header}>
              <button onClick={() => router.back()} className={styles.backLink}>
                <ArrowLeft size={18} /> Kembali
              </button>
              <div className={styles.notiHeader}>
                <h1 className={styles.pageTitle}>Lacak Pengiriman Kargo Ikan</h1>
                <p className={styles.pageSubtitle}>Pantau status perjalanan produk lelang yang Anda menangkan.</p>
              </div>
            </div>

            {/* Gambar */}
            <div className={styles.imageContainer}>
              <img
                src={auction.image_url || 'https://darilaut.id/wp-content/uploads/2021/09/Tuna-3.jpg'}
                alt={auction.name}
                className={styles.image}
                onError={e => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%230f172a"/></svg>';
                }}
              />
            </div>

            <div className={styles.headerContainer}>
              <div className={styles.titleWrapper}>
                <h1 className={styles.title}>{auction.name}</h1>
                <p className={styles.subtitle}>
                  {auction.species || 'Ikan Segar'} • Ditambahkan{' '}
                  {new Date(auction.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
              <div className={styles.weightBox}>
                <span className={styles.weightLabel}>Berat</span>
                <span className={styles.weightValue}>
                  {auction.weight_kg} <span className={styles.unit}>KG</span>
                </span>
              </div>
            </div>

            <div className={styles.tagContainer}>
              {tags.map(tag => <span key={tag} className={styles.tag}>{tag}</span>)}
            </div>

            <p className={styles.descriptionText}>
              Produk segar berkualitas tinggi dari nelayan terverifikasi. Ditangkap dengan metode yang
              berkelanjutan dan diproses dengan protokol rantai dingin ketat untuk menjaga kesegaran
              dan kualitas optimal.
            </p>

            {/* Timeline */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Status Pengiriman Real-Time</h3>
              <div className={styles.timeline}>
                {steps.map((step, idx) => {
                  const { Icon } = step;
                  return (
                    <div
                      key={step.key}
                      className={`
                        ${styles.timelineItem}
                        ${step.stepStatus === 'completed' ? styles.completedTimeline : ''}
                        ${step.stepStatus === 'active'    ? styles.activeTimeline    : ''}
                        ${step.stepStatus === 'inactive'  ? styles.inactiveTimeline  : ''}
                      `}
                    >
                      <div className={styles.timelineLeft}>
                        <div className={styles.timelineIconWrapper}>
                          <Icon size={20} />
                        </div>
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

            {/* Konfirmasi penerimaan — muncul saat status arrived */}
            {status === 'arrived' && (
              <div className={styles.card} style={{ border: '1.5px solid #bbf7d0', background: '#f0fdf4' }}>
                <h3 className={styles.cardTitle}>Konfirmasi Penerimaan Barang</h3>
                <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1rem' }}>
                  Kargo telah tiba di pelabuhan tujuan. Setelah Anda mengonfirmasi penerimaan,
                  dana akan otomatis dirilis ke nelayan.
                </p>
                <button
                  onClick={handleConfirmReceipt}
                  disabled={actionLoading}
                  className={styles.primaryButton}
                  style={{ background: '#16a34a' }}
                >
                  {actionLoading
                    ? <Loader2 size={16} className="animate-spin" />
                    : <><CheckCircle2 size={16} /> Konfirmasi Barang Sudah Diterima</>}
                </button>
              </div>
            )}

            {status === 'delivered' && (
              <div className={styles.card} style={{ border: '1.5px solid #bbf7d0', background: '#f0fdf4' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#16a34a', fontWeight: 600 }}>
                  <CheckCircle2 size={18} />
                  Transaksi Selesai — Terima kasih telah bertransaksi di LEKAN!
                </div>
              </div>
            )}

          </div>

          {/* ── Kanan ── */}
          <div className={styles.rightwrapper}>

            {/* Harga */}
            <div className={styles.winningBidCard}>
              <div>
                <span className={styles.winningLabel}>Harga Pembelian</span>
                <div className={styles.priceWrapper}>
                  <span className={styles.priceValue}>
                    {finalPrice.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
              <div className={styles.iconContainer}>
                <Award className={styles.icon} />
              </div>
            </div>

            {/* Detail Transaksi */}
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Detail Transaksi</h3>
              <div className={styles.transactionContent}>

                {/* Seller */}
                <div className={styles.sellerleft}>
                  <div className={styles.selleravatarWrapper}>
                    <div style={{
                      width: '100%', height: '100%', background: '#1e3a8a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700, fontSize: '1.25rem', borderRadius: '50%',
                    }}>
                      {(seller?.full_name || 'NK').slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <span className={styles.sellerlabel}>Penjual</span>
                    <h5 className={styles.sellername}>
                      {seller?.full_name || 'Nelayan Terverifikasi'}
                      {seller?.verified && <ShieldCheck className={styles.verifiedIcon} />}
                    </h5>
                    <p className={styles.sellermeta}>
                      Nelayan Terverifikasi{seller?.vessel_name ? ` • KM ${seller.vessel_name}` : ''}
                    </p>
                  </div>
                </div>

                {/* Tanggal menang — dari invoice.created_at */}
                <div className={styles.sellerleft}>
                  <div className={styles.selleravatarWrapper}>
                    <Calendar className={styles.rowIcon} />
                  </div>
                  <div>
                    <span className={styles.sellerlabel}>Tanggal Transaksi</span>
                    <h5 className={styles.sellername}>
                      {invoiceMeta
                        ? formatDateTime(invoiceMeta.created_at)
                        : new Date(auction.ends_at).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })}
                    </h5>
                  </div>
                </div>

                {/* Nomor Faktur — dari invoice.invoice_number */}
                <div className={styles.sellerleft}>
                  <div className={styles.selleravatarWrapper}>
                    <FileText className={styles.rowIcon} />
                  </div>
                  <div>
                    <span className={styles.sellerlabel}>Nomor Faktur</span>
                    <h5 className={styles.sellername}>
                      {invoiceMeta ? `#${invoiceMeta.invoice_number}` : '-'}
                    </h5>
                  </div>
                </div>

                {/* Tombol Invoice */}
                <div className={styles.actionSection}>
                  <button
                    onClick={() => router.push(`/buyer/invoice/${id}`)}
                    className={styles.primaryButton}
                  >
                    <FileText className={styles.buttonIcon} />
                    Lihat Faktur
                  </button>
                </div>
              </div>
            </div>

            {/* Rincian Logistik */}
            <div className={styles.card}>
              <div className={styles.cardHeaderWithAction}>
                <h3 className={styles.cardTitle}>Rincian Logistik</h3>
                {status === 'pending' && !isEditingAddress && (
                  <button onClick={() => setIsEditingAddress(true)} className={styles.editAddressBtn}>
                    <Edit3 size={14} /> Ubah Alamat
                  </button>
                )}
              </div>

              {isEditingAddress ? (
                <div className={styles.addressEditBox}>
                  <textarea
                    value={addressInput}
                    onChange={e => setAddressInput(e.target.value)}
                    className={styles.addressTextArea}
                    placeholder="Masukkan alamat pengiriman lengkap Anda..."
                    rows={3}
                  />
                  <div className={styles.editActionsGrid}>
                    <button onClick={handleUpdateAddress} disabled={actionLoading} className={styles.saveBtn}>
                      {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Simpan</>}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingAddress(false);
                        setAddressInput(logistics.delivery_address || logistics.destination || '');
                      }}
                      disabled={actionLoading}
                      className={styles.cancelBtn}
                    >
                      <X size={14} /> Batal
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.routeContainer}>
                  <div className={styles.routeItem}>
                    <MapPin size={18} className={styles.pickupIcon} />
                    <div>
                      <span className={styles.routeLabel}>Lokasi Asal (Dermaga)</span>
                      <p className={styles.routeAddress}>{logistics.pickup_address || 'Dermaga Penjemputan Nelayan'}</p>
                    </div>
                  </div>
                  <div className={styles.routeItem}>
                    <Anchor size={18} className={styles.deliveryIcon} />
                    <div>
                      <span className={styles.routeLabel}>Alamat Pengiriman (Tujuan)</span>
                      <p className={styles.routeAddress}>{logistics.delivery_address || logistics.destination || 'Pelabuhan Tujuan Anda'}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.divider} />

              <div className={styles.metaInfoGrid}>
                <div>
                  <span className={styles.infoLabel}>Ekspedisi Laut</span>
                  <p className={styles.metaValue}>{logistics.courier || 'Maritime Express'}</p>
                </div>
                <div>
                  <span className={styles.infoLabel}>No. Resi Logistik</span>
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

          </div>
        </div>
      </main>
    </div>
  );
}