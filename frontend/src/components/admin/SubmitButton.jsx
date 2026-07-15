import Spinner from './Spinner';

/**
 * SubmitButton — consistent form submit button for admin modals/forms.
 * Shows a spinner and disabled state while loading.
 *
 * @param {boolean}  loading   - Whether the form is submitting
 * @param {ReactNode} icon     - Icon to show when not loading
 * @param {string}   label     - Button text
 * @param {boolean}  [fullWidth=true] - Whether to take full width
 * @param {string}   [className] - Additional classes
 */
export default function SubmitButton({ loading, icon, label, fullWidth = true, className = '' }) {
  return (
    <button 
      type="submit" 
      disabled={loading} 
      className={`btn-primary ${fullWidth ? 'w-full' : ''} flex justify-center items-center gap-2 ${className}`}
    >
      {loading ? <Spinner size="sm" /> : icon}
      {label}
    </button>
  );
}
