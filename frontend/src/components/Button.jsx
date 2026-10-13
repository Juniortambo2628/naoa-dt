import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { buttonClass } from './buttonStyles';

/**
 * Button — the one button component for the whole app (public site and
 * admin). Styles come from buttonStyles.js, matching the admin toolbar.
 *
 * @param {'primary'|'secondary'|'danger'} [variant='primary'] - primary is
 *   white and bordered, secondary is filled brown, danger is red text.
 * @param {'sm'|'md'|'lg'|'icon'|'icon-sm'} [size='md']
 * @param {LucideIcon} [icon] - leading icon component
 * @param {boolean} [loading] - shows a spinner in place of the icon and disables
 * @param {boolean} [fullWidth]
 * @param {ElementType} [as='button'] - render as another element, e.g. Link or 'a'
 */
const Button = forwardRef(function Button(
  {
    as: Tag = 'button',
    variant = 'primary',
    size = 'md',
    icon: Icon = null,
    loading = false,
    fullWidth = false,
    disabled = false,
    className = '',
    type,
    children,
    ...props
  },
  ref
) {
  const isButton = Tag === 'button';
  const isDisabled = disabled || loading;
  return (
    <Tag
      ref={ref}
      type={isButton ? type || 'button' : type}
      disabled={isButton ? isDisabled : undefined}
      aria-disabled={!isButton && isDisabled ? true : undefined}
      aria-busy={loading || undefined}
      className={buttonClass({ variant, size, fullWidth, className })}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" /> : Icon && <Icon />}
      {children}
    </Tag>
  );
});

export default Button;
