import React, { useState, useEffect } from 'react';
import { X, Save, Eye, EyeOff } from 'lucide-react';

interface KaryawanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any | null;
  isLoading?: boolean;
}

export function KaryawanFormModal({ isOpen, onClose, onSubmit, initialData, isLoading }: KaryawanFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    baseModal: 0 as number | string,
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.user.name || '',
        email: initialData.user.email || '',
        password: '', // Kosongkan password saat edit
        baseModal: initialData.baseModal || 0,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        baseModal: 0,
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-lg max-h-full flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center premium-gradient-bg shrink-0">
          <h3 className="text-lg font-bold text-white truncate pr-4">
            {initialData ? 'Edit Aturan Penjaga' : 'Tambah Penjaga Baru'}
          </h3>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto overflow-x-hidden">
          <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-5">
            
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Informasi Akun</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Lengkap</label>
                <input 
                  type="text"
                  required
                  disabled={!!initialData}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                  placeholder="Misal: Budi Santoso"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Akses</label>
                <input 
                  type="email"
                  required
                  disabled={!!initialData}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                  placeholder="penjaga1@warung.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {initialData ? 'Ganti Password (Opsional)' : 'Password'}
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  required={!initialData}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all pr-12"
                  placeholder={initialData ? "Kosongkan jika tidak ingin mengubah" : "Minimal 6 karakter"}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aturan Modal Jaga</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Modal Awal / Shift (Rp)</label>
                <input 
                  type="number"
                  required
                  min="0"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  value={formData.baseModal}
                  onChange={(e) => setFormData({...formData, baseModal: e.target.value === '' ? '' : Number(e.target.value)})}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
            >
              {isLoading ? 'Menyimpan...' : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Simpan
                </>
              )}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
}
