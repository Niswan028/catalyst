import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Medications',
  description:
    'Prescription inventory, dosage schedules, stock tracking, and smart refill alerts.',
  alternates: {
    canonical: '/medications',
  },
  openGraph: {
    title: 'Medications | CareConnect',
    description:
      'Prescription inventory, dosage schedules, stock tracking, and smart refill alerts.',
    url: '/medications',
  },
};

export default function MedicationsLayout({
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
