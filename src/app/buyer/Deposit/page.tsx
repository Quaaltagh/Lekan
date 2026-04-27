import React, { useState } from 'react';
import styles from './page.module.css';
import { Landmark, CreditCard, Wallet, QrCode, ShieldAlert, Headset, Info } from 'lucide-react';

const DepositPage: React.FC = () => {
  const [selectedAmount, setSelectedAmount] = useState('100.000');

  const amounts = ['50.000', '100.000', '500.000', '1.000.000'];

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        {/* Total Balance Header */}
        <header className={styles.balanceHeader}>
          <p className={styles.label}>TOTAL BALANCE</p>
          <h1 className={styles.balanceValue}>Rp 12.450.000</h1>
          <p className={styles.subtext}>Available for bidding in 4 active auctions</p>
        </header>

        {/* Step 1: Amount */}
        <section className={styles.stepSection}>
          <div className={styles.stepTitle}>
            <span className={styles.stepNumber}>1</span>
            <h3>Select Deposit Amount</h3>
          </div>
          
          <div className={styles.amountGrid}>
            {amounts.map((amt) => (
              <button 
                key={amt}
                className={`${styles.amountBtn} ${selectedAmount === amt ? styles.activeAmount : ''}`}
                onClick={() => setSelectedAmount(amt)}
              >
                {amt}
              </button>
            ))}
          </div>

          <div className={styles.customInputWrapper}>
            <label>CUSTOM AMOUNT</label>
            <div className={styles.inputField}>
              <span>Rp</span>
              <input type="text" placeholder="Enter amount..." />
            </div>
          </div>
        </section>

        {/* Step 2: Payment Method */}
        <section className={styles.stepSection}>
          <div className={styles.stepTitle}>
            <span className={styles.stepNumber}>2</span>
            <h3>Payment Method</h3>
          </div>

          <div className={styles.methodGrid}>
            <div className={`${styles.methodCard} ${styles.selectedMethod}`}>
              <div className={styles.methodIcon}><Landmark size={24} color='#004370'></Landmark></div>
              <div className={styles.methodText}>
                <p className={styles.methodName}>Bank Transfer</p>
                <p className={styles.methodSub}>BCA, Mandiri, BNI, BRI</p>
              </div>
              <div className={styles.checkIcon}>✔️</div>
            </div>

            <div className={styles.methodCard}>
              <div className={styles.methodIcon}><Wallet size={24} color='#004370'></Wallet></div>
              <div className={styles.methodText}>
                <p className={styles.methodName}>E-Wallet</p>
                <p className={styles.methodSub}>OVO, DANA, GoPay</p>
              </div>
            </div>

            <div className={styles.methodCard}>
              <div className={styles.methodIcon}><CreditCard size={24} color='#004370'></CreditCard></div>
              <div className={styles.methodText}>
                <p className={styles.methodName}>Cards</p>
                <p className={styles.methodSub}>Visa, Mastercard</p>
              </div>
            </div>

            <div className={styles.methodCard}>
              <div className={styles.methodIcon}><QrCode size={24} color='#004370'></QrCode></div>
              <div className={styles.methodText}>
                <p className={styles.methodName}>QRIS</p>
                <p className={styles.methodSub}>Scan & Pay</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Sidebar: Summary */}
      <aside className={styles.sidebar}>
        <div className={styles.safetyCard}>
          <p className={styles.safetyLabel}>SAFETY DEPOSIT</p>
          <p className={styles.safetyValue}>Rp 2.000.000</p>
          <p className={styles.safetySub}>Reserved for insurance compliance</p>
        </div>

        <div className={styles.summaryCard}>
          <h3>Summary</h3>
          <div className={styles.summaryRow}>
            <span>Amount</span>
            <span>Rp {selectedAmount}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Service Fee</span>
            <span>Rp 2.500</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Admin Fee</span>
            <span className={styles.freeText}>Free</span>
          </div>
          
          <div className={styles.totalRow}>
            <div className={styles.totalLabel}>
              <p>Total</p>
              <p>Bill</p>
            </div>
            <p className={styles.totalAmount}>Rp 102.500</p>
          </div>

          <div className={styles.infoBox}>
            <div className={styles.infoIcon}><Info size={24} color='#000000'></Info></div>
            <p>Deposits via Bank Transfer usually settle within 2-5 minutes after verification.</p>
          </div>

          <button className={styles.btnDeposit}>Deposit Now</button>
          <div className={styles.secureText}>
            <div className={styles.secureIcon}><ShieldAlert size={24} color='#000000'></ShieldAlert></div>
            <p>Secured by Maritime Exchange Payment Engine</p>
          </div>
        </div>

        <div className={styles.helpCard}>
          <div className={styles.helpIcon}><Headset size={24} color='#adb5bd'></Headset></div>
          <div>
            <p className={styles.helpTitle}>Need help?</p>
            <p className={styles.helpSub}>Contact 24/7 Priority Support</p>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default DepositPage;