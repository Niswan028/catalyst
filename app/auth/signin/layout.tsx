import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description:
    'Sign in to your CareConnect account or enter instantly with one-click demo evaluation profiles.',
  alternates: {
    canonical: '/auth/signin',
  },
  openGraph: {
    title: 'Sign In | CareConnect',
    description:
      'Sign in to your CareConnect account or enter instantly with one-click demo evaluation profiles.',
    url: '/auth/signin',
  },
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
