'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Search, Settings, LogOut, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

export function JuraganHeader() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Get initials
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(user?.name || 'Juragan Budi');

  return (
    <header className="h-16 md:h-20 glass border-b border-slate-200/50 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 animate-fade-in">
      {/* Spacer for mobile hamburger menu in sidebar */}
      <div className="md:hidden w-10"></div>

      {/* Mobile: Center Title */}
      <div className="md:hidden font-bold text-lg text-slate-800 tracking-tight flex items-center">
        SaaS<span className="premium-gradient-text">Madura</span>
      </div>

      {/* Desktop: Search Bar */}
      <div className="hidden md:flex items-center text-slate-500 bg-white/60 border border-slate-200/60 px-4 py-2.5 rounded-2xl w-96 shadow-sm hover:shadow-md transition-shadow duration-300 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500/50">
        <Search className="w-4 h-4 mr-3 text-slate-400" />
        <input 
          type="text" 
          placeholder="Cari transaksi..." 
          className="bg-transparent border-none focus:outline-none text-sm w-full placeholder-slate-400 text-slate-700 truncate"
        />
      </div>

      <div className="flex items-center space-x-3 md:space-x-6">
        <button className="relative text-slate-400 hover:text-indigo-600 transition-colors p-2 hover:bg-indigo-50 rounded-xl hidden sm:block">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white shadow-sm"></span>
        </button>
        
        <div className="flex items-center space-x-3 md:space-x-4 pl-0 md:pl-6 relative" ref={dropdownRef}>
          <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 h-8 w-px bg-slate-200/60"></div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-800">{user?.name || 'Juragan Budi'}</p>
            <p className="text-xs font-medium text-slate-500">Pemilik Warung</p>
          </div>
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-10 h-10 md:w-11 md:h-11 rounded-full premium-gradient-bg flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20 cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-white select-none"
          >
            {initials}
          </div>
          
          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 animate-fade-in z-50">
              <div className="px-4 py-3 border-b border-slate-100 sm:hidden">
                <p className="text-sm font-bold text-slate-800">{user?.name || 'Juragan Budi'}</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Pemilik Warung</p>
              </div>
              <div className="p-2">
                <button 
                  onClick={() => { setIsDropdownOpen(false); router.push('/juragan/pengaturan'); }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl flex items-center transition-colors"
                >
                  <Settings className="w-4 h-4 mr-3" /> Pengaturan Akun
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-xl flex items-center transition-colors mt-1"
                >
                  <LogOut className="w-4 h-4 mr-3" /> Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
