'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, ShieldCheck, Truck, User, MapPin, Anchor, CheckCircle2, Loader2, Edit3, Check, X } from 'lucide-react';
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

interface SellerProfile {
  full_name?: string;
  vessel_name?: string;
  verified?: boolean;
  phone?: string;
}

export default function BuyerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  const [logistics, setLogistics] = useState<LogisticsData | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Address edit state
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState('');

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
      setAddressInput(data.delivery_address || data.destination || '');
      setError(null);

      // Fetch profile seller jika seller_id tersedia
      if (data.seller_id) {
        const sRes = await fetch(`${API_URL}/api/profile/${data.seller_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (sRes.ok) {
          const sData = await sRes.json();
          setSeller(sData);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/');
      return;
    }
    fetchDetails();
  }, [user, isLoading, fetchDetails, router]);

  const handleConfirmReceipt = async () => {
    if (!logistics || !token) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/logistics/${logistics.id}/delivered`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal mengonfirmasi barang diterima.');
      }
      await fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateAddress = async () => {
    if (!logistics || !token || !addressInput.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/logistics/${logistics.id}/address`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deliveryAddress: addressInput }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal mengubah alamat pengiriman.');
      }
      setIsEditingAddress(false);
      await fetchDetails();
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan.');
    } finally {
      setActionLoading(false);
    }
  };

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
  const finalPrice = auction.final_price || 0;

  // Timeline tracking status
  const steps = [
    { label: 'Pesanan Diterima', desc: 'Dana disimpan aman di Escrow LEKAN', isDone: true, key: 'pending' },
    { label: 'Dalam Perjalanan', desc: 'Kapal Cargo telah berangkat dari dermaga nelayan', isDone: status !== 'pending', key: 'shipped' },
    { label: 'Tiba di Pelabuhan', desc: 'Kargo ikan siap diambil di pelabuhan tujuan', isDone: status === 'arrived' || status === 'delivered', key: 'arrived' },
    { label: 'Barang Diterima', desc: 'Transaksi selesai & dana dirilis ke nelayan', isDone: status === 'delivered', key: 'delivered' },
  ];

  return (
    <div className={styles.all}>
      <Navbar />

      <main className={styles.mainContainer}>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            <button onClick={() => router.back()} className={styles.backLink}>
              <ArrowLeft size={18} /> Kembali ke Histori Lelang
            </button>
            <h1 className={styles.pageTitle}>Lacak Pengiriman Kargo Ikan</h1>
            <p className={styles.pageSubtitle}>Pantau status perjalanan produk lelang yang Anda menangkan.</p>
          </div>

          <div className={styles.contentGrid}>
            {/* Kolom Kiri: Info Ikan & Timeline Tracking */}
            <div className={styles.leftCol}>
              {/* Card Ikan */}
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
                    <span className={styles.badgeWon}>Dimenangkan</span>
                    <h2 className={styles.fishName}>{auction.name}</h2>
                    <div className={styles.tagGrid}>
                      <span className={styles.tag}>Grade {auction.grade || 'A'}</span>
                      <span className={styles.tag}>{auction.weight_kg} KG</span>
                    </div>
                  </div>
                </div>
                <p className={styles.description}>
                  Selamat atas kemenangan lelang Anda! Kami menjamin kesegaran ikan tetap terjaga menggunakan protokol rantai dingin yang ketat selama pengiriman logistik laut.
                </p>
              </div>

              {/* Card Timeline Pelacakan */}
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Status Pengiriman Real-Time</h3>
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

            {/* Kolom Kanan: Rincian & Interaksi Alamat */}
            <div className={styles.rightCol}>
              {/* Ringkasan Pembayaran & Seller */}
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>Detail Transaksi</h3>
                
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Harga Pembelian</span>
                  <span className={styles.priceValue}>
                    {finalPrice.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                  </span>
                </div>

                <div className={styles.divider} />

                <div className={styles.sellerInfoRow}>
                  <div className={styles.avatarCircle}>
                    <User size={20} />
                  </div>
                  <div>
                    <span className={styles.infoLabel}>Nelayan Penjual</span>
                    <h4 className={styles.sellerName}>
                      {seller?.full_name || 'Nelayan Terverifikasi'}{' '}
                      {seller?.verified && <ShieldCheck size={14} className={styles.verifiedIcon} />}
                    </h4>
                    <p className={styles.sellerVessel}>KM {seller?.vessel_name || 'Kapal Nelayan'}</p>
                  </div>
                </div>
              </div>

              {/* Rute & Alamat Pengiriman */}
              <div className={styles.card}>
                <div className={styles.cardHeaderWithAction}>
                  <h3 className={styles.cardTitle}>Rincian Logistik</h3>
                  
                  {status === 'pending' && !isEditingAddress && (
                    <button
                      onClick={() => setIsEditingAddress(true)}
                      className={styles.editAddressBtn}
                    >
                      <Edit3 size={14} /> Ubah Alamat
                    </button>
                  )}
                </div>

                {isEditingAddress ? (
                  <div className={styles.addressEditBox}>
                    <textarea
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      className={styles.addressTextArea}
                      placeholder="Masukkan alamat pengiriman lengkap Anda..."
                      rows={3}
                    />
                    <div className={styles.editActionsGrid}>
                      <button
                        onClick={handleUpdateAddress}
                        disabled={actionLoading}
                        className={styles.saveBtn}
                      >
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
                      {logistics.estimated_arrival ? new Date(logistics.estimated_arrival).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      }) : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Buyer Confirmation Box */}
              <div className={styles.card} style={{ border: '1.5px solid var(--clr-primary-light)', background: 'var(--clr-primary-lightest)' }}>
                <h3 className={styles.cardTitle}>Konfirmasi Penerimaan</h3>
                
                {status === 'pending' && (
                  <div className={styles.statusBoxInfo}>
                    <Clock size={16} />
                    <span>Menunggu kapal kargo logistik nelayan berangkat dari dermaga asal.</span>
                  </div>
                )}

                {status === 'shipped' && (
                  <div className={styles.statusBoxInfo}>
                    <Truck size={16} />
                    <span>Kargo sedang dalam pelayaran menuju alamat pengiriman Anda.</span>
                  </div>
                )}

                {status === 'arrived' && (
                  <div>
                    <p className={styles.controlHint}>
                      Kapal logistik telah tiba di pelabuhan tujuan. Silakan periksa kesegaran tangkapan kargo ikan Anda sebelum mengonfirmasi penerimaan barang.
                    </p>
                    <button
                      onClick={handleConfirmReceipt}
                      disabled={actionLoading}
                      className={styles.primaryActionBtn}
                    >
                      {actionLoading ? <Loader2 className="animate-spin" size={18} /> : 'Konfirmasi Barang Diterima'}
                    </button>
                  </div>
                )}

                {status === 'delivered' && (
                  <div className={styles.statusBoxSuccess}>
                    <CheckCircle2 size={16} />
                    <span>Anda telah mengonfirmasi penerimaan barang. Transaksi selesai!</span>
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
