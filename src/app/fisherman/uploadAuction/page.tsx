'use client';
import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Camera, MapPin, Ship, Info, X, Loader2, CheckCircle } from 'lucide-react';
import SideFisherman from '../../components/sideFisherman';
import NavbarFisherman from '../../components/NavbarFisherman';
import styles from './upload.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { auctionService } from '@/services/auctionService';
import AuctionCard from '@/app/components/AuctionCard'

const DURATION_OPTIONS = [
  { label: '2 Jam',   value: '2'  },
  { label: '6 Jam',   value: '6'  },
  { label: '12 Jam',  value: '12' },
  { label: '1 Hari',  value: '24' },
];

export default function UploadAuction() {
  const { user, token } = useAuth();
  const router = useRouter();

  // ── Form state ────────────────────────────────────────────────────────────
  const [fishName,       setFishName]       = useState('');
  const [species,        setSpecies]        = useState('');
  const [grade,          setGrade]          = useState('');
  const [weight,         setWeight]         = useState('');
  const [price,          setPrice]          = useState('');
  const [duration,       setDuration]       = useState('6');
  const [imageFile,      setImageFile]      = useState<File | null>(null);
  const [imagePreview,   setImagePreview]   = useState<string | null>(null);
  const [isDragging,     setIsDragging]     = useState(false);

  // ── Submission state ──────────────────────────────────────────────────────
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [submitError,    setSubmitError]    = useState('');
  const [submitSuccess,  setSubmitSuccess]  = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Image handlers ────────────────────────────────────────────────────────
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const onDragOver  = (e: DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop      = (e: DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };
  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Format price display ──────────────────────────────────────────────────
  const priceNumber = Number(price.replace(/\./g, '')) || 0;
  const weightNumber = Number(weight) || 0;

  const formatPreviewPrice = (val: number) =>
    val > 0 ? `Rp ${val.toLocaleString('id-ID')}` : 'Rp 0';

  const endsAtPreview = () => {
    const d = new Date(Date.now() + Number(duration) * 3600 * 1000);
    return `${Number(duration)}h 00m`;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitError('');

    if (!fishName.trim()) { setSubmitError('Nama ikan wajib diisi.'); return; }
    if (!weight || Number(weight) <= 0) { setSubmitError('Berat wajib diisi.'); return; }
    if (!price || priceNumber <= 0) { setSubmitError('Harga awal wajib diisi.'); return; }
    if (!user || !token) { setSubmitError('Sesi expired, silakan login ulang.'); return; }

    setIsSubmitting(true);
    try {
      await auctionService.create(user.id, token, {
        name: fishName,
        species: species || undefined,
        grade: grade || undefined,
        weight_kg: weight,
        start_price: String(priceNumber),
        duration_hours: duration,
        image_file: imageFile,
      });

      setSubmitSuccess(true);
      setTimeout(() => router.push('/fisherman/dashboard'), 1800);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
     <div className={styles.all}>
      <SideFisherman />
      <div className={styles.container}>
        <NavbarFisherman />

        <div className={styles.content}>
          <section className={styles.titleSection}>
           <h1 className={styles.title}>Unggah Lelang</h1>
            <p className={styles.description}>
              Daftarkan hasil tangkapan segar Anda ke pasar global. Pastikan semua detail akurat untuk menarik penawar bernilai tinggi.
            </p>
          </section>

          <div className={styles.isi}>
            {/* ── Form ── */}
            <div className={styles.form}>

              {/* Nama Ikan */}
              <div className={styles.field}>
                <label className={styles.label}>Nama Ikan</label>
                <input
                  type="text"
                  placeholder="contoh: Tuna Sirip Kuning, Kakap Merah"
                  className={styles.input}
                  value={fishName}
                  onChange={e => setFishName(e.target.value)}
                />
              </div>

              {/* Spesies & Grade */}
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label className={styles.label}>Spesies <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>(opsional)</span></label>
                  <input
                    type="text"
                    placeholder="contoh: Thunnus albacares"
                    className={styles.input}
                    value={species}
                    onChange={e => setSpecies(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Kelas <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>(opsional)</span></label>
                  <input
                    type="text"
                    placeholder="contoh: A+, Premium, Export"
                    className={styles.input}
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                  />
                </div>
              </div>

              {/* Upload Foto */}
              <div>
                <label className={styles.label}>Unggah Foto</label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onFileChange}
                  accept="image/*"
                  className={styles.hiddenInput}
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`${styles.uploadBox} ${
                    isDragging ? styles.dragging : styles.notDragging
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {imagePreview ? (
                      <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={styles.previewWrapper}
                      >
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className={styles.previewImage}
                        />

                        <button
                          onClick={clearImage}
                          className={styles.clearButton}
                        >
                          <X className={styles.clearIcon} />
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={styles.placeholder}
                      >
                        <div className={styles.iconWrapper}>
                          <Camera className={styles.icon} />
                        </div>

                        <h4 className={styles.dropTitle}>
                          Klik atau seret untuk unggah
                        </h4>

                        <p className={styles.dropDesc}>
                          SVG, PNG, JPG (maks 10MB)
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Weight & Price */}
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label className={styles.label}>Berat / Jumlah</label>
                  <div className={styles.relative}>
                    <input
                      type="number"
                      placeholder="0.00"
                      className={`${styles.input} ${styles.inputWithRightPadding}`}
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                      min="0"
                    />
                    <span className={styles.KG}>KG</span>
                  </div>
                </div>

                <div className={styles.field}>
                <label className={styles.label}>Harga Awal</label>
                  <div className={styles.relative}>
                    <span className={styles.Rp}>Rp</span>
                    <input
                      type="text"
                      placeholder="0"
                      className={`${styles.input} ${styles.inputWithLeftPadding}`}
                      value={price}
                      onChange={e => {
                        // Hanya angka
                        const raw = e.target.value.replace(/\D/g, '');
                        setPrice(raw ? Number(raw).toLocaleString('id-ID') : '');
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div className={styles.field}>
                <label className={styles.label}>Durasi Lelang</label>
                <select
                  className={styles.select}
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                >
                  {DURATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Error */}
              {submitError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.875rem' }}>
                  {submitError}
                </div>
              )}

              {/* Success */}
              {submitSuccess && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={16} /> Lelang berhasil dibuat! Mengarahkan ke dashboard...
                </div>
              )}

              {/* Submit */}
              <button
                className={styles.startbutton}
                onClick={handleSubmit}
                disabled={isSubmitting || submitSuccess}
                style={{ opacity: isSubmitting || submitSuccess ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {isSubmitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Memproses...</>
                ) : submitSuccess ? (
                  <><CheckCircle size={16} /> Berhasil!</>
                ) : (
                  'Mulai Lelang'
                )}
              </button>
            </div>

            {/* ── Live Preview ── */}
            <div className={styles.previewcontainer}>
              <h4 className={styles.sectionTitle}>Pratinjau Pasar</h4>
              <AuctionCard
                id="preview"
                name={fishName || 'Nama Ikan'}
                image={imagePreview || '/placeholder-fish.jpg'}
                weight={weight ? `${weight} KG` : '0 KG'}
                grade={grade || '-'}
                origin="Pelabuhan Jakarta"
                startingPrice={price || '0'}
                highestBid={price || '0'}
                timeLeft={endsAtPreview()}
              />

              {/* Pro Tip */}
              <div className={styles.protipcard}>
                <div className={styles.iconBg}>
                  <Ship className={styles.shipIcon} />
                </div>
                <Info className={styles.infoIcon} />
                <h3 className={styles.protiptitle}>Tips</h3>
                <p className={styles.protipdescription}>
                  Lelang dengan foto yang jelas dan terang dari berbagai sudut cenderung ditutup 35% lebih tinggi dari rata-rata. Cahaya pagi terbaik untuk menonjolkan kesegaran sisik.
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}