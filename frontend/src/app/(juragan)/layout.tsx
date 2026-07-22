import { JuraganSidebar } from '@/components/layout/juragan-sidebar';
import { JuraganHeader } from '@/components/layout/juragan-header';

export default function JuraganLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <JuraganSidebar />
      <div className="flex-1 md:ml-64 flex flex-col">
        <JuraganHeader />
        <main className="flex-1 p-6 sm:p-8 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
