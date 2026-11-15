// Multi-language internationalization support (English, Hindi, Tamil)

export type SupportedLanguage = 'en' | 'hi' | 'ta';

export interface Translations {
  appName: string;
  tagline: string;
  nav: {
    dashboard: string;
    checkin: string;
    medications: string;
    appointments: string;
    messages: string;
    familyCircle: string;
    easyMode: string;
    tour: string;
    settings: string;
    audit: string;
    signOut: string;
  };
  actions: {
    tookIt: string;
    skip: string;
    takeDose: string;
    addMedication: string;
    exportCalendar: string;
    refresh: string;
    save: string;
    cancel: string;
    testReminders: string;
  };
  dashboard: {
    welcome: string;
    todaysSchedule: string;
    adherenceOverview: string;
    upcomingAppointments: string;
    refillAlerts: string;
    noDataYet: string;
    noMedsToday: string;
    streak: string;
    adherenceRate: string;
  };
}

export const translations: Record<SupportedLanguage, Translations> = {
  en: {
    appName: 'CareConnect',
    tagline: 'Elderly Care & Medication Management',
    nav: {
      dashboard: 'Dashboard',
      checkin: 'Check-In',
      medications: 'Medications',
      appointments: 'Appointments',
      messages: 'Messages',
      familyCircle: 'Family Care Circle',
      easyMode: 'Easy Mode',
      tour: 'Tour',
      settings: 'Settings',
      audit: 'Audit Log',
      signOut: 'Sign Out',
    },
    actions: {
      tookIt: 'I Took It',
      skip: 'Skip Dose',
      takeDose: 'Confirm Taken',
      addMedication: 'Add Medication',
      exportCalendar: 'Export .ics Calendar',
      refresh: 'Refresh',
      save: 'Save Changes',
      cancel: 'Cancel',
      testReminders: 'Test Reminders',
    },
    dashboard: {
      welcome: 'Welcome back',
      todaysSchedule: "Today's Medication Schedule",
      adherenceOverview: 'Adherence Insights',
      upcomingAppointments: 'Upcoming Doctor Appointments',
      refillAlerts: 'Refill Forecasts & Stock Alerts',
      noDataYet: 'No data yet',
      noMedsToday: 'No doses scheduled for today.',
      streak: 'Day Streak',
      adherenceRate: 'Adherence Rate',
    },
  },
  hi: {
    appName: 'केयर-कनेक्ट',
    tagline: 'बुजुर्गों की देखभाल और दवा प्रबंधन',
    nav: {
      dashboard: 'डैशबोर्ड',
      checkin: 'स्वास्थ्य जांच',
      medications: 'दवाइयाँ',
      appointments: 'डॉक्टर अपॉइंटमेंट',
      messages: 'संदेश',
      familyCircle: 'परिवार मंडल',
      easyMode: 'सरल मोड',
      tour: 'टूर',
      settings: 'सेटिंग्स',
      audit: 'ऑडिट लॉग',
      signOut: 'साइन आउट',
    },
    actions: {
      tookIt: 'मैंने दवा ले ली',
      skip: 'छोड़ें',
      takeDose: 'पुष्टि करें',
      addMedication: 'दवा जोड़ें',
      exportCalendar: 'कैलेंडर निर्यात करें',
      refresh: 'रीफ्रेश करें',
      save: 'सहेजें',
      cancel: 'रद्द करें',
      testReminders: 'रिमाइंडर टेस्ट करें',
    },
    dashboard: {
      welcome: 'वापसी पर स्वागत है',
      todaysSchedule: 'आज की दवा अनुसूची',
      adherenceOverview: 'दवा पालन समीक्षा',
      upcomingAppointments: 'आगामी डॉक्टर नियुक्तियाँ',
      refillAlerts: 'दवा स्टॉक और रिफिल सूचनाएं',
      noDataYet: 'अभी कोई डेटा नहीं',
      noMedsToday: 'आज के लिए कोई दवा निर्धारित नहीं है।',
      streak: 'लगातार दिन',
      adherenceRate: 'पालन दर',
    },
  },
  ta: {
    appName: 'கேர்-கனெக்ட்',
    tagline: 'முதியோர் பராமரிப்பு மற்றும் மருந்து மேலாண்மை',
    nav: {
      dashboard: 'முகப்பு',
      checkin: 'உடல்நல சரிபார்ப்பு',
      medications: 'மருந்துகள்',
      appointments: 'மருத்துவர் சந்திப்பு',
      messages: 'செய்திகள்',
      familyCircle: 'குடும்ப வட்டம்',
      easyMode: 'எளிய முறை',
      tour: 'வழிகாட்டி',
      settings: 'அமைப்புகள்',
      audit: 'பதிவு வரலாறு',
      signOut: 'வெளியேறு',
    },
    actions: {
      tookIt: 'நான் மருந்து உட்கொண்டேன்',
      skip: 'தவிர்',
      takeDose: 'உறுதி செய்',
      addMedication: 'மருந்து சேர்',
      exportCalendar: 'நாள்காட்டி ஏற்றுமதி',
      refresh: 'புதுப்பி',
      save: 'சேமி',
      cancel: 'ரத்து செய்',
      testReminders: 'நினைவூட்டல் சோதனை',
    },
    dashboard: {
      welcome: 'மீண்டும் நல்வரவு',
      todaysSchedule: 'இன்றைய மருந்து அட்டவணை',
      adherenceOverview: 'மருந்து உட்கொள்ளும் விபரம்',
      upcomingAppointments: 'வரவிருக்கும் மருத்துவ சந்திப்புகள்',
      refillAlerts: 'மருந்து இருப்பு எச்சரிக்கை',
      noDataYet: 'தரவு எதுவும் இல்லை',
      noMedsToday: 'இன்று மருந்துகள் எதுவும் திட்டமிடப்படவில்லை.',
      streak: 'தொடர் நாட்கள்',
      adherenceRate: 'உட்கொள்ளும் சதவீதம்',
    },
  },
};

export function getTranslation(lang: SupportedLanguage = 'en'): Translations {
  return translations[lang] || translations.en;
}
