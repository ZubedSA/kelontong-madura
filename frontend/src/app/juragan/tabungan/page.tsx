'use client';

import { useToast } from '@/components/ui/toast-context';

import React, { useState, useEffect } from 'react';
import { Landmark, TrendingUp, Calendar, Edit2, X, Save } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

export default function TabunganPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [summaries, setSummaries] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // States for Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSummary, setEditingSummary] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({ targetSavings: 0 });
  const [isSaving, setIsSaving] = useState(false);
  
  // States for Date Filter
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // States for Settings Modal
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState<{ savingsType: string; savingsValue: number | string }>({
    savingsType: 'FIXED',
    savingsValue: 0,
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [resSettings, resSummaries] = await Promise.all([
        api.get('/settings'),
        api.get('/dashboard/juragan/daily-summaries')
      ]);
      setSettings(resSettings.data.financialSettings);
      setSummaries(resSummaries.data.data);
    } catch (error) {
      console.error('Gagal mengambil data tabungan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (summary: any) => {
    setEditingSummary(summary);
    setEditForm({ targetSavings: summary.targetSavings });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      setIsSaving(true);
      await api.put(`/dashboard/juragan/daily-summaries/${editingSummary.id}`, { targetSavings: Number(editForm.targetSavings) || 0 });
      setIsEditModalOpen(false);
      fetchData(); // Refresh data
    } catch (error) {
      toastError('Gagal menyimpan perubahan tabungan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenSettingsModal = () => {
    setSettingsForm({
      savingsType: settings?.savingsType || 'FIXED',
      savingsValue: settings?.savingsValue || 0,
    });
    setIsSettingsModalOpen(true);
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      await api.put('/settings', settingsForm);
      setIsSettingsModalOpen(false);
      toastSuccess('Aturan tabungan berhasil diperbarui!');
      fetchData();
    } catch (error) {
      toastError('Gagal memperbarui aturan tabungan');
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

  // Kalkulasi data bulan ini
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const summariesThisMonth = summaries.filter((s) => {
    const d = new Date(s.summaryDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const terkumpul = summariesThisMonth.reduce((sum, s) => sum + s.targetSavings, 0);
  
  const targetBulanIni = 5000000; 
  const persentase = Math.min((terkumpul / targetBulanIni) * 100, 100);

  // Filter list of summaries
  const filteredSummaries = summaries.filter(s => {
    let matchStartDate = true;
    let matchEndDate = true;
    
    if (startDate) {
      matchStartDate = new Date(s.summaryDate) >= new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchEndDate = new Date(s.summaryDate) <= end;
    }
    
    return matchStartDate && matchEndDate;
  });

  return (
    <div className="space-y-6 md:space-y-8 animate-slide-up pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Tabungan Warung</h2>
          <p className="text-sm md:text-base text-slate-500 mt-1 md:mt-2 font-medium">Pantau akumulasi target tabungan harian Anda.</p>
        </div>
        <button className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center">
          <Calendar className="w-5 h-5 mr-2 text-slate-400" />
          {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
        </button>
      </div>

      {/* Main Card */}
      <div className="premium-gradient-bg rounded-3xl p-6 md:p-10 relative overflow-hidden shadow-xl shadow-indigo-500/20 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between relative z-10 gap-8">
          <div className="flex-1 w-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                <Landmark className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-indigo-100 uppercase tracking-wider text-sm">Total Terkumpul (Bulan Ini)</h3>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4">Rp {terkumpul.toLocaleString('id-ID')}</h1>
            
            <div className="bg-indigo-900/40 p-4 rounded-2xl border border-indigo-400/20 backdrop-blur-sm">
              <div className="flex justify-between text-sm font-medium text-indigo-100 mb-2">
                <span>Progress Bulanan</span>
                <span>{persentase.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-indigo-900/60 rounded-full h-2 mb-2">
                <div className="bg-white h-2 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" style={{ width: `${persentase}%` }}></div>
              </div>
              <p className="text-xs text-indigo-200">
                Target Estimasi: Rp {targetBulanIni.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
          
          <div className="w-full md:w-64 bg-white/10 p-6 rounded-2xl border border-white/20 backdrop-blur-md">
             <h4 className="font-semibold mb-4 text-center">Aturan Saat Ini</h4>
             <div className="space-y-4">
               <div>
                 <p className="text-xs text-indigo-200 mb-1">Tipe Potongan</p>
                 <p className="font-bold">
                   {settings?.savingsType === 'PERCENTAGE' ? `Persentase (${settings?.savingsValue}%)` : `Tetap (Rp ${settings?.savingsValue?.toLocaleString('id-ID')})`}
                 </p>
               </div>
               <div>
                 <p className="text-xs text-indigo-200 mb-1">Dihitung Dari</p>
                 <p className="font-bold">Omzet Kotor</p>
               </div>
             </div>
             <button onClick={handleOpenSettingsModal} className="block text-center w-full mt-6 bg-white text-indigo-600 font-bold py-2 rounded-xl text-sm hover:bg-indigo-50 transition-colors">
               Ubah Aturan
             </button>
          </div>
        </div>
      </div>

      {/* Riwayat */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-8 mb-4 gap-4">
          <h3 className="text-lg font-bold text-slate-800">Riwayat Setoran (Tutup Hari)</h3>
          <div className="flex items-center gap-2 w-full md:w-auto">
             <input 
               type="date"
               value={startDate}
               onChange={(e) => setStartDate(e.target.value)}
               className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all flex-1 md:w-36"
             />
             <span className="text-slate-400 text-sm">-</span>
             <input 
               type="date"
               value={endDate}
               onChange={(e) => setEndDate(e.target.value)}
               className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all flex-1 md:w-36"
             />
           </div>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {filteredSummaries.map((item) => (
              <div key={item.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 flex items-center gap-2">
                      {new Date(item.summaryDate).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                      {item.isEdited && (
                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 text-[10px] rounded-md font-bold uppercase">
                          Diedit
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">Tutup Hari</p>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 gap-1">
                  <p className="font-extrabold text-emerald-600">+ Rp {item.targetSavings.toLocaleString('id-ID')}</p>
                  <button 
                    onClick={() => handleEditClick(item)}
                    className="flex items-center text-[10px] md:text-xs text-indigo-500 hover:text-indigo-700 font-semibold transition-colors"
                  >
                    <Edit2 className="w-3 h-3 mr-1" /> Edit
                  </button>
                </div>
              </div>
            ))}
            
            {filteredSummaries.length === 0 && (
              <div className="p-8 text-center text-slate-500">Belum ada riwayat tabungan.</div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Edit Tabungan Harian</h3>
            <p className="text-sm text-slate-500 mb-6">
              Tanggal: {new Date(editingSummary?.summaryDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nominal Tabungan (Rp)</label>
                <input 
                  type="number" 
                  value={editForm.targetSavings}
                  onChange={(e) => setEditForm({...editForm, targetSavings: e.target.value === '' ? '' : Number(e.target.value)})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
                />
                <p className="text-[10px] text-rose-500 mt-2 italic">* Data ini akan ditandai dengan label 'Diedit' setelah disimpan.</p>
              </div>
            </div>

            <button 
              onClick={handleSaveEdit}
              disabled={isSaving}
              className="mt-8 w-full premium-gradient-bg text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:scale-105 transition-all duration-300 flex items-center justify-center disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : <><Save className="w-5 h-5 mr-2" /> Simpan Perubahan</>}
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setIsSettingsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-800 mb-6">Ubah Aturan Tabungan</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tipe Potongan</label>
                <select 
                  value={settingsForm.savingsType}
                  onChange={(e) => setSettingsForm({...settingsForm, savingsType: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                >
                  <option value="FIXED">Nominal Tetap (Rp)</option>
                  <option value="PERCENTAGE">Persentase (%)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Besaran Potongan ({settingsForm.savingsType === 'FIXED' ? 'Rp' : '%'})
                </label>
                <input 
                  type="number" 
                  value={settingsForm.savingsValue}
                  onChange={(e) => setSettingsForm({...settingsForm, savingsValue: e.target.value === '' ? '' : Number(e.target.value)})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
                />
              </div>
            </div>

            <button 
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="mt-8 w-full premium-gradient-bg text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:scale-105 transition-all duration-300 flex items-center justify-center disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : <><Save className="w-5 h-5 mr-2" /> Simpan Aturan</>}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
