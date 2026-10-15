import { moduleForPath, initials, collaboratorColor } from './adminModules';

describe('moduleForPath', () => {
  it('matches the dashboard root and nested pages', () => {
    expect(moduleForPath('/admin/dashboard').key).toBe('dashboard');
    expect(moduleForPath('/admin/dashboard/').key).toBe('dashboard');
    expect(moduleForPath('/admin/dashboard/seating').key).toBe('seating');
    expect(moduleForPath('/admin/dashboard/settings/extra').key).toBe('settings');
  });

  it('does not match a module by prefix alone', () => {
    expect(moduleForPath('/admin/dashboard/guestbook').key).toBe('guestbook');
    expect(moduleForPath('/admin')).toBeNull();
  });
});

describe('collaborator helpers', () => {
  it('builds initials', () => {
    expect(initials('Tze Ren Tang')).toBe('TR');
    expect(initials('')).toBe('?');
  });

  it('gives a stable colour per id', () => {
    expect(collaboratorColor(3)).toBe(collaboratorColor(3));
  });
});
