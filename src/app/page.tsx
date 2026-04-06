'use client';
import React, { useState } from 'react';
import { User, Mail, Lock, Eye, Ship, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [role, setRole] = useState('nelayan');

  return (
    <div className="flex h-screen bg-white">
      {/* Kiri - Hero Image & Branding */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 relative flex-col justify-between p-12 text-white overflow-hidden">
        {/* Placeholder untuk background laut malam hari */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-blue-900 opacity-90 z-0"></div>
        
        <div className="z-10 relative">
          <h1 className="text-4xl font-bold mb-2">LEKAN</h1>
          <p className="text-slate-300 text-lg">
            Connecting oceans of opportunity through a<br /> premium, digital-first seafood marketplace.
          </p>
        </div>

        <div className="z-10 relative space-y-6">
          <div className="flex items-start space-x-4">
            <div className="bg-white/10 p-2 rounded-full"><Ship size={20} /></div>
            <div>
              <h3 className="font-semibold">Trusted Network</h3>
              <p className="text-sm text-slate-400">Verified merchants and secure transactions.</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <div className="bg-white/10 p-2 rounded-full"><Lock size={20} /></div>
            <div>
              <h3 className="font-semibold">Fintech-Ready</h3>
              <p className="text-sm text-slate-400">Instant wallet settlements and transparent bidding.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Kanan - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Selamat Datang</h2>
            <p className="text-gray-500 mt-2 text-sm">
              Silakan masuk atau daftar untuk melanjutkan akses ke pelelangan.
            </p>
          </div>

          {/* Role Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setRole('nelayan')}
              className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 ${role === 'nelayan' ? 'bg-white shadow-sm text-blue-900' : 'text-slate-500'}`}
            >
              <Ship size={16} /> Nelayan
            </button>
            <button 
              onClick={() => setRole('pembeli')}
              className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 ${role === 'pembeli' ? 'bg-white shadow-sm text-blue-900' : 'text-slate-500'}`}
            >
              <ShoppingCart size={16} /> Pembeli
            </button>
          </div>

          <form className="space-y-4">
            {role === 'nelayan' && (
              <div>
                <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="text-gray-400" size={18} />
                  </div>
                  <input type="text" className="w-full pl-10 px-3 py-2 border border-gray-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="John Doe" />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700">Alamat Email</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="text-gray-400" size={18} />
                </div>
                <input type="email" className="w-full pl-10 px-3 py-2 border border-gray-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="email@example.com" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">Kata Sandi</label>
                <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-500">Lupa Sandi?</a>
              </div>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-gray-400" size={18} />
                </div>
                <input type="password" className="w-full pl-10 px-3 py-2 border border-gray-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
                  <Eye className="text-gray-400" size={18} />
                </div>
              </div>
            </div>

            {/* Navigasi simulasi berdasarkan role */}
            <Link href={role === 'pembeli' ? '/buyer' : '/fisherman'}>
              <button type="button" className="w-full flex justify-center py-3 mt-4 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-800 hover:bg-blue-900">
                Masuk Ke Dashboard →
              </button>
            </Link>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-400 text-xs tracking-wider">ATAU LANJUT DENGAN</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
              Google
            </button>
            <button className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
              Facebook
            </button>
          </div>

          <p className="text-center text-sm text-gray-600 mt-8">
            Belum punya akun? <a href="#" className="font-semibold text-blue-800">Daftar Sekarang</a>
          </p>
        </div>
      </div>
    </div>
  );
}