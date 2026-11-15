'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { User } from '@/lib/types';
import { SupportedLanguage, getTranslation } from '@/lib/i18n';
import Avatar from './ui/Avatar';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<SupportedLanguage>('en');

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (authUser) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        setUser(data);
      }
      setLoading(false);
    };

    fetchUser();

    if (typeof window !== 'undefined') {
      const savedLang = (localStorage.getItem('careconnect_lang') as SupportedLanguage) || 'en';
      setLang(savedLang);
    }
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/signin');
  };

  const handleLangChange = (newLang: SupportedLanguage) => {
    setLang(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('careconnect_lang', newLang);
      window.dispatchEvent(new Event('careconnect_lang_change'));
    }
  };

  if (loading || !user) return null;

  const t = getTranslation(lang);

  const navLinks =
    user.role === 'elderly_user'
      ? [
          { href: '/dashboard', label: t.nav.dashboard, icon: '🏠' },
          { href: '/checkin', label: t.nav.checkin, icon: '🩺' },
          { href: '/medications', label: t.nav.medications, icon: '💊' },
          { href: '/appointments', label: t.nav.appointments, icon: '🗓️' },
          { href: '/messages', label: t.nav.messages, icon: '💬' },
        ]
      : [
          { href: '/caregiver', label: t.nav.dashboard, icon: '🏠' },
          { href: '/appointments', label: t.nav.appointments, icon: '🗓️' },
          { href: '/messages', label: t.nav.messages, icon: '💬' },
        ];

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div className="flex items-center gap-8">
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 text-primary-700 hover:text-primary-800 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-700 to-primary-500 text-white flex items-center justify-center font-extrabold text-xl shadow-sm">
                  C+
                </div>
                <div>
                  <span className="font-extrabold text-xl tracking-tight text-slate-900 block leading-tight">
                    Care<span className="text-primary-600">Connect</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">
                    Elder Healthcare
                  </span>
                </div>
              </Link>

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center space-x-1" aria-label="Main Navigation">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all min-h-[40px] ${
                        isActive
                          ? 'bg-primary-50 text-primary-800 shadow-xs border border-primary-200/60'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      <span>{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right side controls: Language, User Profile, Sign Out */}
            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <div className="relative">
                <select
                  value={lang}
                  onChange={(e) => handleLangChange(e.target.value as SupportedLanguage)}
                  aria-label="Select Interface Language"
                  className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg px-2.5 py-1.5 cursor-pointer focus:ring-2 focus:ring-primary-500 focus:outline-none min-h-[36px]"
                >
                  <option value="en">English (US)</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                </select>
              </div>

              {/* User Profile */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                <Avatar
                  name={user.full_name || user.email || 'User'}
                  size="sm"
                  status="online"
                />
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                    {user.full_name || user.email}
                  </p>
                  <span className="text-[10px] font-semibold text-primary-700 bg-primary-50 px-1.5 py-0.2 rounded">
                    {user.role === 'elderly_user' ? 'Elder Profile' : 'Caregiver'}
                  </span>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-200/80 transition-colors min-h-[36px] flex items-center gap-1"
                aria-label="Sign out of account"
              >
                <span>🚪</span>
                <span className="hidden sm:inline">{t.nav.signOut}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (WCAG 2.1 AA 44px+ touch targets) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-floating px-2 py-1 flex items-center justify-around"
        aria-label="Mobile Navigation"
      >
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center min-w-[54px] min-h-[48px] rounded-xl text-center transition-all ${
                isActive
                  ? 'text-primary-700 font-bold bg-primary-50/80'
                  : 'text-slate-500 font-medium hover:text-slate-900'
              }`}
            >
              <span className="text-lg leading-none mb-0.5">{link.icon}</span>
              <span className="text-[10px] leading-tight truncate max-w-[64px]">
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
