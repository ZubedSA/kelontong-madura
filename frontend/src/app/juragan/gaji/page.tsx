'use client';

import { useToast } from '@/components/ui/toast-context';

import React, { useState, useEffect } from 'react';
import { Wallet, Save, Shield, Filter } from 'lucide-react';
import api from '@/lib/api';

export default function GajiPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>({
    profitShareJuragan: 50,
    profitSharePenjaga: 50,
  });

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [simulasiTabungan, setSimulasiTabungan] = useState<number | string>(0);
  
  const [salaryHistory, setSalaryHistory] = useState<any[]>([]);
  const [isSavingHistory, setIsSavingHistory] = useState(false);

  const fetchSettingsAndSummary = async () => {
    try {
      setIsLoading(true);
      // Fetch Settings
      const resSettings = await api.get('/settings');
      const data = resSettings.data;
      setFormData({
        profitShareJuragan: data.financialSettings?.profitShareJuragan || 50,
        profitSharePenjaga: data.financialSettings?.profitSharePenjaga || 50,
      });

      // Fetch History
      await fetchHistory();

      // Fetch Summary
      await fetchSummary(selectedMonth, selectedYear);

    } catch (error) {
      console.error('Gagal mengambil data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/dashboard/juragan/salary-history');
      setSalaryHistory(res.data.data || []);
    } catch (error) {
      console.error('Gagal mengambil riwayat gaji', error);
    }
  };

  const fetchSummary = async (month: number, year: number) => {
    try {
      const resSummary = await api.get(`/dashboard/juragan/summary?month=${month}&year=${year}`);
      const summaryData = resSummary.data.data;
      setSimulasiTabungan(summaryData.monthlySavings || 0);
    } catch (error) {
      console.error('Gagal mengambil summary', error);
    }
  };

  useEffect(() => {
    fetchSettingsAndSummary();
  }, []);

  const handleJuraganShareChange = (valStr: string) => {
    if (valStr === '') {
      setFormData({ profitShareJuragan: '', profitSharePenjaga: 100 });
      return;
    }
    const val = Number(valStr);
    const juragan = Math.max(0, Math.min(100, val));
    const penjaga = 100 - juragan;
    setFormData({ profitShareJuragan: juragan, profitSharePenjaga: penjaga });
  };

  const handlePenjagaShareChange = (valStr: string) => {
    if (valStr === '') {
      setFormData({ profitShareJuragan: 100, profitSharePenjaga: '' });
      return;
    }
    const val = Number(valStr);
    const penjaga = Math.max(0, Math.min(100, val));
    const juragan = 100 - penjaga;
    setFormData({ profitShareJuragan: juragan, profitSharePenjaga: penjaga });
  };

  const handleMonthChange = (e: any) => {
    const m = Number(e.target.value);
    setSelectedMonth(m);
    fetchSummary(m, selectedYear);
  };

  const handleYearChange = (e: any) => {
    const y = Number(e.target.value);
    setSelectedYear(y);
    fetchSummary(selectedMonth, y);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload = {
        profitShareJuragan: Number(formData.profitShareJuragan) || 0,
        profitSharePenjaga: Number(formData.profitSharePenjaga) || 0,
      };
      await api.put('/settings', payload);
      toastSuccess('Pengaturan gaji berhasil disimpan!');
    } catch (error: any) {
      toastError(error.response?.data?.message || 'Gagal menyimpan pengaturan');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const porsiPenjaga = Number(formData.profitSharePenjaga) || 0;
  const porsiJuragan = Number(formData.profitShareJuragan) || 0;
  const tabungan = Number(simulasiTabungan) || 0;

  const gajiPenjaga = Math.floor(tabungan * porsiPenjaga / 100);
  const hakJuragan = Math.floor(tabungan * porsiJuragan / 100);

  const handleSaveHistory = async () => {
    try {
      setIsSavingHistory(true);
      const payload = {
        month: selectedMonth,
        year: selectedYear,
        totalSavings: tabungan,
        porsiJuragan,
        porsiPenjaga,
        gajiPenjaga,
        hakJuragan,
      };
      await api.post('/dashboard/juragan/salary-history', payload);
      toastSuccess('Laporan gaji bulan ini berhasil disimpan!');
      fetchHistory();
    } catch (error: any) {
      toastError(error.response?.data?.message || 'Gagal menyimpan laporan gaji');
    } finally {
      setIsSavingHistory(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Sistem Gaji & Tabungan</h2>
          <p className="text-sm md:text-base text-slate-500 mt-1 md:mt-2 font-medium">Atur persentase pembagian tabungan akhir bulan.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto premium-gradient-bg text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:scale-105 transition-all duration-300 flex items-center justify-center disabled:opacity-50"
        >
          <Save className="w-5 h-5 mr-2" />
          {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm relative overflow-hidden max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
           <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
             <Shield className="w-6 h-6" />
           </div>
           <div>
             <h3 className="font-bold text-slate-800">Persentase Bagi Hasil</h3>
             <p className="text-xs text-slate-500">Alokasi dari total tabungan warung</p>
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Porsi Gaji Penjaga</label>
            <div className="relative">
              <input 
                type="number" 
                value={formData.profitSharePenjaga}
                onChange={(e) => handlePenjagaShareChange(e.target.value)}
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Hak Juragan</label>
            <div className="relative">
              <input 
                type="number" 
                value={formData.profitShareJuragan}
                onChange={(e) => handleJuraganShareChange(e.target.value)}
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <h4 className="text-sm font-bold text-slate-800 flex items-center">
              <Wallet className="w-4 h-4 mr-2 text-indigo-600" /> Kalkulator & Laporan Gaji
            </h4>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                value={selectedMonth} 
                onChange={handleMonthChange}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:border-indigo-500"
              >
                {Array.from({length: 12}).map((_, i) => (
                  <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>
                ))}
              </select>
              <select 
                value={selectedYear} 
                onChange={handleYearChange}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:border-indigo-500"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
              </select>
            </div>
          </div>

          <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50">
            <div className="mb-4">
              <label className="block text-xs font-semibold text-indigo-900/70 uppercase tracking-wider mb-2">Total Tabungan Terkumpul</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 font-bold">Rp</span>
                <input 
                  type="number" 
                  value={simulasiTabungan}
                  disabled
                  className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Gaji Penjaga ({porsiPenjaga}%)</p>
                <p className="text-lg font-bold text-emerald-600">
                  Rp {gajiPenjaga.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Hak Juragan ({porsiJuragan}%)</p>
                <p className="text-lg font-bold text-indigo-600">
                  Rp {hakJuragan.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
            
            <button 
              onClick={handleSaveHistory}
              disabled={isSavingHistory || tabungan === 0}
              className="mt-6 w-full bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              <Save className="w-5 h-5 mr-2" />
              {isSavingHistory ? 'Menyimpan Laporan...' : 'Simpan Laporan Gaji Bulan Ini'}
            </button>
          </div>
        </div>
      </div>

      {/* Riwayat Gaji */}
      <div>
        <div className="flex justify-between items-center mt-8 mb-4">
          <h3 className="text-lg font-bold text-slate-800">Riwayat Laporan Gaji</h3>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {salaryHistory.map((item) => (
              <div key={item.id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-colors gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 flex items-center gap-2">
                      Bulan: {new Date(0, item.month - 1).toLocaleString('id-ID', { month: 'long' })} {item.year}
                    </p>
                    <p className="text-xs text-slate-500">
                      Total Tabungan: Rp {item.totalSavings.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 md:gap-8 shrink-0 text-right">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Gaji Penjaga ({item.porsiPenjaga}%)</p>
                    <p className="text-sm md:text-base font-bold text-emerald-600">Rp {item.gajiPenjaga.toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Hak Juragan ({item.porsiJuragan}%)</p>
                    <p className="text-sm md:text-base font-bold text-indigo-600">Rp {item.hakJuragan.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {salaryHistory.length === 0 && (
              <div className="p-8 text-center text-slate-500">Belum ada riwayat gaji yang disimpan.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
