import { describe, it, expect } from 'vitest';
import { getTranslation, translations } from '../lib/i18n';

describe('Multi-language i18n System', () => {
  it('provides complete translations in English, Hindi, and Tamil', () => {
    expect(translations.en).toBeDefined();
    expect(translations.hi).toBeDefined();
    expect(translations.ta).toBeDefined();

    expect(translations.en.actions.tookIt).toBe('I Took It');
    expect(translations.hi.actions.tookIt).toBe('मैंने दवा ले ली');
    expect(translations.ta.actions.tookIt).toBe('நான் மருந்து உட்கொண்டேன்');
  });

  it('falls back to English when unknown language code is requested', () => {
    const t = getTranslation('fr' as any);
    expect(t.appName).toBe('CareConnect');
    expect(t.nav.dashboard).toBe('Dashboard');
  });

  it('correctly retrieves Hindi translation', () => {
    const t = getTranslation('hi');
    expect(t.appName).toBe('केयर-कनेक्ट');
    expect(t.nav.familyCircle).toBe('परिवार मंडल');
  });

  it('correctly retrieves Tamil translation', () => {
    const t = getTranslation('ta');
    expect(t.appName).toBe('கேர்-கனெக்ட்');
    expect(t.nav.appointments).toBe('மருத்துவர் சந்திப்பு');
  });
});
