import { useId } from 'react';

const baseInputClasses = "w-full px-4 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B] transition-colors";

export function AdminInput({ label, error, className = '', id, ...props }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  return (
    <div>
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-stone-600 mb-1">{label}</label>}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${baseInputClasses} ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <p id={errorId} className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export function AdminTextarea({ label, error, className = '', id, ...props }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  return (
    <div>
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-stone-600 mb-1">{label}</label>}
      <textarea
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${baseInputClasses} resize-none ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <p id={errorId} className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export function AdminSelect({ label, error, children, className = '', id, ...props }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  return (
    <div>
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-stone-600 mb-1">{label}</label>}
      <select
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${baseInputClasses} ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p id={errorId} className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
