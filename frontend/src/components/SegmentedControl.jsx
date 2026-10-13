import { useRef } from 'react';
import Button from './Button';

const NEXT_KEYS = ['ArrowRight', 'ArrowDown'];
const PREV_KEYS = ['ArrowLeft', 'ArrowUp'];

/**
 * SegmentedControl — a single choice from a few options, drawn with the shared
 * button styles (the selected option is 'secondary', the rest 'primary').
 *
 * Rendered as a radio group: each option is a role="radio" button with
 * aria-checked, only the selected option is in the tab order, and the arrow
 * keys (plus Home/End) move the selection, as for native radio buttons.
 *
 * @param {Array}    options   - [{ value, label?, icon?, ariaLabel?, title?, disabled? }];
 *                               an option without a label is icon-only and needs ariaLabel
 * @param {*}        value     - the selected option's value
 * @param {function} onChange  - (value) => void
 * @param {'sm'|'md'} [size='md']
 * @param {boolean}  [fullWidth] - stretch the options to share the width equally
 * @param {string}   [aria-label]
 * @param {string}   [className] - layout classes for the group (a gap-* here
 *                               replaces the default gap)
 */
export default function SegmentedControl({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) {
  const refs = useRef([]);
  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
  const selectedIndex = options.findIndex((o) => o.value === value);
  // Roving tabindex: the selected option, or the first enabled one if none is.
  const tabStop = selectedIndex >= 0 && !options[selectedIndex].disabled ? selectedIndex : enabled[0];

  const select = (index) => {
    refs.current[index]?.focus();
    if (options[index].value !== value) onChange?.(options[index].value);
  };

  const onKeyDown = (e, index) => {
    const pos = enabled.indexOf(index);
    let target;
    if (NEXT_KEYS.includes(e.key)) target = enabled[(pos + 1) % enabled.length];
    else if (PREV_KEYS.includes(e.key)) target = enabled[(pos - 1 + enabled.length) % enabled.length];
    else if (e.key === 'Home') target = enabled[0];
    else if (e.key === 'End') target = enabled[enabled.length - 1];
    else return;
    e.preventDefault();
    select(target);
  };

  return (
    <div
      role="radiogroup"
      className={[fullWidth ? 'flex w-full' : 'inline-flex', /(^|\s)gap-/.test(className) ? '' : 'gap-1.5', className]
        .filter(Boolean).join(' ')}
      {...props}
    >
      {options.map((option, index) => {
        const selected = index === selectedIndex;
        const iconOnly = option.label === undefined || option.label === null;
        return (
          <Button
            key={String(option.value)}
            ref={(el) => { refs.current[index] = el; }}
            role="radio"
            aria-checked={selected}
            aria-label={option.ariaLabel}
            title={option.title}
            tabIndex={index === tabStop ? 0 : -1}
            disabled={option.disabled}
            variant={selected ? 'secondary' : 'primary'}
            size={iconOnly ? (size === 'sm' ? 'icon-sm' : 'icon') : size}
            icon={option.icon}
            className={fullWidth ? 'flex-1 min-w-0' : ''}
            onClick={() => select(index)}
            onKeyDown={(e) => onKeyDown(e, index)}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
