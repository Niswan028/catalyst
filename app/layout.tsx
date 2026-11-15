import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'CareConnect - Elderly Care & Medication Management Platform',
  description:
    'A smart, collaborative healthcare platform empowering elderly individuals, caretakers, and family circles to manage medication schedules, proactive email reminders, and doctor appointments through secure passcode-based access.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'CareConnect: Elderly Care & Medication Management Platform',
    description:
      'Passcode-based family care circles, proactive email escalations, and accessible doctor appointment management.',
    url: 'https://careconnectcatalyst.netlify.app/',
    siteName: 'CareConnect',
    locale: 'en_US',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f766e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('careconnect_theme');
                  var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && supportDarkMode)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  if (localStorage.getItem('careconnect_high_contrast') === 'true') {
                    document.documentElement.classList.add('high-contrast');
                  }
                  var textSize = localStorage.getItem('careconnect_text_size');
                  if (textSize === 'extra-large') {
                    document.documentElement.classList.add('text-size-xl');
                  } else if (textSize === 'large') {
                    document.documentElement.classList.add('text-size-lg');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 min-h-screen`}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}
