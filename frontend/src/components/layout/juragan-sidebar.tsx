'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, LineChart, Package, Settings, LogOut, Wallet, Clock, Coins, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export function JuraganSidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  // Semua menu (Tampil di Sidebar Desktop & Hamburger Menu Mobile)
  const navItems = [
    { name: 'Dashboard', icon: Home, href: '/dashboard' },
    { name: 'Transaksi', icon: Package, href: '/transaksi' },
    { name: 'Periode Cek', icon: Clock, href: '/shift' },
    { name: 'Tabungan', icon: Wallet, href: '/tabungan' },
    { name: 'Gaji', icon: Coins, href: '/gaji' },
    { name: 'Laporan', icon: LineChart, href: '/laporan' },
    { name: 'Pengaturan', icon: Settings, href: '/pengaturan' },
  ];

  // Menu khusus Bottom Navbar (Hanya 4)
  const bottomNavItems = [
    { name: 'Home', icon: Home, href: '/dashboard' },
    { name: 'Transaksi', icon: Package, href: '/transaksi' },
    { name: 'Tabungan', icon: Wallet, href: '/tabungan' },
    { name: 'Laporan', icon: LineChart, href: '/laporan' },
  ];

  return (
    <>
      {/* Tombol Hamburger Mobile (Diletakkan melayang di kiri atas untuk memanggil sidebar) */}
      <button 
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 p-2.5 text-slate-700 bg-transparent rounded-full hover:bg-slate-100 transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Backdrop Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/50 z-50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Utama (Desktop Fixed & Mobile Slide-in) */}
      <aside className={`
        w-64 glass border-r border-slate-200/50 flex flex-col h-screen fixed left-0 top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-16 md:h-20 flex items-center justify-between px-6 md:px-8 border-b border-slate-100/50 bg-white md:bg-transparent">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-xl premium-gradient-bg flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/30">
              <Package className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-xl text-slate-800 tracking-tight">SaaS<span className="premium-gradient-text">Madura</span></h1>
          </div>
          {/* Tombol Tutup Sidebar Mobile */}
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 py-8 px-4 space-y-1.5 overflow-y-auto bg-white/50 md:bg-transparent">
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Menu Utama</p>
          {navItems.map((item) => {
            const isInBottomNav = bottomNavItems.some((b) => b.href === item.href);
            return (
              <Link 
                key={item.name} 
                href={`/juragan${item.href}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`group flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-white hover:shadow-sm hover:text-indigo-600 transition-all duration-300 relative overflow-hidden ${isInBottomNav ? 'hidden md:flex' : ''}`}
              >
                <div className="absolute inset-0 bg-indigo-50/50 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                <item.icon className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-medium relative z-10">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-100/50 bg-white/50 md:bg-transparent">
          <button 
            onClick={() => {
              useAuthStore.getState().logout();
              router.push('/login');
            }}
            className="group flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-600 w-full transition-all duration-300"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
            <span className="font-medium">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Bottom Navigation Mobile (Optimized without FAB) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/50 flex items-center justify-around px-2 pb-5 pt-3 z-40 shadow-[0_-8px_32px_rgba(0,0,0,0.04)]">
        {bottomNavItems.map((item) => (
          <Link key={item.name} href={`/juragan${item.href}`} className="flex flex-col items-center text-slate-400 hover:text-indigo-600 transition-colors w-16">
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-[9px] font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
