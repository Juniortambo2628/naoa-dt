import { Loader2 } from 'lucide-react';

export default function EmptyState({ icon: Icon, message, searchQuery, loading }) {
  if (loading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#A67B5B]" />
      </div>
    );
  }

  return (
    <div className="p-12 text-center text-stone-500">
      {Icon && <Icon className="w-12 h-12 mx-auto mb-4 opacity-20" />}
      <p>{searchQuery ? 'No matching items found' : message || 'No items yet'}</p>
    </div>
  );
}
