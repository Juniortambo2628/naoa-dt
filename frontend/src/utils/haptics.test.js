import { describe, it, expect, vi } from 'vitest';
import { vibrate, PATTERNS } from './haptics';

describe('vibrate', () => {
  it('buzzes with the pattern for each outcome', () => {
    const nav = { vibrate: vi.fn(() => true) };
    vibrate('success', nav);
    expect(nav.vibrate).toHaveBeenCalledWith(PATTERNS.success);
  });

  it('does nothing where the phone cannot vibrate (iPhone)', () => {
    expect(vibrate('found', {})).toBe(false);
  });
});
