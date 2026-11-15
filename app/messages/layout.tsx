import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Messages',
  description:
    'Secure real-time family messaging, medication updates, and urgent care alerts.',
  alternates: {
    canonical: '/messages',
  },
  openGraph: {
    title: 'Messages | CareConnect',
    description:
      'Secure real-time family messaging, medication updates, and urgent care alerts.',
    url: '/messages',
  },
};

export default function MessagesLayout({
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
