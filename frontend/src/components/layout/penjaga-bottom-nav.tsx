import Link from 'next/link';
import { Home, PlusCircle, History } from 'lucide-react';

export function PenjagaBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
      <Link href="/penjaga" className="flex flex-col items-center text-indigo-600">
        <Home className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-semibold">Beranda</span>
      </Link>
      
      <a href="/penjaga#aktivitas" className="flex flex-col items-center text-slate-400 hover:text-indigo-600 transition-colors">
        <div className="bg-indigo-600 text-white rounded-full p-3 -mt-8 shadow-lg shadow-indigo-200">
          <PlusCircle className="w-7 h-7" />
        </div>
        <span className="text-[10px] font-medium mt-1">Input Data</span>
      </a>
      
      <a href="/penjaga#riwayat" className="flex flex-col items-center text-slate-400 hover:text-indigo-600 transition-colors">
        <History className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-medium">Riwayat</span>
      </a>
    </nav>
  );
}
