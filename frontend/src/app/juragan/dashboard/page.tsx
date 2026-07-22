'use client';

import React, { useState, useEffect } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function JuraganDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/dashboard/juragan/stats');
        setStats(res.data.data);
      } catch (error) {
        console.error('Gagal mengambil stats dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const { todayIncome = 0, todayExpense = 0, targetSavings = 0 } = stats || {};

  return (
    <div className="space-y-6 md:space-y-8 animate-slide-up pb-10">
      
      {/* Mobile Greeting */}
      <div className="md:hidden pt-2">
        <h1 className="text-2xl font-bold text-slate-900">Halo {user?.name || 'Juragan'}!</h1>
        <p className="text-slate-500 text-sm mt-1">Selamat datang kembali</p>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden flex items-center text-slate-500 bg-white/60 border border-slate-200/60 px-4 py-3 rounded-2xl w-full shadow-sm">
        <Search className="w-5 h-5 mr-3 text-slate-400" />
        <input 
          type="text" 
          placeholder="Cari transaksi..." 
          className="bg-transparent border-none focus:outline-none text-sm w-full placeholder-slate-400 text-slate-700"
        />
      </div>

      {/* Welcome Banner */}
      <div className="glass-card rounded-3xl p-6 md:p-8 flex items-center justify-between border border-indigo-100">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-indigo-700">Ringkasan Hari Ini!</h2>
          <p className="text-sm md:text-base text-slate-500 mt-2 max-w-sm">Pantau performa dan keuangan warung Anda secara real-time.</p>
        </div>
        <div className="hidden sm:block">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center opacity-70">
            <span className="text-indigo-400 text-xs text-center font-bold px-2">Data Real-Time</span>
          </div>
        </div>
      </div>

      {/* Section Title */}
      <div className="flex justify-between items-center mt-8 mb-4">
        <h3 className="text-lg font-bold text-slate-800">Keuangan & Performa</h3>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        
        {/* Card 1: Omzet Kotor */}
        <div className="premium-gradient-bg p-5 md:p-7 rounded-3xl flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 shadow-lg shadow-indigo-500/20 col-span-2 sm:col-span-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <p className="text-xs md:text-sm font-semibold text-indigo-100 uppercase tracking-wider relative z-10">Omzet Kotor Hari Ini</p>
          <div className="mt-3 md:mt-4 mb-2 relative z-10">
            <span className="text-2xl md:text-4xl font-extrabold text-white">Rp {todayIncome.toLocaleString('id-ID')}</span>
          </div>
          <div className="mt-auto pt-4 relative z-10">
            <div className="w-full bg-indigo-900/30 rounded-full h-1.5 mb-2">
              <div className="bg-white h-1.5 rounded-full" style={{ width: '100%' }}></div>
            </div>
            <div className="flex justify-between text-[10px] md:text-xs text-indigo-100 font-medium">
              <span>Status</span>
              <span>Sedang Berjalan</span>
            </div>
          </div>
        </div>

        {/* Card 2: Target Tabungan */}
        <div className="bg-indigo-50/70 backdrop-blur-sm border border-indigo-100/50 p-5 md:p-7 rounded-3xl flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
          <p className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wider">Tabungan Disisihkan</p>
          <div className="mt-2 md:mt-4 mb-2">
            <span className="text-xl md:text-3xl font-extrabold text-slate-800">Rp {targetSavings.toLocaleString('id-ID')}</span>
          </div>
          <div className="mt-auto pt-4">
            <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
              <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              <span>Status</span>
              <span>Otomatis Dihitung</span>
            </div>
          </div>
        </div>

        {/* Card 3: Pengeluaran */}
        <div className="bg-rose-50/70 backdrop-blur-sm border border-rose-100/50 p-5 md:p-7 rounded-3xl flex flex-col justify-between group hover:-translate-y-1 transition-transform duration-300">
          <p className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wider">Pengeluaran Operasional</p>
          <div className="mt-2 md:mt-4 mb-2">
            <span className="text-xl md:text-3xl font-extrabold text-slate-800">Rp {todayExpense.toLocaleString('id-ID')}</span>
          </div>
          <div className="mt-auto pt-4">
            <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
              <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: todayExpense > 0 ? '100%' : '0%' }}></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              <span>Total Hari Ini</span>
              <span>{todayExpense > 0 ? 'Ada' : 'Kosong'}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
