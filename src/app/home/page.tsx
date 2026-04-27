'use client';
import React from 'react';
import { LayoutDashboard, Radio, History, Ship, Settings, Bell, Wallet, Search, Plus } from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import Filter from '@/app/components/Filters';
import AuctionCard from '@/app/components/AuctionCard';
import styles from './page.module.css';

import '@/app/globals.css';
const AUCTIONS = [
  {
    id: '1',
    name: 'Tuna Sirip Kuning',
    image: 'https://darilaut.id/wp-content/uploads/2021/09/Tuna-3.jpg',
    weight: '12Kg',
    grade: 'A+',
    startingPrice: '2.400.000',
    highestBid: '3.150.000',
    timeLeft: '02:14:55'
  },
  {
    id: '2',
    name: 'Kakap Merah',
    image: 'https://puloampel-puloampel.desa.id/wp-content/uploads/2023/09/Kakap_merah.jpg',
    weight: '8Kg',
    grade: 'Premium',
    vessel: 'BlueWave',
    startingPrice: '850.000',
    highestBid: '1.200.000',
    timeLeft: '00:45:12'
  },
  {
    id: '3',
    name: 'Lobster',
    image: 'https://pict.sindonews.net/dyn/732/pena/news/2020/07/26/713/113940/harga-lobster-anjlok-nelayan-di-pangkep-enggan-jual-hasil-panen-kff.jpg',
    weight: '3.5Kg',
    grade: 'Grade-B',
    origin: 'Bali',
    startingPrice: '5.000.000',
    highestBid: '6.450.000',
    timeLeft: '05:22:10'
  },
  {
    id: '4',
    name: 'Ikan Tenggiri',
    image: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?q=80&w=1000&auto=format&fit=crop',
    weight: '40Kg',
    grade: 'Export',
    origin: 'Jakarta',
    startingPrice: '1.200.000',
    highestBid: '1.450.000',
    timeLeft: '01:10:05'
  },
  {
    id: '5',
    name: 'Ikan Tenggiri',
    image: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?q=80&w=1000&auto=format&fit=crop',
    weight: '40Kg',
    grade: 'Export',
    origin: 'Jakarta',
    startingPrice: '1.200.000',
    highestBid: '1.450.000',
    timeLeft: '01:10:05'
  },
  {
    id: '6',
    name: 'Tuna Sirip Kuning',
    image: 'https://darilaut.id/wp-content/uploads/2021/09/Tuna-3.jpg',
    weight: '12Kg',
    grade: 'A+',
    startingPrice: '2.400.000',
    highestBid: '3.150.000',
    timeLeft: '02:14:55'
  },
  {
    id: '7',
    name: 'Kakap Merah',
    image: 'https://puloampel-puloampel.desa.id/wp-content/uploads/2023/09/Kakap_merah.jpg',
    weight: '8Kg',
    grade: 'Premium',
    vessel: 'BlueWave',
    startingPrice: '850.000',
    highestBid: '1.200.000',
    timeLeft: '00:45:12'
  },
  {
    id: '8',
    name: 'Lobster',
    image: 'https://pict.sindonews.net/dyn/732/pena/news/2020/07/26/713/113940/harga-lobster-anjlok-nelayan-di-pangkep-enggan-jual-hasil-panen-kff.jpg',
    weight: '3.5Kg',
    grade: 'Grade-B',
    origin: 'Bali',
    startingPrice: '5.000.000',
    highestBid: '6.450.000',
    timeLeft: '05:22:10'
  },
];


export default function BrowseAuctions() {
  return(
    <>
    <div className={styles.all}>
      <Navbar />
      <div className={styles.container}>
    
        <div className={styles.banner}>
          
        </div>

        <Filter />
        
        <div className={styles.card}>
          {AUCTIONS.map((auction) => (
            <AuctionCard key={auction.id} {...auction} />
          ))}
        </div>
      </div>
        
    </div>
    
    </>
  );
}