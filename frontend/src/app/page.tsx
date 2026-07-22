import { redirect } from 'next/navigation';

export default function Home() {
  // Arahkan pengunjung langsung ke halaman login SaaS
  redirect('/login');
}
