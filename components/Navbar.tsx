'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { User } from '@/lib/types';
import { SupportedLanguage, getTranslation } from '@/lib/i18n';
import Avatar from './ui/Avatar';
import { Icons } from './ui/icons';
import RoleBadge from './RoleBadge';
import { isClinicianUser } from '@/lib/permissions';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

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
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
    if (typeof document !== 'undefined') {
      document.cookie = 'sb-access-token=; path=/; max-age=0; SameSite=Lax';
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('supabase.auth.token');
    }
    setUser(null);
    router.push('/auth/signin');
    router.refresh();
  };

  const handleLangChange = (newLang: SupportedLanguage) => {
    setLang(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('careconnect_lang', newLang);
      window.dispatchEvent(new Event('careconnect_lang_change'));
    }
  };

  const t = getTranslation(lang);

  const activeUser: User = user || {
    id: 'demo-eleanor',
    email: 'eleanor.vance@demo.careconnect',
    full_name: 'Eleanor Vance',
    role: 'elderly_user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const navLinks =
    activeUser.role === 'elderly_user'
      ? [
          { href: '/dashboard', label: t.nav.dashboard, icon: Icons.Dashboard },
          { href: '/doctor-brief', label: 'Doctor Brief', icon: Icons.Activity },
          { href: '/medications', label: t.nav.medications, icon: Icons.Medications },
          { href: '/appointments', label: t.nav.appointments, icon: Icons.Appointments },
          { href: '/checkin', label: t.nav.checkin, icon: Icons.Checkin },
          { href: '/messages', label: t.nav.messages, icon: Icons.Messages },
          { href: '/demo', label: t.nav.tour, icon: Icons.Tour },
          { href: '/settings', label: t.nav.settings, icon: Icons.Settings },
        ]
      : [
          { href: '/caregiver', label: t.nav.dashboard, icon: Icons.Dashboard },
          { href: '/doctor-brief', label: 'Doctor Brief', icon: Icons.Activity },
          { href: '/appointments', label: t.nav.appointments, icon: Icons.Appointments },
          { href: '/messages', label: t.nav.messages, icon: Icons.Messages },
          { href: '/demo', label: t.nav.tour, icon: Icons.Tour },
          { href: '/settings', label: t.nav.settings, icon: Icons.Settings },
        ];

  const isClinician = isClinicianUser(activeUser);

  // Split links: Top 3 primary links visible on desktop header; remainder accessible via clean "More ▾" dropdown
  const primaryNavLinks = navLinks.slice(0, 3);
  const secondaryNavLinks = navLinks.slice(3);

  // Mobile bottom dock primary links (4 items to prevent label truncations at 360px)
  const mobileDockLinks = navLinks.slice(0, 4);

  return (
    <>
      {/* Responsive Header with warm paper aesthetic */}
      <header className="sticky top-0 z-40 bg-[#fbf9f5]/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-[#e6dfd3] dark:border-stone-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-16 gap-2">
            {/* Brand Logo & Circle Context */}
            <div className="flex items-center gap-3 lg:gap-5 shrink-0">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-primary-700 hover:text-primary-800 transition shrink-0"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-primary-700 to-primary-500 text-white flex items-center justify-center font-extrabold text-lg sm:text-xl shadow-sm">
                  C+
                </div>
                <div>
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight text-stone-900 dark:text-stone-100 block leading-tight">
                    Care<span className="text-primary-600">Connect</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-stone-500 font-semibold block uppercase tracking-wider">
                    Vance Circle · Elder Care
                  </span>
                </div>
              </Link>

              {/* Desktop Nav Links (Visible on lg screens, whitespace-nowrap) */}
              <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
                {primaryNavLinks.map((link) => {
                  const isActive = pathname === link.href;
                  const IconComponent = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all min-h-[40px] ${
                        isActive
                          ? 'bg-primary-50 text-primary-800 shadow-xs border border-primary-200/60 dark:bg-primary-950/60 dark:text-primary-300 dark:border-primary-800'
                          : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                    >
                      <IconComponent size={18} className={isActive ? 'text-primary-700 dark:text-primary-400' : 'text-stone-500'} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}

                {secondaryNavLinks.length > 0 && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all min-h-[40px] ${
                        secondaryNavLinks.some((l) => pathname === l.href)
                          ? 'bg-primary-50 text-primary-800 shadow-xs border border-primary-200/60 dark:bg-primary-950/60 dark:text-primary-300 dark:border-primary-800'
                          : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                      aria-expanded={moreMenuOpen}
                      aria-haspopup="true"
                    >
                      <span>More</span>
                      <Icons.ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${moreMenuOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {moreMenuOpen && (
                      <div
                        className="absolute left-0 mt-2 w-48 rounded-2xl bg-white dark:bg-stone-900 border border-[#e6dfd3] dark:border-stone-800 shadow-xl py-2 z-50 animate-fadeIn"
                        onMouseLeave={() => setMoreMenuOpen(false)}
                      >
                        {secondaryNavLinks.map((link) => {
                          const isActive = pathname === link.href;
                          const IconComponent = link.icon;
                          return (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setMoreMenuOpen(false)}
                              className={`flex items-center gap-2.5 px-3.5 py-2 text-sm font-semibold transition ${
                                isActive
                                  ? 'bg-primary-50 text-primary-800 font-bold dark:bg-primary-950 dark:text-primary-300'
                                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-800'
                              }`}
                            >
                              <IconComponent size={16} className={isActive ? 'text-primary-700' : 'text-stone-500'} />
                              <span>{link.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </nav>
            </div>

            {/* Right side controls: Language, User Profile, Sign Out, Mobile Menu Button */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Language Selector */}
              <div className="relative">
                <select
                  value={lang}
                  onChange={(e) => handleLangChange(e.target.value as SupportedLanguage)}
                  aria-label="Select Interface Language"
                  className="bg-white dark:bg-stone-800 border border-[#dcd3c3] dark:border-stone-700 text-xs font-semibold text-stone-800 dark:text-stone-200 rounded-lg px-2 sm:px-2.5 py-1.5 cursor-pointer focus:ring-2 focus:ring-primary-500 focus:outline-none min-h-[36px]"
                >
                  <option value="en">English (US)</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="ta">தமிழ் (Tamil)</option>
                </select>
              </div>

              {/* User Profile */}
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#e6dfd3] dark:border-stone-800 shrink-0">
                <Avatar
                  name={activeUser.full_name || activeUser.email || 'User'}
                  size="sm"
                  status="online"
                />
                <div className="text-left hidden md:block">
                  <p
                    className="text-xs font-bold text-stone-800 dark:text-stone-200 leading-tight max-w-[120px] truncate"
                    title={activeUser.full_name || activeUser.email}
                  >
                    {activeUser.full_name || activeUser.email}
                  </p>
                  <div className="mt-0.5">
                    <RoleBadge
                      role={activeUser.role}
                      isClinician={isClinician}
                      size="xs"
                    />
                  </div>
                </div>
              </div>

              {/* Dedicated Sign Out Button - ALWAYS VISIBLE, NEVER CLIPPED */}
              <button
                type="button"
                onClick={handleSignOut}
                className="px-2.5 sm:px-3 py-1.5 bg-white hover:bg-red-50 text-stone-700 hover:text-red-700 dark:bg-stone-800 dark:hover:bg-red-950/40 dark:text-stone-300 dark:hover:text-red-300 text-xs font-bold rounded-xl border border-[#dcd3c3] hover:border-red-300 dark:border-stone-700 transition flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95 min-h-[36px]"
                aria-label="Sign out of account"
                title="Sign out of CareConnect"
              >
                <Icons.LogOut size={16} className="text-stone-600 dark:text-stone-400 group-hover:text-red-600 shrink-0" />
                <span className="whitespace-nowrap">{t.nav.signOut || 'Sign Out'}</span>
              </button>

              {/* Overflow / Mobile Menu Button for tablet / mobile */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-stone-700 dark:text-stone-300 hover:text-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg border border-[#dcd3c3] dark:border-stone-700 min-h-[36px] min-w-[36px] flex items-center justify-center transition shrink-0"
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
            <div className="flex items-center gap-2 pb-2 mb-2 border-b border-stone-200 dark:border-stone-800">
              <Avatar
                name={activeUser.full_name || activeUser.email || 'User'}
                size="sm"
                status="online"
              />
              <div>
                <p className="text-xs font-bold text-stone-900 dark:text-stone-100">{activeUser.full_name || activeUser.email}</p>
                <span className="text-[10px] font-semibold text-primary-800 bg-primary-50 dark:bg-primary-950 dark:text-primary-300 px-1.5 py-0.5 rounded">
                  {activeUser.role === 'elderly_user' ? 'Elder Profile' : 'Caregiver'}
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

            <div className="pt-2 border-t border-stone-200 dark:border-stone-800 mt-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 transition"
              >
                <Icons.LogOut size={18} />
                <span>{t.nav.signOut || 'Sign Out'}</span>
              </button>
            </div>
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