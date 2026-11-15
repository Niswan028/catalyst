import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Doctor Brief',
  description:
    "A one-page clinical appointment summary from your circle's records: active medications, 7-day adherence, missed doses, and doctor visit questions.",
  alternates: {
    canonical: '/doctor-brief',
  },
  openGraph: {
    title: 'Doctor Brief | CareConnect',
    description:
      "A one-page clinical appointment summary from your circle's records: active medications, 7-day adherence, missed doses, and doctor visit questions.",
    url: '/doctor-brief',
  },
};

export default function DoctorBriefLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7f4ee] dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      <div className="no-print">
        <Navbar />
      </div>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
