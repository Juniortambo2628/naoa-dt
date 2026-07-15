const baseInputClasses = "w-full px-4 py-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B] transition-colors";

export function AdminInput({ label, error, className = '', ...props }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-stone-600 mb-1">{label}</label>}
      <input className={`${baseInputClasses} ${error ? 'border-red-400' : ''} ${className}`} {...props} />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export function AdminTextarea({ label, error, className = '', ...props }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-stone-600 mb-1">{label}</label>}
      <textarea className={`${baseInputClasses} resize-none ${error ? 'border-red-400' : ''} ${className}`} {...props} />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export function AdminSelect({ label, error, children, className = '', ...props }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-stone-600 mb-1">{label}</label>}
      <select className={`${baseInputClasses} ${error ? 'border-red-400' : ''} ${className}`} {...props}>
        {children}
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
