import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Interactive Demo Guide',
  description:
    'Guided walkthrough of CareConnect for evaluators, featuring pre-seeded personas and automated test flows.',
  alternates: {
    canonical: '/demo',
  },
  openGraph: {
    title: 'Interactive Demo Guide | CareConnect',
    description:
      'Guided walkthrough of CareConnect for evaluators, featuring pre-seeded personas and automated test flows.',
    url: '/demo',
  },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7f4ee] dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      <Navbar />
      <main className="px-4 py-6 sm:px-6 lg:px-8 max-w-5xl mx-auto">{children}</main>
    </div>
  );
}
