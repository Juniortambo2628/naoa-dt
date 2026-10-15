import useRole from '../../hooks/useRole';

// Viewers see the switch's state but can't flip it.
export default function ToggleButton({ enabled, onToggle, label }) {
  const { canEdit } = useRole();
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!canEdit}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
        enabled ? 'bg-[#A67B5B]' : 'bg-stone-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
      {label && <span className="sr-only">{label}</span>}
    </button>
  );
}
