'use client';
import { Download, ArrowLeft, LayoutDashboard, Bell, Wallet, ShieldCheck, QrCode } from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import styles from './page.module.css';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import React from "react";
import { useRouter } from 'next/navigation';

export default function Invoice() {
    const router = useRouter();
    const printRef = React.useRef(null);
    const handleDownloadPdf = async () => {
        const element = printRef.current;
        console.log(element)
        if (!element) {
            return;
        }


        const canvas = await html2canvas(element, {
            scale: 2,
            });

        const data = canvas.toDataURL("image/png");

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "px",
            format: "a4",
    });

    const imgProperties = pdf.getImageProperties(data);
    const pdfWidth = pdf.internal.pageSize.getWidth();

    const pdfHeight = (imgProperties.height * pdfWidth) / imgProperties.width;

    pdf.addImage(data, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("invoice.pdf");
    };
  return(
    <>
    <div className={styles.all}>
        <Navbar />
        <div className={styles.container}>

            <div className={styles.titlewrapper}>
                <div className={styles.titleSection}>
                    <button onClick={() => router.back()} className={styles.backLink}>
                            <ArrowLeft size={18} /> Kembali ke Histori Lelang
                          </button>
                    {/* <span className={styles.tag}>Catatan Transaksi</span> */}

                    <h1 className={styles.title}>
                    Faktur
                    </h1>
                </div>

                <div className={styles.actions} onClick={handleDownloadPdf}>
                    <button className={styles.downloadBtn}>
                    <Download className={styles.icon} />
                    Unduh PDF
                    </button>
                </div>
            </div>

            <div ref={printRef} className={styles.card}>
                <div className={styles.topStrip} />

                <div className={styles.content}>
                    {/* Meta Info */}
                    <div className={styles.metaWrapper}>
                        <div className={styles.leftMeta}>
                            <div>
                                <span className={styles.paidBadge}>• LUNAS</span>

                                <span className={styles.label}>Nomor Faktur</span>
                                <h3 className={styles.invoiceNumber}>#ME-2024-88492</h3>
                            </div>
                        </div>

                        <div className={styles.rightMeta}>
                            <div className={styles.metaBlock}>
                                <span className={styles.label}>Tanggal Transaksi</span>
                                <p className={styles.date}>24 Oktober 2023 • 14:32 GMT</p>
                                </div>

                                <div className={styles.metaBlock}>
                                <span className={styles.label}>Ditagihkan Ke</span>
                                <h4 className={styles.name}>Kapten Sam</h4>
                                <p className={styles.subText}>Pedagang Terverifikasi #9921</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.tablewrapper}>
                        {/* Header */}
                        <div className={styles.headerRow}>
                            <span className={styles.label}>Deskripsi Item</span>
                            <span className={styles.label}>Harga Akhir</span>
                        </div>

                        {/* Content */}
                        <div className={styles.itemRow}>
                            {/* Left */}
                            <div className={styles.tableleft}>
                            <div className={styles.imageBox}>
                                <img
                                src="https://pict.sindonews.net/dyn/732/pena/news/2020/07/26/713/113940/harga-lobster-anjlok-nelayan-di-pangkep-enggan-jual-hasil-panen-kff.jpg"
                                alt="Product"
                                className={styles.image}
                                />
                            </div>

                            <div>
                                <h5 className={styles.itemtitle}>
                                Premium Atlantic Bluefin Tuna
                                </h5>

                                <p className={styles.itemsubtitle}>
                                Berat: 43,5 KG • Kelas: A+
                                </p>
                            </div>
                            </div>

                            {/* Right */}
                            <div className={styles.tableright}>
                            <span className={styles.itemprice}>Rp 12,450,000</span>
                            <p className={styles.itemunitPrice}>Rp 282,9400 / KG</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.sumwrapper}>
                        <div className={styles.sumbox}>
                            {/* Subtotal */}
                            <div className={styles.sumrow}>
                                <span className={styles.labelMuted}>Subtotal</span>
                                <span className={styles.sumvalue}>Rp 12.450.000</span>
                            </div>

                            {/* Fee */}
                            <div className={styles.sumrow}>
                                <span className={styles.labelMuted}>
                                    Biaya Platform Lelang (2%)
                                </span>
                                <span className={styles.sumvalue}>Rp 249.000</span>
                            </div>

                            {/* Logistics */}
                            <div className={styles.sumrow}>
                                <span className={styles.labelMuted}>Logistik & Penanganan</span>
                                <span className={styles.sumvalue}>Rp 120.000</span>
                            </div>

                            <div className={styles.divider} />

                            {/* Grand Total */}
                            <div className={styles.totalRow}>
                                <div>
                                    <span className={styles.totalLabel}>Total Keseluruhan</span>
                                    <span className={styles.vat}>Termasuk PPN</span>
                                </div>

                                <span className={styles.totalValue}>
                                    Rp 12.819.000
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.verifwrapper}>
                        {/* Left */}
                        <div className={styles.verifleft}>
                            <ShieldCheck className={styles.verificon} />

                            <p className={styles.veriftext}>
                            Transaksi ini diamankan dan diverifikasi oleh Protokol Ledger Lekan Exchange.
                            </p>
                        </div>

                        {/* Right */}
                        <div className={styles.verifright}>
                            <QrCode className={styles.qrIcon} />

                            <div className={styles.verifmeta}>
                                <span className={styles.verifmetaLabel}>Sidik Jari Digital</span>
                                <span className={styles.verifhash}>
                                    SHA-256: 8F2A...C3FD
                                </span>
                            </div>
                        </div>
                    </div>

                </div>

                
                
            </div>

            {/* <div className={styles.backwrapper}>
                <button className={styles.backbutton}>
                    <ArrowLeft className={styles.backicon} />
                    Kembali ke Riwayat Transaksi
                </button>
            </div> */}

        </div>
    </div>
    </>
    );
}