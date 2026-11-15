import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Daily Check-in',
  description:
    'Wellness check-ins, mood tracking, voice prompts, and elder health notes for family circles.',
  alternates: {
    canonical: '/checkin',
  },
  openGraph: {
    title: 'Daily Check-in | CareConnect',
    description:
      'Wellness check-ins, mood tracking, voice prompts, and elder health notes for family circles.',
    url: '/checkin',
  },
};

export default function CheckInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7f4ee] dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      <Navbar />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
