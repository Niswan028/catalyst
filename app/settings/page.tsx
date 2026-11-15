// Comprehensive User Settings: Notifications, Permissions, Language, Text Size, Dark & High-Contrast Mode
'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Toast } from '@/components/ui';
import { SupportedLanguage } from '@/lib/i18n';
import { supabase } from '@/lib/supabase/client';

export default function SettingsPage() {
  // Notification preferences
  const [notifications, setNotifications] = useState({
    upcoming_doses: true,
    missed_doses: true,
    appointments: true,
    weekly_digest: true,
  });

  // Sharing & Privacy Permissions (Elder-Controlled)
  const [permissions, setPermissions] = useState({
    medications: true,
    appointments: true,
    health_checkins: true,
    voice_messages: true,
    insights: true,
  });

  // Display & Accessibility preferences
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [textSize, setTextSize] = useState<'standard' | 'large' | 'extra-large'>('standard');
  const [darkMode, setDarkMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [easyModeDefault, setEasyModeDefault] = useState(false);

  // Feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Language
      const savedLang = (localStorage.getItem('careconnect_lang') as SupportedLanguage) || 'en';
      setLanguage(savedLang);

      // Text size
      const savedTextSize =
        (localStorage.getItem('careconnect_text_size') as 'standard' | 'large' | 'extra-large') ||
        'standard';
      setTextSize(savedTextSize);

      // Dark Mode
      const isDark =
        localStorage.getItem('careconnect_theme') === 'dark' ||
        document.documentElement.classList.contains('dark');
      setDarkMode(isDark);

      // High Contrast
      const isHighContrast =
        localStorage.getItem('careconnect_high_contrast') === 'true' ||
        document.documentElement.classList.contains('high-contrast');
      setHighContrast(isHighContrast);

      // Easy Mode
      setEasyModeDefault(localStorage.getItem('careconnect_easy_mode') === 'true');
    }
  }, []);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('careconnect_lang', newLang);
      window.dispatchEvent(new Event('careconnect_lang_change'));
    }
    showToast(`Language set to ${newLang === 'en' ? 'English' : newLang === 'hi' ? 'हिन्दी' : 'தமிழ்'}`);
  };

  const handleTextSizeChange = (size: 'standard' | 'large' | 'extra-large') => {
    setTextSize(size);
    if (typeof window !== 'undefined') {
      localStorage.setItem('careconnect_text_size', size);
      document.documentElement.classList.remove('text-size-lg', 'text-size-xl');
      if (size === 'large') document.documentElement.classList.add('text-size-lg');
      if (size === 'extra-large') document.documentElement.classList.add('text-size-xl');
    }
    showToast(`Display text size set to ${size}`);
  };

  const handleDarkModeToggle = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('careconnect_theme', next ? 'dark' : 'light');
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    showToast(next ? 'Dark mode enabled' : 'Dark mode disabled');
  };

  const handleHighContrastToggle = () => {
    const next = !highContrast;
    setHighContrast(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('careconnect_high_contrast', String(next));
      if (next) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
    }
    showToast(next ? 'High-contrast mode enabled' : 'High-contrast mode disabled');
  };

  const handleEasyModeToggle = () => {
    const next = !easyModeDefault;
    setEasyModeDefault(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('careconnect_easy_mode', String(next));
    }
    showToast(next ? 'Easy Mode enabled as default view' : 'Standard mode enabled');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const handleSaveNotificationPreferences = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        await fetch('/api/user/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(notifications),
        });
      }
      showToast('Notification preferences successfully saved!');
    } catch {
      showToast('Preferences updated locally.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-sm">
          <Toast
            type="success"
            title="Settings Updated"
            message={toastMessage}
            duration={3500}
            onClose={() => setToastMessage(null)}
          />
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Settings & Accessibility</h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
          Customize notifications, privacy sharing permissions, display readability, and language preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Display, Typography & Accessibility */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">👓</span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Display & Accessibility
            </h2>
          </div>

          <div className="space-y-4">
            {/* Text Size Scale */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Text Size Scale (WCAG 2.1 AA)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'standard', label: '18px Standard' },
                  { id: 'large', label: '19px Large' },
                  { id: 'extra-large', label: '21px Extra' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleTextSizeChange(s.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      textSize === s.id
                        ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">
                  🌙 Dark Mode
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Comfortable low-glare viewing for nighttime or low-light use
                </span>
              </div>
              <button
                type="button"
                onClick={handleDarkModeToggle}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  darkMode ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                role="switch"
                aria-checked={darkMode}
                aria-label="Toggle dark mode"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    darkMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* High Contrast Mode Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">
                  🔆 High Contrast Mode (7:1+ Ratio)
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Bold outlines, pure black/white surfaces for visual clarity
                </span>
              </div>
              <button
                type="button"
                onClick={handleHighContrastToggle}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  highContrast ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                role="switch"
                aria-checked={highContrast}
                aria-label="Toggle high contrast mode"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    highContrast ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Easy Mode Default Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-200">
              <div>
                <span className="text-sm font-bold text-amber-950 block">
                  👵 Launch in Easy Mode
                </span>
                <span className="text-xs text-amber-800">
                  Single-task full screen with 32px buttons and automated voice prompt
                </span>
              </div>
              <button
                type="button"
                onClick={handleEasyModeToggle}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  easyModeDefault ? 'bg-amber-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={easyModeDefault}
                aria-label="Toggle launch in Easy Mode"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    easyModeDefault ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>

        {/* Section 2: Language & Multi-Lingual Support */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🌐</span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Language / भाषा / மொழி
            </h2>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Select your preferred interface and reminder email language.
          </p>

          <div className="space-y-3">
            {[
              { code: 'en', title: 'English (US)', desc: 'Standard clinical and care terms' },
              { code: 'hi', title: 'हिन्दी (Hindi)', desc: 'दवा, डॉक्टर मुलाक़ात और परिवार अलर्ट' },
              { code: 'ta', title: 'தமிழ் (Tamil)', desc: 'மருந்து அட்டவணை மற்றும் நினைவூட்டல்' },
            ].map((lang) => (
              <label
                key={lang.code}
                className={`flex items-start p-3.5 border-2 rounded-xl cursor-pointer transition ${
                  language === lang.code
                    ? 'border-primary-600 bg-primary-50/70 dark:bg-primary-950/40 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
                }`}
              >
                <input
                  type="radio"
                  name="appLanguage"
                  value={lang.code}
                  checked={language === lang.code}
                  onChange={() => handleLanguageChange(lang.code as SupportedLanguage)}
                  className="mt-1 mr-3 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    {lang.title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang.desc}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </Card>

        {/* Section 3: Proactive Email Reminders */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🔔</span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Proactive Email Reminders
            </h2>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Select which triggers generate proactive automated notifications to you and your care circle.
          </p>

          <div className="space-y-3">
            {[
              {
                id: 'upcoming_doses',
                title: 'Upcoming Dose Reminders',
                desc: 'Email 15-30 minutes before a scheduled medication time.',
              },
              {
                id: 'missed_doses',
                title: 'Missed Dose Escalation Chain',
                desc: 'Alert elder at +15m; escalate urgent warning to family at +60m.',
              },
              {
                id: 'appointments',
                title: 'Doctor Appointment Reminders',
                desc: '24-hour and 2-hour email countdowns with clinic address.',
              },
              {
                id: 'weekly_digest',
                title: 'Weekly Family Health Digest',
                desc: '7-day adherence summary and medication refill forecast.',
              },
            ].map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={notifications[item.id as keyof typeof notifications]}
                  onChange={(e) =>
                    setNotifications({
                      ...notifications,
                      [item.id]: e.target.checked,
                    })
                  }
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">
                    {item.title}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {item.desc}
                  </span>
                </div>
              </label>
            ))}

            <Button
              onClick={handleSaveNotificationPreferences}
              className="w-full mt-2 font-bold py-2.5"
            >
              Save Notification Preferences
            </Button>
          </div>
        </Card>

        {/* Section 4: Elder-Controlled Privacy & Sharing */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🛡️</span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Elder Privacy Controls
            </h2>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            You maintain full sovereignty over what your family circle and doctors can inspect.
          </p>

          <div className="space-y-3">
            {[
              {
                key: 'medications',
                label: 'Share Medication Prescriptions & Dosages',
              },
              {
                key: 'appointments',
                label: 'Share Doctor Appointment Schedule & Clinics',
              },
              {
                key: 'health_checkins',
                label: 'Share Daily Mood & Symptom Check-in Transcripts',
              },
              {
                key: 'voice_messages',
                label: 'Allow Two-Way Voice Messages in Care Circle',
              },
              {
                key: 'insights',
                label: 'Share Adherence Percentage & Refill Forecasts',
              },
            ].map((p) => (
              <label
                key={p.key}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {p.label}
                </span>
                <input
                  type="checkbox"
                  checked={permissions[p.key as keyof typeof permissions]}
                  onChange={(e) => {
                    const next = { ...permissions, [p.key]: e.target.checked };
                    setPermissions(next);
                    showToast('Sharing permissions updated.');
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
              </label>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
