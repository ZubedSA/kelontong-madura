import { PenjagaBottomNav } from '@/components/layout/penjaga-bottom-nav';

export default function PenjagaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-20">
      <main className="flex-1 w-full max-w-md mx-auto relative bg-white shadow-sm min-h-screen">
        {children}
      </main>
      <div className="max-w-md mx-auto w-full">
        <PenjagaBottomNav />
      </div>
    </div>
  );
}
