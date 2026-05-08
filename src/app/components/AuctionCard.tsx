'use client'
import { Clock } from 'lucide-react';
import Link from 'next/link';
import styles from './AuctionCard.module.css';

interface AuctionCardProps {
  id: string;
  name: string;
  image: string;
  weight: string;
  grade: string;
  origin?: string;
  startingPrice: string;
  highestBid: string;
  timeLeft: string;
}

export default function AuctionCard({
  id,
  name,
  image,
  weight,
  grade,
  origin,
  startingPrice,
  highestBid,
  timeLeft
}: AuctionCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <span className={styles.liveBadge}>
            <span className={styles.dot}></span>
            Live Now
          </span>
        </div>

        <img src={image} alt={name} className={styles.image} />

        <div className={styles.timeBox}>
          <Clock size={14} />
          {timeLeft}
        </div>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{name}</h3>

        <div className={styles.metaRow}>
          <div className={styles.metaBoxBlue}>
            <div className={styles.label}>Berat</div>
            <div className={styles.value}>{weight}</div>
          </div>

          <div className={styles.metaBoxBlue}>
            <div className={styles.label}>Kelas</div>
            <div className={styles.value}>{grade}</div>
          </div>

          {origin && (
            <div className={styles.metaBoxGray}>
              <div className={styles.label}>Pelabuhan</div>
              <div className={styles.value}>{origin}</div>
            </div>
          )}
        </div>

        <div className={styles.priceRow}>
          <div>
            <small>Harga Dasar</small>
            <div>Rp {startingPrice}</div>
          </div>
          <div>
            <small>Bid Tertinggi</small>
            <div>Rp {highestBid}</div>
          </div>
        </div>

        {/* Pakai id dari database */}
        <Link href={`/buyer/auction/${id}`} className={styles.button}>
          Lihat Detail
        </Link>
      </div>
    </div>
  );
}