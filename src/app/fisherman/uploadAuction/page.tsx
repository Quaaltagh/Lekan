'use client';
import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Camera, MapPin, Ship, Info, X, Loader2, CheckCircle } from 'lucide-react';
import SideFisherman from '../../components/sideFisherman';
import NavbarFisherman from '../../components/NavbarFisherman';
import styles from './page.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { auctionService } from '@/services/auctionService';

const DURATION_OPTIONS = [
  { label: '2 Hours',  value: '2'  },
  { label: '6 Hours',  value: '6'  },
  { label: '12 Hours', value: '12' },
  { label: '1 Day',    value: '24' },
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
    <div className={styles.container}>
      <SideFisherman />

      <main className={styles.mainContent}>
        <NavbarFisherman />

        <div className={styles.content}>
          <div className={styles.header}>
            <h1 className={styles.title}>Unggah Auction</h1>
            <p className={styles.description}>
              Daftarkan hasil tangkapan segar Anda ke pasar global. Pastikan semua detail akurat untuk menarik penawar bernilai tinggi.
            </p>
          </div>

          <div className={styles.isi}>
            {/* ── Form ── */}
            <div className={styles.form}>

              {/* Nama Ikan */}
              <div className={styles.field}>
                <label className={styles.label}>Nama Ikan</label>
                <input
                  type="text"
                  placeholder="e.g. Yellowfin Tuna, Red Snapper"
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
                    placeholder="e.g. Thunnus albacares"
                    className={styles.input}
                    value={species}
                    onChange={e => setSpecies(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Grade <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>(opsional)</span></label>
                  <input
                    type="text"
                    placeholder="e.g. A+, Premium, Export"
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
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  className={`relative border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer group bg-gray-50/50 min-h-[280px] overflow-hidden ${
                    isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {imagePreview ? (
                      <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 w-full h-full p-4"
                      >
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-2xl drop-shadow-lg"
                        />
                        <button
                          onClick={clearImage}
                          className="absolute top-6 right-6 h-10 w-10 bg-white shadow-xl rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors z-20 border border-gray-100"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="z-10">
                        <div className={styles.iconWrapper}>
                          <Camera className={styles.icon} />
                        </div>
                        <h4 className={styles.dropTitle}>Click or drag to upload</h4>
                        <p className={styles.dropDesc}>SVG, PNG, JPG (max 10MB)</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Weight & Price */}
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label className={styles.label}>Weight / Quantity</label>
                  <div className={styles.relative}>
                    <input
                      type="number"
                      placeholder="0.00"
                      className={styles.inputWithRightPadding}
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                      min="0"
                    />
                    <span className={styles.KG}>KG</span>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Starting Price</label>
                  <div className={styles.relative}>
                    <span className={styles.rp}>Rp</span>
                    <input
                      type="text"
                      placeholder="0"
                      className={styles.inputWithLeftPadding}
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
                <label className={styles.label}>Auction Duration</label>
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
              <h4 className={styles.sectionTitle}>Market Preview</h4>

              <div className={styles.card}>
                <div className={styles.imageWrapper}>
                  <div className={styles.badges}>
                    <span className={styles.liveBadge}>● Live Preview</span>
                    {grade && <span className={styles.gradeBadge}>Grade {grade}</span>}
                  </div>
                  <img
                    src={imagePreview || 'https://darilaut.id/wp-content/uploads/2021/09/Tuna-3.jpg'}
                    alt="FishPreview"
                    className={styles.image}
                    style={{ objectFit: 'cover' }}
                  />
                </div>

                <div className={styles.previewcontent}>
                  <div className={styles.header}>
                    <div>
                      <h2 className={styles.title}>
                        {fishName || 'Nama Ikan'}
                      </h2>
                      {species && (
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{species}</p>
                      )}
                      <div className={styles.location}>
                        <MapPin className={styles.icon} />
                        <span>Pelabuhan Makassar</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.weightBox}>
                    <span className={styles.desclabel}>Weight</span>
                    <div className={styles.weight}>
                      {weightNumber > 0 ? `${weightNumber} KG` : '— KG'}
                    </div>
                  </div>
                </div>

                <div className={styles.descbox}>
                  <div className={styles.descBox}>
                    <span className={styles.desclabel}>Starting Price</span>
                    <span className={styles.price}>{formatPreviewPrice(priceNumber)}</span>
                  </div>
                  <div className={styles.descBox} style={{ alignItems: 'end' }}>
                    <span className={styles.desclabel}>Time Limit</span>
                    <span className={styles.price}>{endsAtPreview()}</span>
                  </div>
                </div>
              </div>

              {/* Pro Tip */}
              <div className={styles.protipcard}>
                <div className={styles.iconBg}>
                  <Ship className={styles.shipIcon} />
                </div>
                <Info className={styles.infoIcon} />
                <h3 className={styles.protiptitle}>Pro Tip</h3>
                <p className={styles.protipdescription}>
                  Auctions with clear, bright photos from multiple angles tend to close 35% higher than average. Morning light works best for highlighting the freshness of the scales.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}