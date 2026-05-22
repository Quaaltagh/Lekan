'use client';

import {
  Download, ArrowLeft, ShieldCheck, QrCode, Loader2, AlertCircle
} from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import styles from './page.module.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getInvoice, InvoiceData } from '@/services/invoiceService';

/* ─── Formatters ─── */
const formatIDR = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

/* ─── Component ─── */
export default function InvoicePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, token, isLoading } = useAuth();

  const printRef = React.useRef<HTMLDivElement>(null);

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  /* ─── Fetch ─── */
  const fetchInvoice = useCallback(async () => {
    if (!id || !token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getInvoice(id, token);
      setInvoice(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat invoice.');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.push('/'); return; }
    if (!id) {
      setError('ID lelang tidak ditemukan. Buka invoice dari halaman histori lelang.');
      setLoading(false);
      return;
    }
    fetchInvoice();
  }, [user, isLoading, id, fetchInvoice, router]);

  /* ─── Download PDF ─── */
  const handleDownloadPdf = async () => {
    const element = printRef.current;
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2 });
    const data   = canvas.toDataURL('image/png');
    const pdf    = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });

    const imgProperties = pdf.getImageProperties(data);
    const pdfWidth      = pdf.internal.pageSize.getWidth();
    const pdfHeight     = (imgProperties.height * pdfWidth) / imgProperties.width;

    pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`invoice-${invoice?.invoice_number ?? 'lekan'}.pdf`);
  };

  /* ─── Derived values ─── */
  const perKg = invoice
    ? invoice.financials.subtotal / invoice.auction.weight_kg
    : 0;

  /* ─── Render: Loading ─── */
  if (loading) {
    return (
      <div className={styles.all}>
        <Navbar />
        <div className={styles.stateWrapper}>
          <Loader2 size={36} className="animate-spin" style={{ color: 'var(--clr-primary)' }} />
          <p>Memuat invoice...</p>
        </div>
      </div>
    );
  }

  /* ─── Render: Error ─── */
  if (error || !invoice) {
    return (
      <div className={styles.all}>
        <Navbar />
        <div className={styles.stateWrapper}>
          <AlertCircle size={36} color="#ef4444" />
          <p className={styles.errorText}>{error || 'Invoice tidak ditemukan.'}</p>
          <button onClick={() => router.back()} className={styles.backBtn}>
            <ArrowLeft size={15} /> Kembali
          </button>
        </div>
      </div>
    );
  }

  /* ─── Render: Invoice ─── */
  return (
    <div className={styles.all}>
      <Navbar />
      <div className={styles.container}>

        {/* Title bar */}
        <div className={styles.titlewrapper}>
          <div className={styles.titleSection}>
            <button onClick={() => router.back()} className={styles.backLink}>
              <ArrowLeft size={18} /> Kembali ke Histori Lelang
            </button>
            <h1 className={styles.title}>Faktur</h1>
          </div>

          <div className={styles.actions}>
            <button className={styles.downloadBtn} onClick={handleDownloadPdf}>
              <Download className={styles.icon} />
              Unduh PDF
            </button>
          </div>
        </div>

        {/* Printable card */}
        <div ref={printRef} className={styles.card}>
          <div className={styles.topStrip} />

          <div className={styles.content}>

            {/* Meta Info */}
            <div className={styles.metaWrapper}>
              <div className={styles.leftMeta}>
                <div>
                  <span className={invoice.status === 'paid' ? styles.paidBadge : styles.unpaidBadge}>
                    • {invoice.status === 'paid' ? 'LUNAS' : 'BELUM LUNAS'}
                  </span>
                  <span className={styles.label}>Nomor Faktur</span>
                  <h3 className={styles.invoiceNumber}>#{invoice.invoice_number}</h3>
                </div>
              </div>

              <div className={styles.rightMeta}>
                <div className={styles.metaBlock}>
                  <span className={styles.label}>Tanggal Transaksi</span>
                  <p className={styles.date}>{formatDateTime(invoice.created_at)}</p>
                </div>

                <div className={styles.metaBlock}>
                  <span className={styles.label}>Ditagihkan Ke</span>
                  <h4 className={styles.name}>
                    {invoice.winner?.full_name ?? user?.email ?? '-'}
                  </h4>
                  {invoice.winner?.verified && (
                    <p className={styles.subText}>Pembeli Terverifikasi</p>
                  )}
                </div>
              </div>
            </div>

            {/* Item table */}
            <div className={styles.tablewrapper}>
              <div className={styles.headerRow}>
                <span className={styles.label}>Deskripsi Item</span>
                <span className={styles.label}>Harga Akhir</span>
              </div>

              <div className={styles.itemRow}>
                {/* Left */}
                <div className={styles.tableleft}>
                  <div className={styles.imageBox}>
                    <img
                      src={invoice.auction.image_url || '/fish-placeholder.jpg'}
                      alt={invoice.auction.name}
                      className={styles.image}
                      onError={e => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" fill="%230f172a"/></svg>';
                      }}
                    />
                  </div>

                  <div>
                    <h5 className={styles.itemtitle}>{invoice.auction.name}</h5>
                    <p className={styles.itemsubtitle}>
                      Berat: {invoice.auction.weight_kg} KG
                      {invoice.auction.grade ? ` • Kelas: ${invoice.auction.grade}` : ''}
                      {invoice.auction.species ? ` • ${invoice.auction.species}` : ''}
                    </p>
                    {invoice.seller && (
                      <p className={styles.itemsubtitle}>
                        Nelayan: {invoice.seller.full_name}
                        {invoice.seller.vessel_name ? ` • KM ${invoice.seller.vessel_name}` : ''}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right */}
                <div className={styles.tableright}>
                  <span className={styles.itemprice}>{formatIDR(invoice.financials.subtotal)}</span>
                  <p className={styles.itemunitPrice}>
                    {formatIDR(Math.round(perKg))} / KG
                  </p>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className={styles.sumwrapper}>
              <div className={styles.sumbox}>
                <div className={styles.sumrow}>
                  <span className={styles.labelMuted}>Subtotal</span>
                  <span className={styles.sumvalue}>{formatIDR(invoice.financials.subtotal)}</span>
                </div>

                <div className={styles.sumrow}>
                  <span className={styles.labelMuted}>Biaya Platform Lelang (2%)</span>
                  <span className={styles.sumvalue}>{formatIDR(invoice.financials.platform_fee)}</span>
                </div>

                <div className={styles.sumrow}>
                  <span className={styles.labelMuted}>Logistik & Penanganan</span>
                  <span className={styles.sumvalue}>
                    {invoice.financials.logistics_fee > 0
                      ? formatIDR(invoice.financials.logistics_fee)
                      : 'Gratis'}
                  </span>
                </div>

                <div className={styles.divider} />

                <div className={styles.totalRow}>
                  <div>
                    <span className={styles.totalLabel}>Total Keseluruhan</span>
                    <span className={styles.vat}>Termasuk PPN</span>
                  </div>
                  <span className={styles.totalValue}>{formatIDR(invoice.financials.grand_total)}</span>
                </div>
              </div>
            </div>

            {/* Logistics info (if available) */}
            {invoice.logistics && (
              <div className={styles.logisticsRow}>
                <span className={styles.label}>Info Pengiriman</span>
                <p className={styles.logisticsText}>
                  {invoice.logistics.courier ?? '-'}
                  {invoice.logistics.tracking_number
                    ? ` • Resi: ${invoice.logistics.tracking_number}`
                    : ''}
                  {invoice.logistics.pickup_address
                    ? ` • Asal: ${invoice.logistics.pickup_address}`
                    : ''}
                  {invoice.logistics.delivery_address
                    ? ` → ${invoice.logistics.delivery_address}`
                    : ''}
                </p>
              </div>
            )}

            {/* Verification footer */}
            <div className={styles.verifwrapper}>
              <div className={styles.verifleft}>
                <ShieldCheck className={styles.verificon} />
                <p className={styles.veriftext}>
                  Transaksi ini diamankan dan diverifikasi oleh Protokol Ledger Lekan Exchange.
                </p>
              </div>

              <div className={styles.verifright}>
                <QrCode className={styles.qrIcon} />
                <div className={styles.verifmeta}>
                  <span className={styles.verifmetaLabel}>ID Transaksi</span>
                  <span className={styles.verifhash}>
                    {invoice.invoice_number}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}