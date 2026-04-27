'use client';
import styles from './Filters.module.css';
import React, { useState } from 'react';
import { LayoutDashboard, Radio, History, Ship, Settings, Bell, Wallet, Search, Plus } from 'lucide-react';
import { ChevronDown, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Filters() {
    const [status, setStatus] = useState<'live' | 'scheduled'>('live');
  return (
    <>
    
    <div className={styles.container}>
        <div className={styles.wrapper}>

            {/* Species */}
            <div className={styles.colQuarter}>
                <label className={styles.label}>Species</label>
                <div className={styles.selectWrapper}>
                    <select className={styles.select}>
                    <option>All Types</option>
                    <option>Tuna</option>
                    <option>Snapper</option>
                    <option>Lobster</option>
                    <option>Mackerel</option>
                    </select>
                    <ChevronDown className={styles.chevron} />
                </div>
            </div>

            {/* Price */}
            <div className={styles.colThird}>
                <label className={styles.label}>Price Range (IDR)</label>
                <div className={styles.range}>
                    <input type="text" placeholder="Min" className={styles.input} />
                    <span className={styles.dash}>—</span>
                    <input type="text" placeholder="Max" className={styles.input} />
                </div>
            </div>

            {/* Status */}
            <div className={styles.colAuto}>
            <label className={styles.label}>Status</label>

            <div className={styles.statusWrapper}>
                <button
                onClick={() => setStatus('live')}
                className={status === 'live' ? styles.activeBtn : styles.inactiveBtn}
                >
                Live Now
                </button>

                <button
                onClick={() => setStatus('scheduled')}
                className={status === 'scheduled' ? styles.activeBtn : styles.inactiveBtn}
                >
                Scheduled
                </button>
            </div>
            </div>

            {/* Button */}
            <button className={styles.applyBtn}>
                <Filter className={styles.filterIcon} />
                Apply
            </button>

        </div>
    </div>
    </>
  );
}