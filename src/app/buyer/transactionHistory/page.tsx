'use client'
import { Landmark, Coins, Receipt, MoveDownLeft, Handbag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import styles from '@/app/buyer/transactionHistory/page.module.css';
import Navbar from '@/app/components/Navbar';

const transactions = [
  { title: "Auction Won: Lot #8492", description: "Payment to Blue Horizon Fleet", amount: "12,450.00", date: "OCT 24, 14:30", isPositive: false, icon: <Coins size={24} color='#000000'></Coins> },
  { title: "Wire Transfer Deposit", description: "From Chase Bank ****4829", amount: "50,000.00", date: "OCT 22, 09:15", isPositive: true, icon: <MoveDownLeft size={24} color='#000000'></MoveDownLeft> },
  { title: "Platform Processing Fee", description: "Monthly maintenance", amount: "150.00", date: "OCT 01, 00:00", isPositive: false, icon: <Receipt size={24} color='#000000'></Receipt> },
  { title: "Auction Won: Lot #8310", description: "Payment to Northern Trawlers", amount: "8,920.50", date: "SEP 28, 11:45", isPositive: false, icon: <Coins size={24} color='#000000'></Coins> },
];


export default function TransactionHistory() {
  return(
    <>
     <div className={styles.all}>
      <Navbar />
        <main className={styles.mainContainer}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.notiHeader}>
                    <div>
                        <h1 className={styles.notiTitle}>Transaction History</h1>
                        <p className={styles.notiDescription}>
                            Manage your funds and view recent financial activity.
                        </p>
                    </div>
                    <a href="#" className={styles.viewAll}>←    Kembali ke halaman Dompet </a>
                </div>
            </div>


            <section className={styles.transactionSection}>
                

                <div className={styles.transactionList}>
                    {transactions.map((tx, index) => (
                    <div key={index} className={styles.transactionItem}>
                        <div className={styles.transactionDescription}>
                            <div className={styles.txIcon}>{tx.icon}</div>
                            <div className={styles.txInfo}>
                                <p className={styles.txTitle}>{tx.title}</p>
                                <p className={styles.txDesc}>{tx.description}</p>
                            </div>
                        </div>
                        <div className={styles.txAmountContainer}>
                            <p className={`${styles.txAmount} ${tx.isPositive ? styles.positive : styles.negative}`}>
                                {tx.isPositive ? `+$${tx.amount}` : `-$${tx.amount}`}
                            </p>
                            <p className={styles.txDate}>{tx.date}</p>
                        </div>
                    </div>
                    ))}
                </div>
            </section>

        </main>

      </div>  
    </>
  );
}