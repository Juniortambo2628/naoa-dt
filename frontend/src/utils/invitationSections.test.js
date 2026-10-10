import { describe, it, expect } from 'vitest';
import { resolveInvitationSections, INVITATION_SECTIONS } from './invitationSections';

describe('resolveInvitationSections', () => {
  it('shows everything by default', () => {
    const s = resolveInvitationSections(undefined);
    expect(Object.values(s).every(Boolean)).toBe(true);
    expect(Object.keys(s)).toHaveLength(INVITATION_SECTIONS.length);
  });

  it('hides only sections explicitly set to false', () => {
    const s = resolveInvitationSections({ map: false, weather: true, unknown: false });
    expect(s.map).toBe(false);
    expect(s.weather).toBe(true);
    expect(s.unknown).toBeUndefined();
  });

  it('ignores malformed values', () => {
    expect(resolveInvitationSections('nope').card).toBe(true);
    expect(resolveInvitationSections([]).card).toBe(true);
  });
});
