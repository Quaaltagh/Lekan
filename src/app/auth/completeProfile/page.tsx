'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, MapPin, Ship, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';

interface ProfileForm {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  vessel_name: string; // hanya nelayan
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [form, setForm] = useState<ProfileForm>({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    vessel_name: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Prefill dari data user yang sudah ada
  useEffect(() => {
    if (!user) {
      router.replace('/auth');
      return;
    }
    setForm(prev => ({
      ...prev,
      full_name: user.full_name || '',
      email: user.email || '',
    }));
  }, [user, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async () => {
    setError('');

    // ── Validasi ──────────────────────────────────────────────────────────────
    if (!form.full_name.trim()) { setError('Nama lengkap wajib diisi.'); return; }
    if (!form.email.trim())     { setError('Email wajib diisi.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Format email tidak valid.'); return;
    }
    if (!form.phone.trim())   { setError('Nomor telepon wajib diisi.'); return; }
    if (!/^(\+62|08)[0-9]{8,13}$/.test(form.phone.trim())) {
      setError('Format nomor telepon tidak valid. Contoh: 08123456789'); return;
    }
    if (!form.address.trim()) { setError('Alamat wajib diisi.'); return; }
    if (user?.role === 'nelayan' && !form.vessel_name.trim()) {
      setError('Nama kapal wajib diisi untuk nelayan.'); return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/complete-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name:   form.full_name.trim(),
          email:       form.email.trim(),
          phone:       form.phone.trim(),
          address:     form.address.trim(),
          vessel_name: form.vessel_name.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan profil.');

      // Update localStorage dengan data terbaru
      const savedUser = JSON.parse(localStorage.getItem('lekan_user') || '{}');
      localStorage.setItem('lekan_user', JSON.stringify({
        ...savedUser,
        full_name: form.full_name.trim(),
      }));

      router.replace(user?.role === 'pembeli' ? '/' : '/fisherman/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  if (!user) return null;

  const isNelayan = user.role === 'nelayan';

  return (
    <div className={styles.pageWrapper}>

      {/* ── Kiri Hero (Sama persis dengan AuthPage) ── */}
      <div className={styles.hero}>
        <div className={styles.heroDecor} />
        <div className={styles.heroDecor2} />

        <div className={styles.heroTop}>
          <p className={styles.heroLogo}>LEKAN</p>
          <p className={styles.heroTagline}>
            Menghubungkan lautan peluang melalui <br />pasar makanan laut premium yang mengutamakan digital.
          </p>
        </div>

        <div className={styles.heroBottom}>
          <div className={styles.heroFeature}>
            <div className={styles.heroFeatureIcon}>
              <Ship size={18} color="white" />
            </div>
            <div>
              <p className={styles.heroFeatureTitle}>Terpercaya</p>
              <p className={styles.heroFeatureDesc}>Pedagang terverifikasi dan transaksi aman.</p>
            </div>
          </div>
          <div className={styles.heroFeature}>
            <div className={styles.heroFeatureIcon}>
              <Lock size={18} color="white" />
            </div>
            <div>
              <p className={styles.heroFeatureTitle}>Transaksi Dengan Mudah</p>
              <p className={styles.heroFeatureDesc}>Penyelesaian transaksi dompet digital secara instan dan penawaran yang transparan.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Kanan Form ── */}
      <div className={styles.formSide}>
        <div className={styles.formCard}>

          {/* Heading */}
          <div className={styles.formHeading}>
            <h1 className={styles.formTitle}>Lengkapi Profil Kamu</h1>
            <p className={styles.formSubtitle}>
              Isi data berikut untuk melanjutkan ke dashboard LEKAN sebagai <strong>{user.role}</strong>.
            </p>
          </div>

          {/* Fields */}
          <div className={styles.fields} onKeyDown={handleKeyDown}>

            {/* Nama Lengkap */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Nama Lengkap</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><User size={16} /></span>
                <input
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Nama lengkap sesuai KTP"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Alamat Email</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><Mail size={16} /></span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="email@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Nomor Telepon */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Nomor Telepon</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><Phone size={16} /></span>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Contoh: 08123456789"
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Alamat */}
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Alamat Rumah</label>
              <div className={styles.inputWrap} style={{ alignItems: 'flex-start' }}>
                <span className={styles.inputIcon} style={{ marginTop: 12 }}>
                  <MapPin size={16} />
                </span>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className={`${styles.input} ${styles.textarea}`}
                  placeholder="Jl. Contoh No. 1, Kelurahan, Kecamatan, Kota"
                  rows={2}
                  autoComplete="street-address"
                  style={{ minHeight: '80px', paddingTop: '10px', resize: 'vertical' }}
                />
              </div>
            </div>

            {/* Nama Kapal — hanya nelayan */}
            {isNelayan && (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Nama Kapal</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}><Ship size={16} /></span>
                  <input
                    type="text"
                    name="vessel_name"
                    value={form.vessel_name}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Nama kapal kamu"
                  />
                </div>
              </div>
            )}

            {/* Error Box */}
            {error && (
              <div className={styles.errorBox}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Menyimpan...' : 'Simpan & Lanjut ke Dashboard →'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}