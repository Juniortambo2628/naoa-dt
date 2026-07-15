export default function AdminCard({ children, className = '', padding = true }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-stone-100 ${padding ? 'p-6' : ''} ${className}`}>
      {children}
    </div>
  );
}
