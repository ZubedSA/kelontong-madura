'use client';

import { useToast } from '@/components/ui/toast-context';

import React, { useState, useEffect } from 'react';
import { 
  Shield, Calculator, Wallet, AlertTriangle, TrendingUp, TrendingDown, 
  Save, History, Users, Plus, Edit2, Trash2, CheckCircle2, UserPlus, UserMinus
} from 'lucide-react';
import api from '@/lib/api';
import { KaryawanFormModal } from '@/components/karyawan/KaryawanFormModal';

export default function PeriodeCekPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<'masuk' | 'keluar'>('masuk');
  const [isLoading, setIsLoading] = useState(true);

  // --- State Manajemen Karyawan (Tab Masuk) ---
  const [karyawans, setKaryawans] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKaryawan, setSelectedKaryawan] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- State Audit Aset (Tab Keluar) ---
  const [audits, setAudits] = useState<any[]>([]);
  const [isSavingAudit, setIsSavingAudit] = useState(false);
  const [selectedKaryawanId, setSelectedKaryawanId] = useState('');
  const [modalAwal, setModalAwal] = useState(0);
  const [uangFisik, setUangFisik] = useState<number | string>('');
  const [nilaiBarang, setNilaiBarang] = useState<number | string>('');
  
  // Persentase Bagi Hasil (Default dari Settings)
  const [porsiJuragan, setPorsiJuragan] = useState(50);
  const [porsiPenjaga, setPorsiPenjaga] = useState(50);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [resKaryawan, resSettings, resAudits] = await Promise.all([
        api.get('/karyawan'),
        api.get('/settings'),
        api.get('/audits')
      ]);
      
      setKaryawans(resKaryawan.data);
      if (resAudits.data.success) {
        setAudits(resAudits.data.data);
      }
      
      const set = resSettings.data?.financialSettings;
      if (set) {
        setPorsiJuragan(set.profitShareJuragan ?? 50);
        setPorsiPenjaga(set.profitSharePenjaga ?? 50);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  // ==========================================
  // HANDLER: TAB MASUK (MANAJEMEN KARYAWAN)
  // ==========================================
  const handleOpenModal = (karyawan = null) => {
    setSelectedKaryawan(karyawan);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedKaryawan(null);
  };

  const handleSubmitKaryawan = async (formData: any) => {
    try {
      setIsSubmitting(true);
      if (selectedKaryawan) {
        await api.put(`/users/karyawan/${formData.id}`, formData);
        toastSuccess('Data karyawan berhasil diperbarui!');
      } else {
        await api.post('/users/karyawan', formData);
        toastSuccess('Penjaga baru berhasil ditambahkan!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toastError(error.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteKaryawan = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus akses penjaga ${name}?`)) {
      try {
        await api.delete(`/users/karyawan/${id}`);
        toastSuccess('Karyawan berhasil dihapus.');
        fetchData();
      } catch (error: any) {
        toastError(error.response?.data?.message || 'Gagal menghapus karyawan');
      }
    }
  };


  // ==========================================
  // HANDLER: TAB KELUAR (AUDIT ASET)
  // ==========================================
  const handleSelectKaryawanAudit = (id: string) => {
    setSelectedKaryawanId(id);
    const k = karyawans.find((x) => x.id === id);
    if (k) {
      setModalAwal(k.baseModal || 0);
    } else {
      setModalAwal(0);
    }
  };

  const handlePorsiJuraganChange = (valStr: string) => {
    if (valStr === '') {
      setPorsiJuragan(0);
      setPorsiPenjaga(100);
      return;
    }
    const val = Number(valStr);
    const juragan = Math.max(0, Math.min(100, val));
    setPorsiJuragan(juragan);
    setPorsiPenjaga(100 - juragan);
  };

  const handlePorsiPenjagaChange = (valStr: string) => {
    if (valStr === '') {
      setPorsiPenjaga(0);
      setPorsiJuragan(100);
      return;
    }
    const val = Number(valStr);
    const penjaga = Math.max(0, Math.min(100, val));
    setPorsiPenjaga(penjaga);
    setPorsiJuragan(100 - penjaga);
  };

  const numUangFisik = Number(uangFisik) || 0;
  const numNilaiBarang = Number(nilaiBarang) || 0;
  
  const totalAset = numUangFisik + numNilaiBarang;
  const selisih = totalAset - modalAwal;
  const isUntung = selisih >= 0;
  
  const hakJuragan = isUntung ? Math.floor(selisih * (porsiJuragan / 100)) : 0;
  const hakPenjaga = isUntung ? Math.floor(selisih * (porsiPenjaga / 100)) : 0;

  const handleSaveAudit = async () => {
    if (!selectedKaryawanId) {
      toastError('Pilih penjaga terlebih dahulu!');
      return;
    }
    if (uangFisik === '' || nilaiBarang === '') {
      toastError('Mohon isi jumlah Uang Fisik dan Nilai Barang.');
      return;
    }

    try {
      setIsSavingAudit(true);
      await api.post('/audits', {
        tenantUserId: selectedKaryawanId,
        modalAwal,
        uangFisik: numUangFisik,
        nilaiBarang: numNilaiBarang,
        porsiJuragan,
        porsiPenjaga,
        hakJuragan,
        hakPenjaga
      });
      toastSuccess('Data audit berhasil disimpan!');
      setUangFisik('');
      setNilaiBarang('');
      setSelectedKaryawanId('');
      setModalAwal(0);
      fetchData();
    } catch (error: any) {
      toastError(error.response?.data?.message || 'Gagal menyimpan data audit');
    } finally {
      setIsSavingAudit(false);
    }
  };


  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-10">
      
      {/* Header & Tabs */}
      <div className="flex flex-col space-y-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Periode Cek</h2>
          <p className="text-sm md:text-base text-slate-500 mt-1 md:mt-2 font-medium">Atur pergantian penjaga: daftarkan penjaga baru atau hitung audit aset saat penjaga keluar.</p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex p-1 bg-slate-100 rounded-xl max-w-md w-full">
          <button 
            onClick={() => setActiveTab('masuk')}
            className={`flex-1 flex items-center justify-center py-2.5 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${activeTab === 'masuk' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            <UserPlus className="w-4 h-4 mr-2" /> Mulai Jaga (Baru)
          </button>
          <button 
            onClick={() => setActiveTab('keluar')}
            className={`flex-1 flex items-center justify-center py-2.5 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${activeTab === 'keluar' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            <UserMinus className="w-4 h-4 mr-2" /> Berhenti Jaga (Keluar)
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="mt-6">
          
          {/* ==========================================================
              TAB 1: MULAI JAGA (MANAJEMEN PENJAGA)
             ========================================================== */}
          {activeTab === 'masuk' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-end bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                     <Users className="w-6 h-6" />
                   </div>
                   <div>
                     <h3 className="text-xl font-bold text-slate-800">Daftar Penjaga Aktif</h3>
                     <p className="text-xs text-slate-500">Daftarkan penjaga dan tentukan modal awal untuk periode jaganya.</p>
                   </div>
                </div>
                <button 
                  onClick={() => handleOpenModal()}
                  className="bg-slate-800 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-slate-500/30 hover:scale-105 transition-all duration-300 flex items-center justify-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Tambah Penjaga
                </button>
              </div>

              {karyawans.length === 0 ? (
                <div className="text-center py-10 bg-white/50 rounded-3xl border border-slate-200 border-dashed">
                  <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-700">Belum ada Penjaga</h3>
                  <p className="text-slate-500 max-w-sm mx-auto mt-2">Anda belum mendaftarkan penjaga warung.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {karyawans.map((k) => (
                    <div key={k.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 group">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl">
                            {k.user?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <h3 className="text-md font-bold text-slate-800">{k.user?.name}</h3>
                            <p className="text-xs text-slate-500">{k.user?.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 mb-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Modal Jaga Diberikan</p>
                        <p className="font-bold text-indigo-600">Rp {(k.baseModal || 0).toLocaleString('id-ID')}</p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Aktif
                        </span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleOpenModal(k)}
                            className="text-slate-500 hover:text-indigo-600 font-medium text-xs flex items-center bg-slate-50 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3 h-3 mr-1" /> Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteKaryawan(k.id, k.user?.name)}
                            className="text-slate-500 hover:text-rose-600 font-medium text-xs flex items-center bg-slate-50 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Modal Form Karyawan */}
              <KaryawanFormModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmitKaryawan}
                initialData={selectedKaryawan}
                isLoading={isSubmitting}
              />
            </div>
          )}

          {/* ==========================================================
              TAB 2: BERHENTI JAGA (AUDIT ASET KELUAR)
             ========================================================== */}
          {activeTab === 'keluar' && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Kolom Kiri: Form Input */}
                <div className="space-y-6">
                  
                  {/* Bagian 1: Identitas & Modal */}
                  <div className="bg-white rounded-3xl p-6 md:p-8 border border-rose-100 shadow-sm space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Shield className="w-32 h-32" /></div>
                    
                    <h3 className="font-bold text-rose-800 flex items-center relative z-10">
                      <Shield className="w-5 h-5 mr-2 text-rose-600" /> Data Penjaga (Modal Awal)
                    </h3>
                    
                    <div className="relative z-10">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pilih Penjaga yang Berhenti</label>
                      <select 
                        value={selectedKaryawanId}
                        onChange={(e) => handleSelectKaryawanAudit(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                      >
                        <option value="">-- Pilih Penjaga --</option>
                        {karyawans.map((k) => (
                          <option key={k.id} value={k.id}>{k.user?.name} ({k.user?.email})</option>
                        ))}
                      </select>
                    </div>

                    <div className="relative z-10">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Modal Awal (Hutang Toko)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                        <input 
                          type="text" 
                          disabled
                          value={modalAwal.toLocaleString('id-ID')}
                          className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-lg font-bold focus:outline-none text-slate-500 cursor-not-allowed" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bagian 2: Hasil Opname Aset */}
                  <div className="bg-indigo-50/50 rounded-3xl p-6 md:p-8 border border-indigo-100 space-y-6">
                    <h3 className="font-bold text-indigo-900 flex items-center">
                      <Calculator className="w-5 h-5 mr-2 text-indigo-600" /> Hasil Opname Aset Akhir
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-indigo-900/70 uppercase tracking-wider mb-2">1. Total Uang Fisik (Di Laci / Brankas)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 font-bold">Rp</span>
                          <input 
                            type="number" 
                            placeholder="Masukkan total uang cash..."
                            value={uangFisik}
                            onChange={(e) => setUangFisik(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-indigo-200 rounded-xl text-lg font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-indigo-900" 
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-indigo-900/70 uppercase tracking-wider mb-2">2. Total Nilai Barang (Dinominalkan)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 font-bold">Rp</span>
                          <input 
                            type="number" 
                            placeholder="Masukkan estimasi total harga barang sisa..."
                            value={nilaiBarang}
                            onChange={(e) => setNilaiBarang(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-indigo-200 rounded-xl text-lg font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-indigo-900" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </div>

                {/* Kolom Kanan: Hasil Perhitungan */}
                <div className="bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl text-white relative overflow-hidden flex flex-col">
                   <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                   
                   <h3 className="font-bold text-slate-300 flex items-center mb-8 relative z-10">
                     <Wallet className="w-5 h-5 mr-2 text-rose-400" /> Lembar Keputusan
                   </h3>

                   <div className="space-y-6 relative z-10 flex-1">
                     
                     {/* Kalkulasi Total */}
                     <div className="bg-slate-800/50 rounded-2xl p-5 space-y-4 border border-slate-700/50">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">Total Modal Awal</span>
                          <span className="font-bold text-slate-200">Rp {modalAwal.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">Total Aset Akhir (Uang + Barang)</span>
                          <span className="font-bold text-emerald-400 border-b border-dashed border-emerald-400/50 pb-0.5">Rp {totalAset.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                          <span className="text-slate-300 font-semibold uppercase text-xs">Selisih Kinerja</span>
                          <span className={`font-extrabold text-xl ${isUntung ? 'text-indigo-400' : 'text-rose-400'}`}>
                            {selisih > 0 ? '+' : ''} Rp {selisih.toLocaleString('id-ID')}
                          </span>
                        </div>
                     </div>

                     {/* Kesimpulan Nombok / Untung */}
                     {!isUntung && selisih < 0 ? (
                       <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 flex flex-col items-center text-center animate-slide-up">
                          <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center text-rose-400 mb-4">
                            <TrendingDown className="w-8 h-8" />
                          </div>
                          <h4 className="text-rose-400 font-black text-xl mb-2">TOKO MERUGI / MINUS</h4>
                          <p className="text-rose-200/70 text-sm mb-6">
                            Aset akhir lebih kecil dari modal awal. Penjaga bertanggung jawab untuk mengganti rugi selisih tersebut.
                          </p>
                          <div className="bg-rose-500/20 w-full py-4 rounded-xl border border-rose-500/30">
                            <p className="text-rose-300 text-xs font-bold uppercase mb-1">Total Hutang Penjaga Ke Toko</p>
                            <p className="text-rose-100 text-2xl font-extrabold">Rp {Math.abs(selisih).toLocaleString('id-ID')}</p>
                          </div>
                       </div>
                     ) : (
                       <div className="space-y-6 animate-slide-up">
                          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 text-center">
                            <div className="flex items-center justify-center text-indigo-400 mb-2 gap-2">
                              <TrendingUp className="w-5 h-5" />
                              <h4 className="font-black text-lg">TOKO UNTUNG</h4>
                            </div>
                            <p className="text-indigo-200/70 text-xs">Silakan atur porsi bagi hasil dari keuntungan bersih (Rp {selisih.toLocaleString('id-ID')})</p>
                          </div>

                          {/* Pengaturan Porsi */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Porsi Penjaga</label>
                              <div className="relative">
                                <input 
                                  type="number" 
                                  value={porsiPenjaga}
                                  onChange={(e) => handlePorsiPenjagaChange(e.target.value)}
                                  className="w-full pl-4 pr-10 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500 text-white transition-all text-center" 
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">%</span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Hak Pemilik</label>
                              <div className="relative">
                                <input 
                                  type="number" 
                                  value={porsiJuragan}
                                  onChange={(e) => handlePorsiJuraganChange(e.target.value)}
                                  className="w-full pl-4 pr-10 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500 text-white transition-all text-center" 
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">%</span>
                              </div>
                            </div>
                          </div>

                          {/* Hasil Pembagian */}
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Gaji Penjaga</p>
                              <p className="text-lg font-bold text-emerald-400">Rp {hakPenjaga.toLocaleString('id-ID')}</p>
                            </div>
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Laba Pemilik</p>
                              <p className="text-lg font-bold text-indigo-400">Rp {hakJuragan.toLocaleString('id-ID')}</p>
                            </div>
                          </div>
                       </div>
                     )}

                   </div>
                   
                   <button 
                     onClick={handleSaveAudit}
                     disabled={isSavingAudit || !selectedKaryawanId || uangFisik === '' || nilaiBarang === ''}
                     className="mt-6 w-full bg-rose-600 hover:bg-rose-500 text-white px-5 py-4 rounded-xl font-bold shadow-lg shadow-rose-500/30 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {isSavingAudit ? 'Menyimpan...' : <><Save className="w-5 h-5 mr-2" /> Simpan & Tutup Periode</>}
                   </button>
                </div>

              </div>

              {/* Bagian Riwayat Audit */}
              <div className="mt-12 pt-12 border-t border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 flex items-center mb-6">
                  <History className="w-5 h-5 mr-2 text-indigo-600" /> Riwayat Audit Terdahulu
                </h3>
                
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                    {audits.map((audit) => (
                      <div key={audit.id} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50 transition-colors gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${audit.selisih >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {audit.selisih >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">
                              {audit.tenantUser?.user?.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(audit.auditDate).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-8 md:gap-12 pl-16 md:pl-0">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Modal Awal</p>
                            <p className="text-sm font-semibold text-slate-700">Rp {audit.modalAwal.toLocaleString('id-ID')}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Aset</p>
                            <p className="text-sm font-semibold text-slate-700">Rp {audit.totalAset.toLocaleString('id-ID')}</p>
                          </div>
                          <div className="text-right border-l border-slate-200 pl-4 md:pl-8">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Selisih (Kinerja)</p>
                            <p className={`text-lg font-black ${audit.selisih >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {audit.selisih >= 0 ? '+' : ''} Rp {audit.selisih.toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {audits.length === 0 && (
                      <div className="p-10 text-center text-slate-500 text-sm">
                        Belum ada riwayat audit yang tersimpan.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
