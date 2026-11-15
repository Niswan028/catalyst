import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Appointments',
  description:
    'Upcoming medical appointments, clinic locations, specialist notes, and .ics calendar export.',
  alternates: {
    canonical: '/appointments',
  },
  openGraph: {
    title: 'Appointments | CareConnect',
    description:
      'Upcoming medical appointments, clinic locations, specialist notes, and .ics calendar export.',
    url: '/appointments',
  },
};

export default function AppointmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
