'use client'
import { ArrowLeft, Clock, ShieldCheck, Truck, MessageSquare, Info, AlertCircle,Bell,Wallet} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Navbar from '@/app/components/Navbar';
import styles from './page.module.css';

interface BidEntry {
  id: string;
  bidder: string;
  time: string;
  amount: string;
  isHighest?: boolean;
}

const BID_HISTORY: BidEntry[] = [
  { id: '1', bidder: 'Aris Munandar', time: '02:14:15', amount: '5.250.000', isHighest: true },
  { id: '2', bidder: 'Budi Santoso', time: '02:10:42', amount: '5.100.000' },
  { id: '3', bidder: 'Hendra Wijaya', time: '02:08:12', amount: '5.000.000' },
  { id: '4', bidder: 'Rina Melati', time: '02:05:55', amount: '4.950.000' },
];

export default function AuctionDetail({ onBack }: { onBack: () => void }) {
  const tags = ['SUSTAINABLE', 'SASHIMI GRADE', 'VERIFIED SELLER'];
  const [bidAmount, setBidAmount] = useState('5.300.000');
  const walletBalance = 1450000;
  const currentBidNumeric = 5250000;
  const bidAmountNumeric = parseInt(bidAmount.replace(/\./g, '')) || 0;
  const isInsufficient = walletBalance < bidAmountNumeric;

  return (
    <div className={styles.all}>
      <Navbar />

        <main className={styles.mainContainer}>

            <div className={styles.container}>
                <div className={styles.mainContent}>
                    
                    <div className={styles.imageContainer}>
                        <div className={styles.badgeWrapper}>
                            <span className={styles.liveBadge}>
                            <span className={styles.dot}></span>
                            Live Now
                            </span>
                        </div>

                        <img 
                            src="https://pict.sindonews.net/dyn/732/pena/news/2020/07/26/713/113940/harga-lobster-anjlok-nelayan-di-pangkep-enggan-jual-hasil-panen-kff.jpg" 
                            alt="Fish Auction Item"
                            className={styles.image}
                        />
                    </div>

                    <div className={styles.headerContainer}>
      
                        <div className={styles.titleWrapper}>
                            <h1 className={styles.title}>
                            Tuna Sirip Kuning Grade A
                            </h1>
                            <p className={styles.subtitle}>
                            Banda Sea, South Maluku • Caught 6 hours ago
                            </p>
                        </div>

                        <div className={styles.weightBox}>
                            <span className={styles.weightLabel}>Berat</span>
                            <span className={styles.weightValue}>
                            20.5 <span className={styles.unit}>KG</span>
                            </span>
                        </div>

                    </div>

                    <div className={styles.tagContainer}>
                    {tags.map(tag => (
                        <span key={tag} className={styles.tag}>
                        {tag}
                        </span>
                    ))}
                    </div>

                    <p className={styles.descriptionText}>
                        Exceptional quality Yellowfin Tuna, hand-line caught in the deep waters of the Banda Sea. This specimen features a vibrant red flesh with perfect marbling, ideal for premium sashimi. The fish has been processed following strict cold-chain protocols immediately upon harvest to ensure peak freshness and texture integrity.
                    </p>
                    
                    {/* bid history */}
                    <div>
                        <div className={styles.bidheader}>
                            <h3 className={styles.bidtitle}>Bid History</h3>
                            <span className={styles.bidtotalBids}>14 Total Bids</span>
                        </div>

                        <div className={styles.bidtable}>
                            <div className={styles.bidtableHeader}>
                                <span>Bidder</span>
                                <span>Time</span>
                                <span>Amount</span>
                            </div>

                            {BID_HISTORY.map((bid) => (
                            <div
                                key={bid.id}
                                className={`${styles.row} ${
                                bid.isHighest ? styles.rowHighest : styles.rowHover
                                }`}
                            >
                                <div className={styles.bidderInfo}>
                                <div className={styles.avatar}>
                                    {bid.bidder.split(' ').map(n => n[0]).join('')}
                                </div>

                                <div className={styles.bidderNameWrapper}>
                                    <span className={styles.bidderName}>{bid.bidder}</span>
                                    {bid.isHighest && (
                                    <span className={styles.highestBadge}>Highest</span>
                                    )}
                                </div>
                                </div>

                                <div className={styles.time}>
                                {bid.time}
                                </div>

                                <div className={styles.amountWrapper}>
                                <span className={styles.currency}>Rp</span>
                                <span
                                    className={
                                    bid.isHighest
                                        ? styles.amountHighest
                                        : styles.amountNormal
                                    }
                                >
                                    {bid.amount}
                                </span>
                                </div>
                            </div>
                            ))}
                        </div>
                    </div>
                </div>
            
            {/* yang kanan */}
            <div className={styles.rightwrapper}>
                <div className={styles.rightcard}>

                    <div>
                    <span className={styles.rightlabel}>
                        Current Highest Bid
                    </span>

                    <div className={styles.priceRow}>
                        <span className={styles.currency}>Rp</span>
                        <span className={styles.price}>5.250.000</span>
                    </div>
                    </div>

                    <div className={styles.timerCard}>
                        <div>
                            <span className={styles.timerLabel}>
                            Time Remaining
                            </span>
                            <span className={styles.timerValue}>
                            02:15:30
                            </span>
                        </div>

                        <div className={styles.iconWrapper}>
                            <Clock className={styles.icon} />
                        </div>
                    </div>

                    <div>
                        <label className={styles.inputlabel}>
                            Your Bid Amount
                        </label>

                        <div className={styles.inputWrapper}>
                            <span className={styles.inputcurrency}>Rp</span>

                            <input 
                            type="text" 
                            placeholder={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            className={styles.input}
                            />
                        </div>

                        <p className={styles.hint}>
                            Minimum bid increment: Rp 50.000
                        </p>
                    </div>

                    <button className={styles.button}>
                        Tawar Sekarang
                    </button>

                    <div className={styles.devide}></div>

                    <div className={styles.walletcontainer}>
      
                        <div className={styles.balanceRow}>
                            <span className={styles.balanceLabel}>
                            Your Wallet Balance
                            </span>
                            <span className={styles.balanceValue}>
                            Rp 1.450.000
                            </span>
                        </div>

                        {isInsufficient && (
                            <div className={styles.warningBox}>
                            <AlertCircle className={styles.warningIcon} />
                            <span className={styles.warningText}>
                                Insufficient balance for this bid.
                            </span>
                            </div>
                        )}

                        <button className={styles.depositButton}>
                            Deposit Saldo
                        </button>

                    </div>



                </div>

                <div className={styles.sellercard}>

                    <div className={styles.sellerleft}>
                        <div className={styles.selleravatarWrapper}>
                        <img 
                            src="https://pict.sindonews.net/dyn/732/pena/news/2020/07/26/713/113940/harga-lobster-anjlok-nelayan-di-pangkep-enggan-jual-hasil-panen-kff.jpg" 
                            alt="seller" 
                            className={styles.selleravatarImg}
                        />
                        </div>

                        <div>
                        <span className={styles.sellerlabel}>Seller</span>

                        <h5 className={styles.sellername}>
                            Captain Sam
                            <ShieldCheck className={styles.verifiedIcon} />
                        </h5>

                        <p className={styles.sellermeta}>
                            Verified Merchant • 1.2k Sold
                        </p>
                        </div>
                    </div>

                    <button className={styles.chatButton}>
                        <MessageSquare className={styles.chatIcon} />
                    </button>

                </div>

                <div className={styles.icongrid}>
      
                    <div className={styles.iconcard}>
                        <ShieldCheck className={styles.icon} />
                        <span className={styles.text}>
                        Payment Held in Escrow
                        </span>
                    </div>

                    <div className={styles.iconcard}>
                        <Truck className={styles.icon} />
                        <span className={styles.text}>
                        Insured Cold Chain
                        </span>
                    </div>

                </div>
            </div>

            

            </div>
        </main>
    </div>
  );
}
