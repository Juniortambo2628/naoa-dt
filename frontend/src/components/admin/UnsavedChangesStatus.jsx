import { AlertCircle } from 'lucide-react';
import { AdminHeaderStatus } from '../../context/AdminChromeContext';

/** Header chip shown while a page has unsaved edits. */
export default function UnsavedChangesStatus({ dirty }) {
  if (!dirty) return null;
  return (
    <AdminHeaderStatus>
      <span role="status" className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 bg-amber-50 text-amber-800 whitespace-nowrap">
        <AlertCircle className="w-3.5 h-3.5" /> Unsaved changes
      </span>
    </AdminHeaderStatus>
  );
}
