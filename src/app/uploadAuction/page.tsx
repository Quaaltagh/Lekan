'use client'
import React from 'react';
import {Camera, MapPin, Ship, Info, X} from 'lucide-react';
import SideFisherman from '../components/sideFisherman';
import NavbarFisherman from '../components/NavbarFisherman';
import styles from './page.module.css';
import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UploadAuction() {
    const [activeTab, setActiveTab] = useState('upload');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [fishName, setFishName] = useState('');
    const [weight, setWeight] = useState('');
    const [price, setPrice] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
        }
    };

    const onDragOver = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => {
        setIsDragging(false);
    };

    const onDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFile(file);
    };

    const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const clearImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };


    return(
    <div className={styles.container}>
      {/* Sidebar */}
      <SideFisherman />

      {/* Main Content */}
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


                <div className={styles.form}>
    
                    {/* Fish Name */}
                    <div className={styles.field}>
                        <label className={styles.label}>Nama Ikan</label>
                        <input
                        type="text"
                        placeholder="e.g. Yellowfin Tuna, Red Snapper"
                        className={styles.input}
                        />
                    </div>

                    {/* Upload Dropzone */}
                    {/* <div className={styles.field}>
                        <label className={styles.label}>Upload Photo</label>

                        <div className={styles.dropzone}>
                        <div className={styles.iconWrapper}>
                            <Camera className={styles.icon} />
                        </div>

                        <h4 className={styles.dropTitle}>
                            Click or drag to upload
                        </h4>

                        <p className={styles.dropDesc}>
                            SVG, PNG, JPG (max 10MB)
                        </p>
                        </div>
                    </div> */}
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
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="z-10"
                      >
                       <div className={styles.iconWrapper}>
                            <Camera className={styles.icon} />
                        </div>

                        <h4 className={styles.dropTitle}>
                            Click or drag to upload
                        </h4>

                        <p className={styles.dropDesc}>
                            SVG, PNG, JPG (max 10MB)
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

                    <div className={styles.grid}>

                        {/* Weight */}
                        <div className={styles.field}>
                            <label className={styles.label}>Weight / Quantity</label>

                            <div className={styles.relative}>
                            <input
                                type="text"
                                placeholder="0.00"
                                className={styles.inputWithRightPadding}
                            />
                            <span className={styles.KG}>KG</span>
                            </div>
                        </div>

                        {/* Price */}
                        <div className={styles.field}>
                            <label className={styles.label}>Starting Price</label>

                            <div className={styles.relative}>
                            <span className={styles.price}>Rp</span>

                            <input
                                type="text"
                                placeholder="0"
                                className={styles.inputWithLeftPadding}
                            />
                            </div>
                        </div>

                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Auction Duration</label>

                        <select className={styles.select}>
                            <option>2 Hours</option>
                            <option>6 Hours</option>
                            <option>12 Hours</option>
                            <option>1 Day</option>
                        </select>
                    </div>

                    <button className={styles.startbutton}>Mulai Lelang</button>

                </div>

                <div className={styles.previewcontainer}>
                    
                    <h4 className={styles.sectionTitle}>Market Preview</h4>

                    <div className={styles.card}>
                    
                        <div className={styles.imageWrapper}>
                            <div className={styles.badges}>
                            <span className={styles.liveBadge}>● Live Preview</span>
                            <span className={styles.gradeBadge}>Grade A+</span>
                            </div>

                            <img
                            src="https://darilaut.id/wp-content/uploads/2021/09/Tuna-3.jpg"
                            alt="FishPreview"
                            className={styles.image}
                            />
                        </div>

                        <div className={styles.previewcontent}>
                            <div className={styles.header}>
                                <div>
                                    <h2 className={styles.title}>Bluefin Tuna</h2>

                                    <div className={styles.location}>
                                    <MapPin className={styles.icon} />
                                    <span> Pelabuhan Makassar</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.weightBox}>
                                <span className={styles.desclabel}>Weight</span>
                                <div className={styles.weight}>
                                45.5 KG
                                </div>
                            </div>

                        </div>

                        <div className={styles.descbox}>
                            <div className={styles.descBox}>
                                <span className={styles.desclabel}>Starting Price</span>
                                <span className={styles.price}>Rp 12,500,000</span>
                            </div>

                            <div className={styles.descBox} style={{alignItems:"end"}}>
                                <span className={styles.desclabel}>Time Limit</span>
                                <span className={styles.price} >4h 00m</span>
                            </div>
                        </div>


                    </div>


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