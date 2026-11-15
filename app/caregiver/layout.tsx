import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Care Circle',
  description:
    'Passcode-based family member management, permission roles, and real-time adherence oversight.',
  alternates: {
    canonical: '/caregiver',
  },
  openGraph: {
    title: 'Care Circle | CareConnect',
    description:
      'Passcode-based family member management, permission roles, and real-time adherence oversight.',
    url: '/caregiver',
  },
};

export default function CaregiverLayout({
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
