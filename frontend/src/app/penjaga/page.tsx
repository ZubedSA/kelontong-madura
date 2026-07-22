'use client';

import { useToast } from '@/components/ui/toast-context';

import React, { useState } from 'react';
import { LogOut, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function PenjagaDashboard() {
  const { success: toastSuccess, error: toastError } = useToast();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'INCOME' | 'RESTOCK' | 'EXPENSE' | 'SAVINGS' | 'CLOSE'>('INCOME');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  
  const queryClient = useQueryClient();

  // Queries
  const { data: shiftData, isLoading } = useQuery({
    queryKey: ['active-shift'],
    queryFn: async () => {
      const res = await api.get('/shifts/active');
      return res.data;
    },
  });

  const activeShift = shiftData?.data;
  const tenantSettings = shiftData?.settings;

  let omzet = 0;
  if (activeShift && activeShift.transactions) {
    activeShift.transactions.forEach((tx: any) => {
      if (tx.type === 'INCOME') {
        omzet += tx.amount;
      }
    });
  }

  // Mutations
  const openShiftMutation = useMutation({
    mutationFn: async () => {
      return await api.post('/shifts/open', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
    },
    onError: () => {
      toastError('Gagal membuka shift');
    }
  });

  const submitTransactionMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.post('/transactions', payload);
    },
    onMutate: async (newTx) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['active-shift'] });
      const previousData = queryClient.getQueryData(['active-shift']);
      
      queryClient.setQueryData(['active-shift'], (old: any) => {
        if (!old?.data) return old;
        
        // Buat fake transaction object untuk ditampilkan secara instan
        const optimisticTx = {
          id: `temp-${Date.now()}`,
          type: newTx.type,
          amount: newTx.amount,
          description: newTx.description,
          createdAt: new Date().toISOString(),
          isEdited: false,
        };

        const updatedTransactions = [optimisticTx, ...(old.data.transactions || [])];

        return {
          ...old,
          data: {
            ...old.data,
            transactions: updatedTransactions
          }
        };
      });

      setIsModalOpen(false); // Langsung tutup modal, kerasa sangat instan
      return { previousData };
    },
    onError: (err, newTx, context) => {
      queryClient.setQueryData(['active-shift'], context?.previousData);
      toastError('Gagal mencatat transaksi');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
    }
  });

  const closeShiftMutation = useMutation({
    mutationFn: async (shiftId: string) => {
      return await api.put(`/shifts/${shiftId}/close`);
    },
    onSuccess: (res) => {
      toastSuccess(res.data.message || 'Shift ditutup.');
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['active-shift'] });
    },
    onError: () => {
      toastError('Gagal menutup shift');
    }
  });

  const handleOpenShift = () => {
    openShiftMutation.mutate();
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const openModal = (type: 'INCOME' | 'RESTOCK' | 'EXPENSE' | 'SAVINGS' | 'CLOSE') => {
    setModalType(type);
    if (type === 'INCOME') {
      setAmount(omzet > 0 ? omzet.toString() : '');
    } else {
      setAmount('');
    }
    setDescription('');
    setIsModalOpen(true);
  };

  const handleSubmitTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    submitTransactionMutation.mutate({
      shiftId: activeShift.id,
      type: modalType,
      amount: Number(amount),
      description: description || undefined,
    });
  };

  const handleCloseShift = () => {
    if (!activeShift) return;
    closeShiftMutation.mutate(activeShift.id);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="bg-indigo-600 px-6 py-8 rounded-b-3xl shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10"></div>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-indigo-100 text-sm font-medium mb-1">
              {activeShift ? 'Shift Berjalan' : 'Belum Mulai Shift'}
            </p>
            <h1 className="text-white text-2xl font-bold tracking-tight">Halo, {user?.name || 'Karyawan'}!</h1>
            {activeShift && (
              <p className="text-indigo-100 text-xs mt-2">{activeShift.warung?.name || 'Toko'} - Mulai: {new Date(activeShift.startTime).toLocaleTimeString()}</p>
            )}
          </div>
          <button onClick={handleLogout} className="bg-white/20 p-2 rounded-full text-white hover:bg-white/30 transition">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {!activeShift ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-10 relative z-20">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 max-w-sm w-full text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <RefreshCw className="w-10 h-10 text-indigo-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Mulai Hari Ini</h2>
            <p className="text-slate-500 text-sm mb-8">Buka shift untuk mulai mencatat penjualan dan mengatur keuangan toko.</p>
            <button 
              onClick={handleOpenShift}
              disabled={openShiftMutation.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-md shadow-indigo-200 active:scale-95 disabled:opacity-50"
            >
              {openShiftMutation.isPending ? 'Membuka...' : 'Buka Shift Sekarang'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="px-6 -mt-6 relative z-20">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider text-center mb-2">Estimasi Omzet Saat Ini</p>
              <div className="text-center">
                <span className="text-4xl font-extrabold text-slate-800 tracking-tight">
                  Rp {omzet.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 px-6 py-8 space-y-6">
            <div id="aktivitas">
              <h3 className="text-slate-800 font-bold mb-4">Aktivitas Cepat</h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button 
                  onClick={() => openModal('INCOME')}
                  className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col items-center justify-center text-emerald-700 hover:bg-emerald-100 transition shadow-sm active:scale-95 group"
                >
                  <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">💰</span>
                  <span className="font-semibold text-xs sm:text-sm">Catat Omzet</span>
                </button>
                <button 
                  onClick={() => openModal('RESTOCK')}
                  className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex flex-col items-center justify-center text-amber-700 hover:bg-amber-100 transition shadow-sm active:scale-95 group"
                >
                  <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📦</span>
                  <span className="font-semibold text-xs sm:text-sm">Belanja Stok</span>
                </button>
                <button 
                  onClick={() => openModal('EXPENSE')}
                  className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex flex-col items-center justify-center text-rose-700 hover:bg-rose-100 transition shadow-sm active:scale-95 group"
                >
                  <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">💸</span>
                  <span className="font-semibold text-xs sm:text-sm">Operasional</span>
                </button>
                <button 
                  onClick={() => openModal('SAVINGS')}
                  className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex flex-col items-center justify-center text-blue-700 hover:bg-blue-100 transition shadow-sm active:scale-95 group"
                >
                  <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">🏦</span>
                  <span className="font-semibold text-xs sm:text-sm">Cek Tabungan</span>
                </button>
              </div>
              
              <button 
                onClick={() => openModal('CLOSE')}
                className="mt-4 w-full bg-slate-800 border border-slate-700 p-4 rounded-2xl flex items-center justify-center text-white hover:bg-slate-700 transition shadow-sm active:scale-95 group"
              >
                <span className="text-xl mr-2 group-hover:scale-110 transition-transform">🔒</span>
                <span className="font-bold">Tutup Harian</span>
              </button>
            </div>
            
            {/* Riwayat Belanja / Transaksi */}
            <div id="riwayat" className="mt-8">
              <h3 className="text-slate-800 font-bold mb-4">Riwayat Transaksi</h3>
              {activeShift.transactions && activeShift.transactions.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto pb-4 pr-2">
                  {activeShift.transactions.map((tx: any, idx: number) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                          tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' :
                          tx.type === 'RESTOCK' ? 'bg-amber-100 text-amber-600' :
                          tx.type === 'EXPENSE' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {tx.type === 'INCOME' && '💰'}
                          {tx.type === 'RESTOCK' && '📦'}
                          {tx.type === 'EXPENSE' && '💸'}
                          {tx.type === 'SAVINGS' && '🏦'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 flex items-center">
                            {tx.type === 'INCOME' ? 'Total Omzet Harian' :
                             tx.type === 'RESTOCK' ? 'Belanja Stok' :
                             tx.type === 'EXPENSE' ? 'Operasional' : 'Tabungan'}
                            {tx.isEdited && (
                              <span className="ml-2 px-1.5 py-0.5 bg-rose-100 text-rose-600 text-[10px] rounded-md font-bold uppercase">
                                Diedit
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-1">{tx.description || '-'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${
                          tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-700'
                        }`}>
                          {tx.type === 'INCOME' ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-slate-100/50 rounded-2xl border border-slate-100 border-dashed">
                  <p className="text-slate-500 text-sm">Belum ada transaksi</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-white rounded-2xl md:rounded-3xl w-full max-w-sm max-h-full flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {modalType === 'CLOSE' ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Tutup Shift?</h3>
                <p className="text-slate-500 text-sm mb-6">
                  Apakah Anda yakin ingin menutup shift hari ini? Anda harus menyetor hasil dan tidak bisa mencatat transaksi lagi untuk shift ini.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleCloseShift}
                    disabled={closeShiftMutation.isPending}
                    className="flex-1 py-3 rounded-xl font-semibold text-white bg-slate-800 hover:bg-slate-900 transition disabled:opacity-50"
                  >
                    {closeShiftMutation.isPending ? 'Memproses...' : 'Tutup Shift'}
                  </button>
                </div>
              </div>
            ) : modalType === 'SAVINGS' ? (
              <div className="p-5 md:p-6 text-center overflow-y-auto hide-scrollbar">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shrink-0">
                  <span className="text-3xl">🏦</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Target Tabungan</h3>
                <p className="text-slate-500 text-sm mb-4">
                  Dihitung otomatis berdasarkan aturan yang ditetapkan oleh Juragan.
                </p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 text-left">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500">Aturan Tabungan:</span>
                    <span className="font-semibold text-slate-800">
                      {tenantSettings?.savingsType === 'PERCENTAGE' ? `${tenantSettings?.savingsValue}% dari Omzet` : `Tetap Rp ${tenantSettings?.savingsValue?.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500">Omzet Saat Ini:</span>
                    <span className="font-semibold text-slate-800">Rp {omzet.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="w-full h-px bg-slate-200 my-3"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700 font-bold text-sm">Harus Disisihkan:</span>
                    <span className="font-extrabold text-blue-600 text-xl">
                      Rp {tenantSettings?.savingsType === 'PERCENTAGE' 
                        ? (omzet * (tenantSettings?.savingsValue / 100)).toLocaleString('id-ID') 
                        : (tenantSettings?.savingsValue || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
                >
                  Mengerti
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitTransaction} className="flex flex-col h-full">
                <div className={`p-5 md:p-6 border-b shrink-0 ${
                  modalType === 'INCOME' ? 'bg-emerald-500' : 
                  modalType === 'RESTOCK' ? 'bg-amber-500' : 'bg-rose-500'
                }`}>
                  <h3 className="text-lg font-bold text-white flex items-center justify-between">
                    {modalType === 'INCOME' && 'Total Omzet Harian'}
                    {modalType === 'RESTOCK' && 'Catat Belanja Stok'}
                    {modalType === 'EXPENSE' && 'Catat Operasional'}
                  </h3>
                </div>
                <div className="p-5 md:p-6 space-y-4 overflow-y-auto hide-scrollbar">
                  {modalType === 'INCOME' && (
                    <div className="bg-blue-50 text-blue-700 p-3 rounded-xl text-xs mb-2">
                      Masukkan total omzet keseluruhan hari ini. Jika Anda sebelumnya sudah memasukkan angka, menginput angka baru di sini akan menimpanya.
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nominal (Rp)</label>
                    <input 
                      type="number" 
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold"
                      placeholder="Contoh: 50000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Keterangan (Opsional)</label>
                    <input 
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder="Contoh: Beli es batu / Shift pagi"
                    />
                  </div>
                  
                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-3 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      disabled={submitTransactionMutation.isPending}
                      className={`flex-1 py-3 rounded-xl font-semibold text-white transition disabled:opacity-50 ${
                        modalType === 'INCOME' ? 'bg-emerald-600 hover:bg-emerald-700' : 
                        modalType === 'RESTOCK' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-rose-600 hover:bg-rose-700'
                      }`}
                    >
                      {submitTransactionMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
