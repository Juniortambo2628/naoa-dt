import useRole from '../../hooks/useRole';

/**
 * Wrap an editing form: for viewers every input, select and button inside is
 * disabled by the browser (native <fieldset disabled>), with no per-field code.
 * Lays out as if it weren't there (display: contents). `allow` keeps it
 * enabled for everyone (e.g. a viewer's own account settings).
 */
export default function EditableFieldset({ children, className = 'contents', allow = false }) {
  const { canEdit } = useRole();
  return (
    <fieldset disabled={!canEdit && !allow} className={`min-w-0 border-0 p-0 m-0 ${className}`}>
      {children}
    </fieldset>
  );
}
