import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Onboarding',
  description:
    'Complete your CareConnect setup: personal care preferences, first prescriptions, and family circle invitations.',
  alternates: {
    canonical: '/onboarding',
  },
  openGraph: {
    title: 'Onboarding | CareConnect',
    description:
      'Complete your CareConnect setup: personal care preferences, first prescriptions, and family circle invitations.',
    url: '/onboarding',
  },
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
