import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Settings',
  description:
    'Notification preferences, multi-language selection, accessibility font sizing, and security settings.',
  alternates: {
    canonical: '/settings',
  },
  openGraph: {
    title: 'Settings | CareConnect',
    description:
      'Notification preferences, multi-language selection, accessibility font sizing, and security settings.',
    url: '/settings',
  },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />
      <main className="px-4 py-6 sm:px-6 lg:px-8 max-w-5xl mx-auto">{children}</main>
    </div>
  );
}
