import { describe, it, expect } from 'vitest';
import { resolveGuestNotices, visibleGuestNotices, DEFAULT_GUEST_NOTICES } from './guestNotices';

describe('resolveGuestNotices', () => {
  it('returns the four defaults when nothing is stored', () => {
    const notices = resolveGuestNotices(undefined);
    expect(notices.map(n => n.id)).toEqual(['invite_only', 'no_kids', 'cash_gifts', 'dress_code']);
    expect(notices.every(n => n.enabled)).toBe(true);
    expect(resolveGuestNotices('nope')).toHaveLength(DEFAULT_GUEST_NOTICES.length);
  });

  it('applies stored text and enabled overrides onto the defaults', () => {
    const notices = resolveGuestNotices([
      { id: 'dress_code', text: 'Black tie optional', enabled: false },
      { id: 'cash_gifts', text: 'M-Pesa only' },
    ]);
    const dress = notices.find(n => n.id === 'dress_code');
    const gifts = notices.find(n => n.id === 'cash_gifts');
    expect(dress.text).toBe('Black tie optional');
    expect(dress.enabled).toBe(false);
    expect(gifts.text).toBe('M-Pesa only');
    expect(gifts.enabled).toBe(true);
  });

  it('keeps custom notices after the defaults', () => {
    const notices = resolveGuestNotices([
      { id: 'parking', icon: 'info', enabled: true, text: 'Free parking on site' },
    ]);
    expect(notices).toHaveLength(DEFAULT_GUEST_NOTICES.length + 1);
    expect(notices.at(-1).text).toBe('Free parking on site');
  });

  it('ignores malformed entries', () => {
    expect(resolveGuestNotices([null, 'x', [1]])).toHaveLength(DEFAULT_GUEST_NOTICES.length);
  });
});

describe('visibleGuestNotices', () => {
  it('drops disabled defaults and custom notices with empty text', () => {
    const visible = visibleGuestNotices([
      { id: 'no_kids', enabled: false },
      { id: 'parking', text: 'Free parking' },
      { id: 'photo_dress', text: '   ' },
    ]);
    expect(visible.map(n => n.id)).toEqual(['invite_only', 'cash_gifts', 'dress_code', 'parking']);
  });
});
