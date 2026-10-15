import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { permissionsFor } from '../utils/roles';

/**
 * The signed-in collaborator's role and what it allows ({ role, isOwner, canEdit }).
 * Safe outside the AuthProvider (e.g. component tests): everything is allowed.
 */
export default function useRole() {
  const user = useContext(AuthContext)?.user;
  return permissionsFor(user?.role);
}

/**
 * Hide/keep page actions by role: viewers keep only actions marked `readOnly`
 * (view, export, refresh, print…). Everything else is treated as an edit.
 */
export function useVisibleActions(actions = []) {
  const { canEdit } = useRole();
  return canEdit ? actions : actions.filter((action) => action?.readOnly);
}
