'use client';

import { CalendarDays, Download, BarChart3, TrendingUp, Wallet } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function LaporanPage() {
  const { data: response, isLoading } = useQuery({
    queryKey: ['daily-summaries'],
    queryFn: async () => {
      const res = await api.get('/dashboard/juragan/daily-summaries');
      return res.data;
    }
  });

  const laporanList = response?.data || [];

  // Calculate stats
  const hariKerja = laporanList.length;
  
  const totalOmzetAll = laporanList.reduce((sum: number, l: any) => sum + l.totalIncome, 0);
  const avgOmzet = hariKerja > 0 ? totalOmzetAll / hariKerja : 0;
  
  const totalBelanjaAll = laporanList.reduce((sum: number, l: any) => sum + l.totalRestock, 0);
  const avgBelanja = hariKerja > 0 ? totalBelanjaAll / hariKerja : 0;
  
  const grossMargin = totalOmzetAll > 0 ? ((totalOmzetAll - totalBelanjaAll) / totalOmzetAll) * 100 : 0;

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Laporan Harian</h2>
          <p className="text-sm md:text-base text-slate-500 mt-1 md:mt-2 font-medium">Rekapitulasi tutup hari dari seluruh warung Anda.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none premium-gradient-bg text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:scale-105 transition-all duration-300 flex items-center justify-center">
            <Download className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Download Excel</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group hover:border-indigo-200 transition-colors">
           <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
             <CalendarDays className="w-5 h-5" />
           </div>
           <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Hari Kerja</p>
           <p className="text-xl font-extrabold text-slate-800">{hariKerja} Hari</p>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group hover:border-emerald-200 transition-colors">
           <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
             <TrendingUp className="w-5 h-5" />
           </div>
           <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Rata-rata Omzet</p>
           <p className="text-xl font-extrabold text-slate-800">Rp {avgOmzet.toLocaleString('id-ID', {maximumFractionDigits: 0})}</p>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group hover:border-amber-200 transition-colors">
           <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
             <BarChart3 className="w-5 h-5" />
           </div>
           <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Rata-rata Belanja</p>
           <p className="text-xl font-extrabold text-slate-800">Rp {avgBelanja.toLocaleString('id-ID', {maximumFractionDigits: 0})}</p>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group hover:border-blue-200 transition-colors">
           <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
             <Wallet className="w-5 h-5" />
           </div>
           <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Margin Kasar</p>
           <p className="text-xl font-extrabold text-slate-800">{grossMargin.toFixed(1)}%</p>
        </div>
      </div>

      {/* Data List / Table */}
      <div className="bg-white md:rounded-3xl border-y md:border border-slate-100 shadow-sm overflow-hidden -mx-4 md:mx-0">
        {/* Mobile View (Cards) */}
        <div className="md:hidden flex flex-col divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-10 text-center text-slate-500">Memuat data laporan...</div>
          ) : laporanList.length === 0 ? (
            <div className="p-10 text-center text-slate-500">Belum ada laporan harian. Akun ini masih baru.</div>
          ) : laporanList.map((row: any) => (
            <div key={row.id} className="p-5 flex flex-col gap-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800 text-lg">
                  {new Date(row.summaryDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
                <span className={`inline-flex px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-wide ${
                  row.status === 'FINAL' ? 'bg-emerald-100 text-emerald-700' : 
                  row.status === 'DRAFT' ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {row.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block text-xs font-semibold uppercase mb-1">Omzet</span>
                  <span className="font-bold text-emerald-600">Rp {row.totalIncome.toLocaleString('id-ID')}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block text-xs font-semibold uppercase mb-1">Belanja Stok</span>
                  <span className="font-bold text-amber-600">Rp {row.totalRestock.toLocaleString('id-ID')}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block text-xs font-semibold uppercase mb-1">Operasional</span>
                  <span className="font-bold text-rose-600">Rp {row.totalExpense.toLocaleString('id-ID')}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block text-xs font-semibold uppercase mb-1">Tabungan</span>
                  <span className="font-bold text-blue-600">Rp {row.targetSavings.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View (Table) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 md:p-6 font-semibold rounded-tl-3xl">Tanggal</th>
                <th className="p-4 md:p-6 font-semibold">Omzet</th>
                <th className="p-4 md:p-6 font-semibold">Belanja Stok</th>
                <th className="p-4 md:p-6 font-semibold">Operasional</th>
                <th className="p-4 md:p-6 font-semibold">Tabungan</th>
                <th className="p-4 md:p-6 font-semibold text-center rounded-tr-3xl">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500">
                    Memuat data laporan...
                  </td>
                </tr>
              ) : laporanList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500">
                    Belum ada laporan harian. Akun ini masih baru.
                  </td>
                </tr>
              ) : laporanList.map((row: any) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4 md:p-6 font-bold text-slate-800">
                    {new Date(row.summaryDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </td>
                  <td className="p-4 md:p-6 font-semibold text-emerald-600">Rp {row.totalIncome.toLocaleString('id-ID')}</td>
                  <td className="p-4 md:p-6 font-semibold text-amber-600">Rp {row.totalRestock.toLocaleString('id-ID')}</td>
                  <td className="p-4 md:p-6 font-semibold text-rose-600">Rp {row.totalExpense.toLocaleString('id-ID')}</td>
                  <td className="p-4 md:p-6 font-semibold text-blue-600">Rp {row.targetSavings.toLocaleString('id-ID')}</td>
                  <td className="p-4 md:p-6 text-center">
                    <span className={`inline-flex px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-wide ${
                      row.status === 'FINAL' ? 'bg-emerald-100 text-emerald-700' : 
                      row.status === 'DRAFT' ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
