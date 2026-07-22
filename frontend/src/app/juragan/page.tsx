import { redirect } from 'next/navigation';

export default function JuraganIndex() {
  // Langsung arahkan ke sub-rute dashboard
  redirect('/juragan/dashboard');
}
