import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up',
  description:
    'Join CareConnect as an elder, family caregiver, or clinician with role-based permissions.',
  alternates: {
    canonical: '/auth/signup',
  },
  openGraph: {
    title: 'Sign Up | CareConnect',
    description:
      'Join CareConnect as an elder, family caregiver, or clinician with role-based permissions.',
    url: '/auth/signup',
  },
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
