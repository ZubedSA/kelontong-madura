'use client';

import { useToast } from '@/components/ui/toast-context';

import React, { useState, useEffect } from 'react';
import { Store, Save } from 'lucide-react';
import api from '@/lib/api';

export default function PengaturanPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    password: '',
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const resSettings = await api.get('/settings');
      const data = resSettings.data;
      setFormData({
        name: data.name || '',
        password: '',
      });
    } catch (error) {
      console.error('Gagal mengambil data', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      
      // Kirim hanya yang diisi
      const dataToSend: any = { name: formData.name };
      if (formData.password.trim() !== '') {
        dataToSend.password = formData.password;
      }
      
      await api.put('/settings', dataToSend);
      toastSuccess('Profil Toko berhasil disimpan!');
      setFormData({...formData, password: ''}); // Reset password field
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

  return (
    <div className="space-y-10 animate-fade-in pb-10 max-w-6xl">
      
      {/* Profil Toko */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Pengaturan Bisnis</h2>
            <p className="text-sm md:text-base text-slate-500 mt-1 md:mt-2 font-medium">Kelola informasi toko dan profil warung Anda.</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">Profil Toko</h3>
                <p className="text-xs text-slate-500">Informasi dasar warung</p>
              </div>
              <button 
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="premium-gradient-bg text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:scale-105 transition-all duration-300 flex items-center justify-center disabled:opacity-50"
              >
                <Save className="w-5 h-5 mr-2" />
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nama Usaha / Toko</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Password Baru</label>
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Kosongkan jika tidak ingin mengubah"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
                />
              </div>
            </div>
        </div>
      </section>
    </div>
  );
}
