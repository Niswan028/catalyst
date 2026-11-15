import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Dashboard',
  description:
    'Daily medication schedules, adherence metrics, upcoming appointments, and family care circle updates.',
  alternates: {
    canonical: '/dashboard',
  },
  openGraph: {
    title: 'Dashboard | CareConnect',
    description:
      'Daily medication schedules, adherence metrics, upcoming appointments, and family care circle updates.',
    url: '/dashboard',
  },
};

export default function DashboardLayout({
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
