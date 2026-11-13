import { permissionsFor, roleLabel } from './roles';

describe('roles', () => {
  it('maps roles to permissions', () => {
    expect(permissionsFor('owner')).toMatchObject({ isOwner: true, canEdit: true });
    expect(permissionsFor('editor')).toMatchObject({ isOwner: false, canEdit: true });
    expect(permissionsFor('viewer')).toMatchObject({ isOwner: false, canEdit: false, canCheckIn: false });
    expect(permissionsFor('usher')).toMatchObject({ isOwner: false, isUsher: true, canEdit: false, canCheckIn: true });
    expect(permissionsFor('editor')).toMatchObject({ canCheckIn: true });
  });

  it('labels roles', () => {
    expect(roleLabel('viewer')).toBe('Viewer');
    expect(roleLabel('usher')).toBe('Usher');
  });
});
