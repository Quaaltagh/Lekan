import React from 'react';
import { LayoutDashboard, Upload, Activity, Wallet, Settings, Bell, Search, TrendingUp, TrendingDown, Plus } from 'lucide-react';
export default function FishermanDashboard() {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Sidebar - Same structure as Buyer but different links */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between">
        <div>
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-blue-900">LEKAN</h2>
            <div className="flex items-center mt-6 gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold">CS</div>
              <div>
                <p className="text-sm font-bold text-blue-900">Captain Sam</p>
                <p className="text-xs text-slate-500">Verified Merchant</p>
              </div>
            </div>
          </div>
          <nav className="p-4 space-y-1">
            <a href="#" className="flex items-center gap-3 bg-blue-50 text-blue-800 px-4 py-3 rounded-xl font-medium"><LayoutDashboard size={20} /> Dashboard</a>
            <a href="#" className="flex items-center gap-3 text-slate-500 hover:bg-slate-50 px-4 py-3 rounded-xl font-medium"><Upload size={20} /> Upload Lelang</a>
            <a href="#" className="flex items-center gap-3 text-slate-500 hover:bg-slate-50 px-4 py-3 rounded-xl font-medium"><Activity size={20} /> Status Lelang</a>
            <a href="#" className="flex items-center gap-3 text-slate-500 hover:bg-slate-50 px-4 py-3 rounded-xl font-medium"><Wallet size={20} /> Dompet</a>
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
          <div className="relative w-96">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input type="text" placeholder="Cari lelang atau ikan..." className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-4">
            <Bell className="text-slate-400" size={20} />
            <Wallet className="text-slate-400" size={20} />
            <div className="w-8 h-8 rounded-full bg-slate-800"></div>
          </div>
        </header>

        <div className="p-8 flex gap-8">
          
          {/* Left Column (Main Data) */}
          <div className="flex-1">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-50 text-blue-600 p-3 rounded-xl"><Activity size={20} /></div>
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded">LIVE</span>
                </div>
                <p className="text-sm text-slate-500">Active Auctions</p>
                <h3 className="text-2xl font-bold text-slate-800">12 <span className="text-sm font-normal text-slate-400">Lots</span></h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="bg-green-50 text-green-600 p-3 rounded-xl w-fit mb-4"><Wallet size={20} /></div>
                <p className="text-sm text-slate-500">Total Earnings</p>
                <h3 className="text-2xl font-bold text-slate-800">Rp 42.8M</h3>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="bg-orange-50 text-orange-600 p-3 rounded-xl w-fit mb-4"><Activity size={20} /></div>
                <p className="text-sm text-slate-500">Pending Payments</p>
                <h3 className="text-2xl font-bold text-slate-800">Rp 8.2M</h3>
              </div>
            </div>

            {/* List Lelang */}
            <div className="mb-4 flex justify-between items-end">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Daftar Lelang Terkini</h2>
                <p className="text-sm text-slate-500">Monitor hasil tangkapan Anda secara real-time.</p>
              </div>
              <a href="#" className="text-sm font-semibold text-blue-600">Lihat Semua →</a>
            </div>

            <div className="space-y-4">
              {/* List Item 1 */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-6 items-center">
                <div className="w-32 h-32 bg-slate-900 rounded-xl flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-slate-800">Tuna Bluefin Grade A</h3>
                    <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-1 rounded">● AKTIF</span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">CURRENT BID</p>
                      <p className="font-bold text-blue-800">Rp 12.500.000</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">BIDDERS</p>
                      <p className="font-bold text-slate-800">14 <span className="font-normal text-xs text-slate-500">Participants</span></p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">WEIGHT</p>
                      <p className="font-bold text-slate-800">85.4 kg</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">ENDS IN</p>
                      <p className="font-bold text-orange-600">14m 22s</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="flex-1 py-2 text-sm font-semibold text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 border border-slate-200">Details</button>
                    <button className="flex-1 py-2 text-sm font-semibold text-white bg-blue-800 rounded-lg hover:bg-blue-900">Boost Auction</button>
                  </div>
                </div>
              </div>

              {/* List Item 2 */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-6 items-center">
                <div className="w-32 h-32 bg-slate-900 rounded-xl flex-shrink-0 opacity-80"></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-slate-800">Ikan Kakap Merah Super</h3>
                    <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 rounded">SELESAI</span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">FINAL PRICE</p>
                      <p className="font-bold text-slate-800">Rp 4.200.000</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">BIDDERS</p>
                      <p className="font-bold text-slate-800">8 <span className="font-normal text-xs text-slate-500">Participants</span></p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">WEIGHT</p>
                      <p className="font-bold text-slate-800">22.0 kg</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">STATUS</p>
                      <p className="font-bold text-green-600">Paid</p>
                    </div>
                  </div>
                  <button className="w-full py-2 text-sm font-semibold text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 border border-slate-200">Unduh Faktur</button>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column (Sidebar Widgets) */}
          <div className="w-80 space-y-6">
            {/* CTA Box */}
            <div className="bg-blue-900 rounded-3xl p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-2 leading-tight">Siap Melantai di Bursa?</h3>
                <p className="text-blue-200 text-sm mb-6">Unggah hasil tangkapan Anda hari ini dan dapatkan harga terbaik dari pembeli global.</p>
                <button className="w-full py-3 bg-white text-blue-900 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-50">
                  <Plus size={18} /> Upload Lelang Baru
                </button>
              </div>
            </div>

            {/* Market Trend */}
            <div>
              <p className="text-xs font-bold text-slate-400 tracking-wider mb-4">MARKET TREND</p>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Cakalang
                  </div>
                  <span className="text-green-600 text-sm font-bold flex items-center gap-1">+12.4%</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Udang Vaname
                  </div>
                  <span className="text-red-500 text-sm font-bold flex items-center gap-1">-2.1%</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Kerapu
                  </div>
                  <span className="text-green-600 text-sm font-bold flex items-center gap-1">+8.5%</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}