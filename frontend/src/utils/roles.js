/** Collaborator roles (enforced by the API; the UI only mirrors them). */
export const ROLES = [
  { value: 'owner', label: 'Owner', description: 'Everything, including people, roles and backups' },
  { value: 'editor', label: 'Editor', description: 'Edits guests, content, designs and settings' },
  { value: 'viewer', label: 'Viewer', description: 'Can look around but not change anything' },
];

export const roleLabel = (role) => ROLES.find((r) => r.value === role)?.label || 'Editor';

/** What a role may do. Accounts from before roles existed count as owners. */
export function permissionsFor(role = 'owner') {
  return {
    role,
    isOwner: role === 'owner',
    canEdit: role !== 'viewer',
  };
}
