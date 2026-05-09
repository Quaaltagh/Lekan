'use client';

import React from 'react';
import styles from './page.module.css';
import SideFisherman from '../../components/sideFisherman';
import NavbarFisherman from '../../components/NavbarFisherman';
import { Fish } from 'lucide-react';
import { useSellerAuctions } from '@/hooks/useSellerAuctions';

function TransactionItem({ item }: any) {
  return (
    <tr>
      <td>
        <div className={styles.fishCell}>

          <div className={styles.imagePlaceholder}>
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <Fish size={24} color="#94a3b8" />
            )}
          </div>

          <div>
            <strong>{item.name}</strong>

            <p>
              {item.grade || 'STANDARD'} • {item.weight_kg}KG
            </p>
          </div>

        </div>
      </td>

      <td>
        {new Date(item.ends_at).toLocaleDateString('id-ID')}
      </td>

      <td>
        Marketplace Buyer
      </td>

      <td className={styles.price}>
        {item.current_bid
          ? `Rp ${item.current_bid.toLocaleString('id-ID')}`
          : `Rp ${item.start_price.toLocaleString('id-ID')}`}
      </td>

      <td>
        <span
          className={`${styles.status} ${
            styles[item.status]
          }`}
        >
          ● {item.status.toUpperCase()}
        </span>
      </td>

      <td>
        <button className={styles.detailBtn}>
          View Detail
        </button>
      </td>
    </tr>
  );
}

export default function AuctionHistory() {

  // DATA REALTIME DARI DATABASE
  const { auctions, loading, error } = useSellerAuctions();

  // TAMPILKAN SEMUA STATUS TERMASUK ACTIVE
  const historyAuctions = auctions;

  return (
    <div className={styles.container}>

      <SideFisherman />

      <main className={styles.mainContent}>

        <NavbarFisherman />

        <div className={styles.content}>

          <section className={styles.titleSection}>
            <h1>Histori Lelang</h1>

            <p className={styles.subtitle}>
              Riwayat seluruh transaksi hasil laut Anda.
            </p>
          </section>

          {/* ERROR */}
          {error && (
            <div
              style={{
                background: '#fef2f2',
                color: '#dc2626',
                padding: '1rem',
                borderRadius: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              {error}
            </div>
          )}

          <section className={styles.tableContainer}>

            <table className={styles.table}>

              <thead>
                <tr>
                  <th>SPESIES IKAN</th>
                  <th>TANGGAL TRANSAKSI</th>
                  <th>PEMBELI</th>
                  <th>HARGA AKHIR</th>
                  <th>STATUS</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>

                {loading ? (

                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: 'center',
                        padding: '2rem',
                      }}
                    >
                      Loading...
                    </td>
                  </tr>

                ) : historyAuctions.length === 0 ? (

                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: 'center',
                        padding: '2rem',
                      }}
                    >
                      Belum ada histori lelang
                    </td>
                  </tr>

                ) : (

                  historyAuctions.map((item) => (
                    <TransactionItem
                      key={item.id}
                      item={item}
                    />
                  ))

                )}

              </tbody>

            </table>

          </section>

        </div>

      </main>

    </div>
  );
}