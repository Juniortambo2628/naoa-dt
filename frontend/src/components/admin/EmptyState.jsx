import { Skeleton } from '../Skeleton';
import Button from '../Button';

/**
 * Loading / empty placeholder for admin lists.
 *
 * @param {LucideIcon} [icon]
 * @param {string}     [message]     - Shown when there is nothing yet
 * @param {string}     [searchQuery] - When set, the empty message talks about the search
 * @param {boolean}    [loading]     - Render skeleton rows instead
 * @param {number}     [rows=5]      - Skeleton rows while loading
 * @param {{ label: string, onClick: function, icon?: LucideIcon }} [action] - Next step button
 */
export default function EmptyState({ icon: Icon, message, searchQuery, loading, rows = 5, action }) {
  if (loading) {
    return (
      <div className="p-6 space-y-4" role="status" aria-label="Loading">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton variant="circle" width="36px" height="36px" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" width={`${60 - (i % 3) * 12}%`} />
              <Skeleton variant="text" width="35%" height="10px" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-12 text-center text-stone-500">
      {Icon && <Icon className="w-12 h-12 mx-auto mb-4 opacity-20" aria-hidden="true" />}
      <p>{searchQuery ? `Nothing matches “${searchQuery}”` : message || 'No items yet'}</p>
      {searchQuery && <p className="mt-1 text-sm text-stone-500">Try a different search or clear the filters.</p>}
      {!searchQuery && action && (
        <Button variant="secondary" icon={action.icon} onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}
