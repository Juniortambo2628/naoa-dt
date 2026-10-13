/**
 * The app's only two button styles, taken from the shared admin toolbar:
 *  - primary:   white, bordered (the toolbar's "Refresh" / "Select All")
 *  - secondary: filled brown (the toolbar's "Add User")
 *  - danger:    the primary style with red text, for destructive actions
 *
 * Use <Button> wherever you can; call buttonClass() only for elements that
 * can't be a Button (e.g. a <label> wrapping a file input).
 */
export const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap transition-all ' +
  'disabled:opacity-50 disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:cursor-not-allowed ' +
  '[&_svg]:w-4 [&_svg]:h-4 [&_svg]:shrink-0';

export const BUTTON_VARIANTS = {
  primary: 'bg-white/80 text-[#4A3F35] hover:bg-white border border-stone-200/60',
  secondary: 'bg-[#A67B5B] text-white hover:bg-[#8B5E3C] shadow-md border border-transparent',
  danger: 'bg-white/80 text-red-600 hover:bg-red-50 border border-stone-200/60',
};

export const BUTTON_SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
  // Square, icon-only buttons; give them an aria-label.
  icon: 'p-2.5 text-sm',
  'icon-sm': 'p-1.5 text-xs',
};

export function buttonClass({ variant = 'primary', size = 'md', fullWidth = false, className = '' } = {}) {
  return [
    BUTTON_BASE,
    BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary,
    BUTTON_SIZES[size] || BUTTON_SIZES.md,
    fullWidth ? 'w-full' : '',
    className,
  ].filter(Boolean).join(' ');
}
