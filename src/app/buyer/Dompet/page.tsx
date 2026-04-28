import React from 'react';
import styles from './page.module.css';
import { Landmark, Coins, Receipt, MoveDownLeft, Handbag } from 'lucide-react';

const WalletDashboard: React.FC = () => {
  return (
    <div className={styles.container}>
      {/* Navbar */}

      {/* Header Section */}
      <header className={styles.header}>
        <h1 className={styles.title}>Dompet</h1>
        <p className={styles.subtitle}>Manage your funds and view recent financial activity.</p>
      </header>

      {/* Balance Cards Section */}
      <div className={styles.cardGrid}>
        {/* Main Balance Card */}
        <div className={styles.balanceCard}>
          <div className={styles.balanceHeader}>
            <div className={styles.balance}>
                <span className={styles.label}>AVAILABLE BALANCE</span>
                <h2 className={styles.amount}>$124,500<span>.00</span></h2>
            </div>
            <div className={styles.bankIcon}><Landmark size={24} color='#fcfcfc'></Landmark></div>
          </div>
          <div className={styles.buttonGroup}>
            <button className={styles.btnDeposit}>+ Deposit Funds</button>
            <button className={styles.btnTransfer}>Transfer</button>
          </div>
        </div>

        {/* Spending Card */}
        <div className={styles.spendingCard}>
          <div className={styles.spendingHeader}>
            <span className={styles.label}>TOTAL SPENT</span>
            <span className={styles.bagIcon}><Handbag size={24} color='#000000'></Handbag></span>
          </div>
          <h2 className={styles.spentAmount}>$45,230.50</h2>
          <p className={styles.periodText}>This billing period</p>
          
          <div className={styles.spendingFooter}>
            <div>
              <span className={styles.subLabel}>Active Bids</span>
              <p className={styles.footerValue}>3 Lots</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={styles.subLabel}>Escrowed</span>
              <p className={`${styles.footerValue} ${styles.blueText}`}>$8,400.00</p>
            </div>
          </div>
        </div>
      </div>

        <section className={styles.transactionSection}>
        <div className={styles.sectionHeader}>
            <h3>Recent Transactions</h3>
            <a href="#" className={styles.viewAll}>View All →</a>
        </div>

        {/* Container list sekarang tidak pakai border/background putih */}
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
    </div>
  );
};

const transactions = [
  { title: "Auction Won: Lot #8492", description: "Payment to Blue Horizon Fleet", amount: "12,450.00", date: "OCT 24, 14:30", isPositive: false, icon: <Coins size={24} color='#000000'></Coins> },
  { title: "Wire Transfer Deposit", description: "From Chase Bank ****4829", amount: "50,000.00", date: "OCT 22, 09:15", isPositive: true, icon: <MoveDownLeft size={24} color='#000000'></MoveDownLeft> },
  { title: "Platform Processing Fee", description: "Monthly maintenance", amount: "150.00", date: "OCT 01, 00:00", isPositive: false, icon: <Receipt size={24} color='#000000'></Receipt> },
  { title: "Auction Won: Lot #8310", description: "Payment to Northern Trawlers", amount: "8,920.50", date: "SEP 28, 11:45", isPositive: false, icon: <Coins size={24} color='#000000'></Coins> },
];

export default WalletDashboard;