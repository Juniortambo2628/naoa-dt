import { X } from 'lucide-react';

export default function AdminModal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl w-full ${sizeClasses[size]} p-6 shadow-xl animate-in zoom-in duration-200`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-[#4A3F35]">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-stone-400" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
