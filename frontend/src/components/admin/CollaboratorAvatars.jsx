import { collaboratorColor, initials, moduleByKey } from '../../utils/adminModules';

const SIZES = {
  xs: 'w-5 h-5 text-[9px]',
  sm: 'w-7 h-7 text-[11px]',
  md: 'w-9 h-9 text-xs',
};

export function CollaboratorAvatar({ person, size = 'sm', className = '' }) {
  const where = moduleByKey(person.current_module)?.label;
  return (
    <span
      className={`${SIZES[size]} rounded-full ring-2 ring-[#FFF9F5] text-white font-semibold flex items-center justify-center shrink-0 ${className}`}
      style={{ background: collaboratorColor(person.id) }}
      title={where ? `${person.name} — on ${where}` : person.name}
    >
      {initials(person.name)}
    </span>
  );
}

/** Overlapping avatars of collaborators, with "+N" past `max`. */
export default function CollaboratorAvatars({ people = [], max = 3, size = 'sm' }) {
  if (!people.length) return null;
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <span className="flex items-center -space-x-1.5">
      {shown.map((person) => <CollaboratorAvatar key={person.id} person={person} size={size} />)}
      {extra > 0 && (
        <span className={`${SIZES[size]} rounded-full ring-2 ring-[#FFF9F5] bg-stone-200 text-stone-700 font-semibold flex items-center justify-center`}>
          +{extra}
        </span>
      )}
    </span>
  );
}
