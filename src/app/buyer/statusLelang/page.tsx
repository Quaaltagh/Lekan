'use client';
import React from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import styles from './page.module.css';
import { useState } from 'react';

interface ActiveBidProps {
  id: string;
  name: string;
  lot: string;
  weight: string;
  image: string;
  highestBid: string;
  yourBid: string;
  status: 'winning' | 'outbid';
  timeRemaining: string;
}

function BidCard({ name, lot, weight, image, highestBid, yourBid, status, timeRemaining }: ActiveBidProps) {
  const isWinning = status === 'winning';
    return(
        <div className={styles.card}>
            <div className={styles.imageContainer}>
                <div className={styles.badgeWrapper}>
                    <span className={styles.liveBadge}>
                        <span className={styles.pulseDot}></span>
                        Live
                    </span>
                </div>

                <div className={styles.wrapper}>
                    <span className={`${styles.cardbadge} ${isWinning ? styles.winning : styles.losing}`}>
                        {isWinning ? ( <TrendingUp className={styles.icon} />) : (<AlertCircle className={styles.icon} />)}
                        {status}
                    </span>
                </div>

                <img src={image} className={styles.image} alt={name}/>

            </div>
            
            <div className={styles.cardcontainer}>
                <div className={styles.name}>
                    <h3 className={styles.cardtitle}>{name}</h3>
                    <p className={styles.cardmeta}>
                    LOT #{lot} • {weight}
                    </p>
                </div>
                
                <div className={styles.bid}>
                    <div className= {`${styles.contentcard} ${isWinning ? styles.cardNeutral : styles.cardLosing}`}>
                        {/* Highest Bid */}
                        <div className={styles.bidcontent}>
                            <span className={`${styles.label} ${isWinning ? styles.cardNeutral : styles.cardLosing}`}>Highest Bid</span>

                            <span className={`${styles.value} ${isWinning ? styles.cardNeutral : styles.cardLosing}`}>Rp {highestBid}</span>
                        </div>

                        <div className={styles.divider}></div>    

                        {/* Your Bid */}
                        <div className={styles.bidcontent}>
                            <span className={`${styles.label} ${isWinning ? styles.labelNeutral : styles.labelLosing}`}> Your Bid</span>

                            <span className={`${styles.value} ${isWinning ? styles.valueYourWin : styles.valueYourLose}`}>Rp {yourBid} </span>
                        </div>
                        
                    
                    </div>

                </div>

                <div className={styles.timercontainer}>
                    <div>
                        <div className={styles.timerheader}>
                        <span className={styles.timerlabel}>Time Remaining</span>
                        <span className={styles.time}>{timeRemaining}</span>
                        </div>

                        <div className={styles.timerprogressBar}>
                        <div className={ styles.progressFill}/>
                        </div>
                    </div>

                    <button
                        className={ `${styles.button} ${ isWinning ? styles.buttonWin : styles.buttonLose}`}>
                        {isWinning ? 'View Detail' : 'Bid Now'}
                    </button>
                </div>
            </div>
               
            
        </div>
    );
}

export default function StatusLelang() {
const [activeMenu, setActiveMenu] = useState('status');

  const activeBids: ActiveBidProps[] = [
    {
      id: '1',
      name: 'Premium Yellowfin Tuna',
      lot: 'YF-842',
      weight: '85KG',
      image: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?q=80&w=400&auto=format&fit=crop',
      highestBid: '12.5M',
      yourBid: '12.5M',
      status: 'winning',
      timeRemaining: '04:12'
    },
    {
        id: '2',
      name: 'Premium Yellowfin Tuna',
      lot: 'YF-842',
      weight: '85KG',
      image: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?q=80&w=400&auto=format&fit=crop',
      highestBid: '12.5M',
      yourBid: '12.5M',
      status: 'winning',
      timeRemaining: '04:12'
    },
    {
      id: '3',
      name: 'Blue Marlin (Grade A)',
      lot: 'BM-102',
      weight: '120KG',
      image: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?q=80&w=400&auto=format&fit=crop',
      highestBid: '18.2M',
      yourBid: '17.5M',
      status: 'outbid',
      timeRemaining: '12:45'
    }
  ];
  return(
    <>
    <div className={styles.all}>
      <Navbar />
      <div className={styles.container}>
            <div className={styles.titlecontainer}>
                <h1 className={styles.title}>Status Lelang</h1>
                <p className={styles.titledescription}>
                    Monitor your active bids and watched auctions in real-time. Ensure your capital is deployed effectively.
                </p>
            </div>

            <div className={styles.contentcontainer}>
                <div className={styles.contentheader}>
                    <h2 className={styles.contenttitle}>Active Bids</h2>
                    <span className={styles.badge}>3 Active</span>
                </div>

                <div className={styles.grid}>
                    {activeBids.map(bid => (
                    <BidCard key={bid.id} {...bid} />
                    ))}
                </div>
         </div>
      </div>
    </div>
  </>
  );
}