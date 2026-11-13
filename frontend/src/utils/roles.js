/** Collaborator roles (enforced by the API; the UI only mirrors them). */
export const ROLES = [
  { value: 'owner', label: 'Owner', description: 'Everything, including people, roles and backups' },
  { value: 'editor', label: 'Editor', description: 'Edits guests, content, designs and settings' },
  { value: 'viewer', label: 'Viewer', description: 'Can look around but not change anything' },
  { value: 'usher', label: 'Usher', description: 'Wedding day: can only check guests in' },
];

export const roleLabel = (role) => ROLES.find((r) => r.value === role)?.label || 'Editor';

/** What a role may do. Accounts from before roles existed count as owners. */
export function permissionsFor(role = 'owner') {
  return {
    role,
    isOwner: role === 'owner',
    isUsher: role === 'usher',
    canEdit: role !== 'viewer' && role !== 'usher',
    // Ushers' one write: checking guests in at the door.
    canCheckIn: role !== 'viewer',
  };
}
