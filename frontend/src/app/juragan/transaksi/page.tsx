'use client';

import { useToast } from '@/components/ui/toast-context';

import React, { useState } from 'react';
import { Search, Filter, Download, ArrowUpRight, ArrowDownRight, Package, Edit2, X, Save } from 'lucide-react';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function TransaksiPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('ALL');

  // States for Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTrx, setEditingTrx] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({ amount: 0, description: '' });

  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const res = await api.get('/transactions');
      return res.data;
    }
  });

  const transactions = transactionsData?.data || [];

  const updateTransactionMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await api.put(`/transactions/${editingTrx.id}`, payload);
    },
    onMutate: async (newTrx) => {
      await queryClient.cancelQueries({ queryKey: ['transactions'] });
      const previousData = queryClient.getQueryData(['transactions']);

      queryClient.setQueryData(['transactions'], (old: any) => {
        if (!old?.data) return old;
        const updatedList = old.data.map((t: any) => 
          t.id === editingTrx.id ? { ...t, ...newTrx, isEdited: true } : t
        );
        return { ...old, data: updatedList };
      });

      setIsEditModalOpen(false);
      return { previousData };
    },
    onError: (err, newTrx, context) => {
      queryClient.setQueryData(['transactions'], context?.previousData);
      toastError('Gagal menyimpan perubahan transaksi');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  });

  const handleEditClick = (trx: any) => {
    setEditingTrx(trx);
    setEditForm({ amount: trx.amount, description: trx.description || '' });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    updateTransactionMutation.mutate({
      amount: Number(editForm.amount) || 0,
      description: editForm.description
    });
  };

  // Filter & Stats calculation
  // Filter & Stats calculation
  const filteredTransactions = transactions.filter((t: any) => {
    const matchQuery = (t.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchStartDate = true;
    let matchEndDate = true;
    
    if (startDate) {
      matchStartDate = new Date(t.createdAt) >= new Date(startDate);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchEndDate = new Date(t.createdAt) <= end;
    }
    
    const matchTxType = txTypeFilter === 'ALL' || t.type === txTypeFilter;
    
    return matchQuery && matchStartDate && matchEndDate && matchTxType;
  });

  const totalIncome = filteredTransactions.filter((t: any) => t.type === 'INCOME').reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalRestock = filteredTransactions.filter((t: any) => t.type === 'RESTOCK').reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalExpense = filteredTransactions.filter((t: any) => t.type === 'EXPENSE').reduce((sum: number, t: any) => sum + t.amount, 0);

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Riwayat Transaksi</h2>
          <p className="text-sm md:text-base text-slate-500 mt-1 md:mt-2 font-medium">Lacak semua pergerakan uang masuk dan keluar.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none premium-gradient-bg text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:scale-105 transition-all duration-300 flex items-center justify-center">
            <Download className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 p-4 md:p-5 rounded-2xl">
          <p className="text-[10px] md:text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Total Pemasukan</p>
          <p className="text-lg md:text-2xl font-extrabold text-slate-800">Rp {totalIncome.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-4 md:p-5 rounded-2xl">
          <p className="text-[10px] md:text-xs text-amber-600 font-bold uppercase tracking-wider mb-1">Total Belanja</p>
          <p className="text-lg md:text-2xl font-extrabold text-slate-800">Rp {totalRestock.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-rose-50 border border-rose-100 p-4 md:p-5 rounded-2xl">
          <p className="text-[10px] md:text-xs text-rose-600 font-bold uppercase tracking-wider mb-1">Pengeluaran</p>
          <p className="text-lg md:text-2xl font-extrabold text-slate-800">Rp {totalExpense.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Search inside table */}
        {/* Search and Filter inside table */}
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row items-center gap-4 bg-slate-50/50">
           
           {/* Transaction Type Filters */}
           <div className="flex w-full md:w-auto gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar shrink-0">
             <button onClick={() => setTxTypeFilter('ALL')} className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${txTypeFilter === 'ALL' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Semua</button>
             <button onClick={() => setTxTypeFilter('INCOME')} className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${txTypeFilter === 'INCOME' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Pemasukan</button>
             <button onClick={() => setTxTypeFilter('RESTOCK')} className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${txTypeFilter === 'RESTOCK' ? 'bg-amber-600 text-white shadow-md shadow-amber-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Belanja Stok</button>
             <button onClick={() => setTxTypeFilter('EXPENSE')} className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${txTypeFilter === 'EXPENSE' ? 'bg-rose-600 text-white shadow-md shadow-rose-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Operasional</button>
           </div>

           <div className="flex-1 relative w-full">
             <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               placeholder="Cari deskripsi transaksi..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
             />
           </div>
           <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
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

        {isLoading ? (
          <div className="p-10 text-center text-slate-500">Memuat data transaksi...</div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {filteredTransactions.map((trx: any) => (
              <div key={trx.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    trx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' :
                    trx.type === 'RESTOCK' ? 'bg-amber-100 text-amber-600' :
                    'bg-rose-100 text-rose-600'
                  }`}>
                    {trx.type === 'INCOME' && <ArrowDownRight className="w-5 h-5 md:w-6 md:h-6" />}
                    {trx.type === 'RESTOCK' && <Package className="w-5 h-5 md:w-6 md:h-6" />}
                    {trx.type === 'EXPENSE' && <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm md:text-base group-hover:text-indigo-600 transition-colors">
                      {trx.description || (trx.type === 'INCOME' ? 'Pemasukan' : trx.type === 'RESTOCK' ? 'Belanja' : 'Pengeluaran')}
                      {trx.isEdited && (
                        <span className="ml-2 px-1.5 py-0.5 bg-rose-100 text-rose-600 text-[10px] rounded-md font-bold uppercase inline-block -translate-y-0.5">
                          Diedit
                        </span>
                      )}
                    </p>
                    <p className="text-xs md:text-sm text-slate-500">
                      {new Date(trx.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' })} • {new Date(trx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB
                      <span className="ml-2 px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-semibold text-slate-500">
                        Penjaga: {trx.shift?.tenantUser?.user?.name || 'Tidak diketahui'}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 gap-1">
                  <p className={`font-extrabold text-sm md:text-lg ${
                    trx.type === 'INCOME' ? 'text-emerald-600' :
                    trx.type === 'RESTOCK' ? 'text-amber-600' :
                    'text-rose-600'
                  }`}>
                    {trx.type === 'INCOME' ? '+' : '-'} Rp {trx.amount.toLocaleString('id-ID')}
                  </p>
                  <button 
                    onClick={() => handleEditClick(trx)}
                    className="flex items-center text-[10px] md:text-xs text-indigo-500 hover:text-indigo-700 font-semibold transition-colors"
                  >
                    <Edit2 className="w-3 h-3 mr-1" /> Edit
                  </button>
                </div>
              </div>
            ))}
            
            {filteredTransactions.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm">Tidak ada transaksi ditemukan</div>
            )}
          </div>
        )}

      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-2xl md:rounded-3xl w-full max-w-md max-h-full flex flex-col shadow-2xl relative overflow-hidden">
            <div className="p-5 md:p-6 border-b border-slate-100 shrink-0">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-bold text-slate-800">Edit Transaksi</h3>
            </div>
            
            <div className="p-5 md:p-6 overflow-y-auto hide-scrollbar">
              <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Deskripsi</label>
                <input 
                  type="text" 
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nominal (Rp)</label>
                <input 
                  type="number" 
                  value={editForm.amount}
                  onChange={(e) => setEditForm({...editForm, amount: e.target.value === '' ? '' : Number(e.target.value)})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
                />
              </div>
              </div>

              <button 
                onClick={handleSaveEdit}
                disabled={updateTransactionMutation.isPending}
                className="mt-8 w-full premium-gradient-bg text-white px-5 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:scale-105 transition-all duration-300 flex items-center justify-center disabled:opacity-50"
              >
                {updateTransactionMutation.isPending ? 'Menyimpan...' : <><Save className="w-5 h-5 mr-2" /> Simpan Perubahan</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
