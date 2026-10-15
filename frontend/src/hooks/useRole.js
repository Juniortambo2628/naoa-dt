import { useAuth } from '../context/AuthContext';
import { permissionsFor } from '../utils/roles';

/** The signed-in collaborator's role and what it allows ({ role, isOwner, canEdit }). */
export default function useRole() {
  const { user } = useAuth();
  return permissionsFor(user?.role);
}
