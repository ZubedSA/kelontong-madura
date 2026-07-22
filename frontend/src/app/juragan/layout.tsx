import { JuraganSidebar } from '@/components/layout/juragan-sidebar';
import { JuraganHeader } from '@/components/layout/juragan-header';

export default function JuraganLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 relative pb-20 md:pb-0">
      {/* Sidebar hanya tampil di Desktop (md ke atas) */}
      <JuraganSidebar />
      <div className="flex-1 md:ml-64 flex flex-col w-full">
        <JuraganHeader />
        <main className="flex-1 p-4 sm:p-6 md:p-8 w-full max-w-7xl mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
