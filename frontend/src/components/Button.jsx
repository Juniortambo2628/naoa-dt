import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { buttonClass } from './buttonStyles';
import useRole from '../hooks/useRole';

/**
 * Button — the one button component for the whole app (public site and
 * admin). Styles come from buttonStyles.js, matching the admin toolbar.
 *
 * @param {'primary'|'secondary'|'danger'} [variant='primary'] - primary is
 *   white and bordered, secondary is filled brown, danger is red text.
 * @param {'sm'|'md'|'lg'|'icon'|'icon-sm'} [size='md']
 * @param {'sans'|'serif'} [font='sans'] - typeface only (serif for guest-site RSVP calls to action)
 * @param {LucideIcon} [icon] - leading icon component
 * @param {boolean} [loading] - shows a spinner in place of the icon and disables
 * @param {boolean} [fullWidth]
 * @param {ElementType} [as='button'] - render as another element, e.g. Link or 'a'
 * @param {boolean} [edit] - an editing action: not rendered for view-only collaborators
 * @param {object} [action] - a useAdminAction: runs on click (with `args`), shows its
 *   pending state, and is hidden for view-only collaborators — no onClick/edit needed
 * @param {Array} [args] - arguments for `action.run` (its first one is the pending key)
 */
const Button = forwardRef(function Button(
  {
    as: Tag = 'button',
    variant = 'primary',
    size = 'md',
    font = 'sans',
    icon: Icon = null,
    loading = false,
    fullWidth = false,
    disabled = false,
    className = '',
    type,
    edit = false,
    action = null,
    args = [],
    children,
    ...props
  },
  ref
) {
  const { canEdit } = useRole();
  if ((edit && !canEdit) || (action && !action.allowed)) return null;
  const busy = loading || (action ? action.isPending(args[0]) : false);
  const onClick = props.onClick ?? (action ? () => action.run(...args) : undefined);
  const isButton = Tag === 'button';
  const isDisabled = disabled || busy;
  return (
    <Tag
      ref={ref}
      type={isButton ? type || 'button' : type}
      disabled={isButton ? isDisabled : undefined}
      aria-disabled={!isButton && isDisabled ? true : undefined}
      aria-busy={busy || undefined}
      className={buttonClass({ variant, size, font, fullWidth, className })}
      {...props}
      onClick={onClick}
    >
      {busy ? <Loader2 className="animate-spin" /> : Icon && <Icon />}
      {children}
    </Tag>
  );
});

export default Button;
