import React from 'react';
import { LayoutDashboard, Radio, History, Ship, Settings, Bell, Wallet, Search, Plus } from 'lucide-react';

export default function BuyerDashboard() {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Sidebar */}
      {/*  */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between">
        <div>
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-blue-900">LEKAN</h2>
            <div className="flex items-center mt-6 gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold">CS</div>
              <div>
                <p className="text-sm font-bold text-blue-900">Captain Sam</p>
                <p className="text-xs text-slate-500">Verified Merchant</p>
              </div>
            </div>
          </div>
          <nav className="p-4 space-y-1">
            <a href="#" className="flex items-center gap-3 bg-blue-50 text-blue-800 px-4 py-3 rounded-xl font-medium"><LayoutDashboard size={20} /> Dashboard</a>
            <a href="#" className="flex items-center gap-3 text-slate-500 hover:bg-slate-50 px-4 py-3 rounded-xl font-medium"><Radio size={20} /> Live Auctions</a>
            <a href="#" className="flex items-center gap-3 text-slate-500 hover:bg-slate-50 px-4 py-3 rounded-xl font-medium"><History size={20} /> Transaction History</a>
            <a href="#" className="flex items-center gap-3 text-slate-500 hover:bg-slate-50 px-4 py-3 rounded-xl font-medium"><Ship size={20} /> Vessel Tracking</a>
            <a href="#" className="flex items-center gap-3 text-slate-500 hover:bg-slate-50 px-4 py-3 rounded-xl font-medium"><Settings size={20} /> Settings</a>
          </nav>
        </div>
        <div className="p-4">
          <button className="w-full bg-blue-800 text-white rounded-xl py-3 font-medium hover:bg-blue-900">Start New Auction</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div className="flex gap-6 font-medium">
            <a href="#" className="text-blue-800 border-b-2 border-blue-800 pb-1">Market</a>
            <a href="#" className="text-slate-500">Fleet</a>
            <a href="#" className="text-slate-500">Logistics</a>
          </div>
          <div className="flex items-center gap-4">
            <Bell className="text-slate-400" size={20} />
            <Wallet className="text-slate-400" size={20} />
            <div className="w-8 h-8 rounded-full bg-slate-200"></div> {/* Avatar Placeholder */}
          </div>
        </header>

        <div className="p-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                <div className="bg-blue-50 text-blue-600 p-2 rounded-lg"><Wallet size={16} /></div>
                ACTIVE BALANCE
              </div>
              <p className="text-sm text-slate-500 mt-2">Saldo Dompet</p>
              <h3 className="text-2xl font-bold text-blue-900">Rp 128.500.000</h3>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
                <div className="bg-orange-50 text-orange-600 p-2 rounded-lg"><Radio size={16} /></div>
                ONGOING
              </div>
              <p className="text-sm text-slate-500 mt-2">Lelang Diikuti</p>
              <h3 className="text-2xl font-bold text-slate-800">12 <span className="text-sm font-normal text-slate-400">Auctions</span></h3>
            </div>
            <div className="bg-blue-900 text-white p-6 rounded-2xl shadow-sm flex flex-col gap-2 relative overflow-hidden">
               <div className="flex justify-between items-center text-xs font-semibold text-blue-200">
                <div className="bg-blue-800 p-2 rounded-lg text-white"><LayoutDashboard size={16} /></div>
                MILESTONE
              </div>
              <p className="text-sm text-blue-200 mt-2">Lelang Dimenangkan</p>
              <h3 className="text-2xl font-bold">45 <span className="text-sm font-normal text-blue-300">Success</span></h3>
            </div>
          </div>

          {/* Auction Grid */}
          <div className="mb-4 flex justify-between items-end">
            <div>
              <p className="text-xs font-bold text-blue-800 tracking-wider mb-1">MARKET DISCOVERY</p>
              <h2 className="text-2xl font-bold text-slate-800">Rekomendasi Lelang</h2>
            </div>
            <a href="#" className="text-sm font-semibold text-blue-600">Lihat Semua →</a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="bg-slate-900 rounded-xl h-40 mb-4 relative">
                <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">● LIVE NOW</span>
                <span className="absolute bottom-3 right-3 bg-white/90 text-slate-800 text-xs font-bold px-2 py-1 rounded">04:22:15</span>
              </div>
              <p className="text-xs text-slate-400 font-semibold mb-1">PELAGIC • 45KG</p>
              <h3 className="font-bold text-slate-800 leading-tight mb-4">Bluefin Tuna<br/>Supreme</h3>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-slate-400">Current Bid</p>
                  <p className="font-bold text-blue-800 text-lg">Rp 4.250.000</p>
                </div>
                <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"><Plus size={16} /></button>
              </div>
            </div>
             {/* Duplicate card structures for others as needed */}
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="bg-slate-100 rounded-xl h-40 mb-4 relative flex items-center justify-center">
                <span className="absolute top-3 left-3 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded">FEATURED</span>
                <span className="absolute bottom-3 right-3 bg-white/90 text-slate-800 text-xs font-bold px-2 py-1 rounded">12:05:30</span>
              </div>
              <p className="text-xs text-slate-400 font-semibold mb-1">CRUSTACEAN • 12KG</p>
              <h3 className="font-bold text-slate-800 leading-tight mb-4">Spiny Red Lobster<br/>&nbsp;</h3>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-slate-400">Current Bid</p>
                  <p className="font-bold text-blue-800 text-lg">Rp 2.100.000</p>
                </div>
                <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"><Plus size={16} /></button>
              </div>
            </div>
          </div>

          {/* Bottom Banner */}
          <div className="mt-8 bg-gradient-to-r from-slate-100 to-slate-200 p-8 rounded-3xl flex items-center justify-between">
            <div className="max-w-xl">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Need a high-volume trade?</h3>
              <p className="text-slate-500 text-sm">Access our exclusive institutional logistics and direct fleet connections for bulk fish trade with the LEKAN Pro.</p>
            </div>
            <div className="flex gap-4">
              <button className="px-6 py-3 bg-white text-slate-800 font-semibold rounded-xl border border-slate-200 shadow-sm">Contact Support</button>
              <button className="px-6 py-3 bg-blue-800 text-white font-semibold rounded-xl shadow-sm">Become a Merchant</button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}