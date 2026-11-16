import { describe, it, expect } from 'vitest';
import { isAfterWedding, sectionsForPhase, thankYouMessage, DEFAULT_THANK_YOU } from './weddingPhase';

const settings = { wedding_date: '2026-11-14' };

describe('wedding phase', () => {
  it('switches to thank-you mode from the day after the wedding', () => {
    expect(isAfterWedding(settings, {}, new Date(2026, 10, 14, 23, 59))).toBe(false);
    expect(isAfterWedding(settings, {}, new Date(2026, 10, 15, 0, 1))).toBe(true);
  });

  it('can be switched on early or held back from admin', () => {
    expect(isAfterWedding({ ...settings, wedding_phase: 'after' }, {}, new Date(2026, 0, 1))).toBe(true);
    expect(isAfterWedding({ ...settings, wedding_phase: 'before' }, {}, new Date(2027, 0, 1))).toBe(false);
  });

  it('hides what no longer applies but keeps gifts and what the admin chose', () => {
    const show = { rsvp: true, weather: true, map: true, cashGift: true, signoff: false };
    expect(sectionsForPhase(show, true)).toEqual({ rsvp: false, weather: false, map: false, cashGift: true, signoff: false });
    expect(sectionsForPhase(show, false)).toBe(show);
  });

  it('uses the couple\'s own thank-you words when set', () => {
    expect(thankYouMessage({})).toBe(DEFAULT_THANK_YOU);
    expect(thankYouMessage({ thank_you_message: ' Asante! ' })).toBe('Asante!');
  });
});
