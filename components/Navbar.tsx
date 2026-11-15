'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { User } from '@/lib/types';
import { SupportedLanguage, getTranslation } from '@/lib/i18n';
import Avatar from './ui/Avatar';
import { Icons } from './ui/icons';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          { href: '/dashboard', label: t.nav.dashboard, icon: Icons.Dashboard },
          { href: '/medications', label: t.nav.medications, icon: Icons.Medications },
          { href: '/checkin', label: t.nav.checkin, icon: Icons.Checkin },
          { href: '/appointments', label: t.nav.appointments, icon: Icons.Appointments },
          { href: '/messages', label: t.nav.messages, icon: Icons.Messages },
          { href: '/demo', label: t.nav.tour, icon: Icons.Tour },
          { href: '/settings', label: t.nav.settings, icon: Icons.Settings },
        ]
      : [
          { href: '/caregiver', label: t.nav.dashboard, icon: Icons.Dashboard },
          { href: '/appointments', label: t.nav.appointments, icon: Icons.Appointments },
          { href: '/messages', label: t.nav.messages, icon: Icons.Messages },
          { href: '/demo', label: t.nav.tour, icon: Icons.Tour },
          { href: '/settings', label: t.nav.settings, icon: Icons.Settings },
        ];

  // Mobile bottom dock primary links (4 items to prevent label truncations at 360px)
  const mobileDockLinks = navLinks.slice(0, 4);

  return (
    <>
      {/* Responsive Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            {/* Brand Logo */}
            <div className="flex items-center gap-4 lg:gap-6 shrink-0">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-primary-700 hover:text-primary-800 transition shrink-0"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-primary-700 to-primary-500 text-white flex items-center justify-center font-extrabold text-lg sm:text-xl shadow-sm">
                  C+
                </div>
                <div>
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 block leading-tight">
                    Care<span className="text-primary-600">Connect</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium block uppercase tracking-wider">
                    Elder Healthcare
                  </span>
                </div>
              </Link>

              {/* Desktop Nav Links (Visible on lg screens, whitespace-nowrap) */}
              <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  const IconComponent = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all min-h-[40px] ${
                        isActive
                          ? 'bg-primary-50 text-primary-800 shadow-xs border border-primary-200/60'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                      }`}
                    >
                      <IconComponent size={18} className={isActive ? 'text-primary-700' : 'text-slate-500'} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right side controls: Language, User Profile, Sign Out, Mobile Menu Button */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Language Selector */}
              <div className="relative">
                <select
                  value={lang}
                  onChange={(e) => handleLangChange(e.target.value as SupportedLanguage)}
                  aria-label="Select Interface Language"
                  className="bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 rounded-lg px-2 sm:px-2.5 py-1.5 cursor-pointer focus:ring-2 focus:ring-primary-500 focus:outline-none min-h-[36px]"
                >
                  <option value="en">English (US)</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                </select>
              </div>

              {/* User Profile (hidden on mobile) */}
              <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200">
                <Avatar
                  name={user.full_name || user.email || 'User'}
                  size="sm"
                  status="online"
                />
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[110px]">
                    {user.full_name || user.email}
                  </p>
                  <span className="text-[10px] font-semibold text-primary-800 bg-primary-100 px-1.5 py-0.5 rounded">
                    {user.role === 'elderly_user' ? 'Elder' : 'Caregiver'}
                  </span>
                </div>
              </div>

              {/* Sign Out Button - ALWAYS VISIBLE */}
              <button
                onClick={handleSignOut}
                className="px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-300 transition-colors min-h-[36px] flex items-center gap-1.5 active:scale-95"
                aria-label="Sign out of account"
              >
                <Icons.LogOut size={16} className="text-slate-700" />
                <span className="hidden sm:inline">{t.nav.signOut}</span>
              </button>

              {/* Overflow / Mobile Menu Button for tablet / mobile */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 min-h-[36px] min-w-[36px] flex items-center justify-center transition"
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <Icons.X size={20} /> : <Icons.Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Dropdown Menu for tablet / mobile viewports */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 shadow-lg space-y-1">
            <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
              <Avatar
                name={user.full_name || user.email || 'User'}
                size="sm"
                status="online"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">{user.full_name || user.email}</p>
                <span className="text-[10px] font-semibold text-primary-800 bg-primary-50 px-1.5 py-0.5 rounded">
                  {user.role === 'elderly_user' ? 'Elder Profile' : 'Caregiver'}
                </span>
              </div>
            </div>

            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-primary-50 text-primary-800 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <IconComponent size={20} className={isActive ? 'text-primary-700' : 'text-slate-500'} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar (WCAG 2.1 AA 44px+ touch targets, 4 primary daily links + Menu) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-floating px-2 py-1 flex items-center justify-around"
        aria-label="Mobile Bottom Navigation"
      >
        {mobileDockLinks.map((link) => {
          const isActive = pathname === link.href;
          const IconComponent = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] rounded-xl text-center transition-all ${
                isActive
                  ? 'text-primary-800 font-bold bg-primary-100/70'
                  : 'text-slate-600 font-medium hover:text-slate-900'
              }`}
            >
              <IconComponent size={20} className={isActive ? 'text-primary-700' : 'text-slate-500'} />
              <span className="text-[10px] leading-tight mt-0.5 truncate max-w-[68px]">
                {link.label}
              </span>
            </Link>
          );
        })}

        {/* 5th Mobile Dock Button: More/Menu to open drawer */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] rounded-xl text-center transition-all ${
            mobileMenuOpen
              ? 'text-primary-800 font-bold bg-primary-100/70'
              : 'text-slate-600 font-medium hover:text-slate-900'
          }`}
          aria-label="More navigation links"
        >
          <Icons.Menu size={20} className={mobileMenuOpen ? 'text-primary-700' : 'text-slate-500'} />
          <span className="text-[10px] leading-tight mt-0.5">More</span>
        </button>
      </nav>
    </>
  );
}