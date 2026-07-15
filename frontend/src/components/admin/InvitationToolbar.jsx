import { ChevronDown, FileImage, FileText, CloudCheck, AlertCircle } from 'lucide-react';
import Spinner from './Spinner';

export default function InvitationToolbar({
  saveStatus,
  isExporting,
  onTestExport,
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 ${
          saveStatus === 'saving'
            ? 'bg-amber-50 text-amber-700'
            : saveStatus === 'error'
            ? 'bg-red-50 text-red-700'
            : 'bg-green-50 text-green-700'
        }`}
      >
        {saveStatus === 'saving' ? (
          <Spinner size="sm" />
        ) : saveStatus === 'error' ? (
          <AlertCircle className="w-3 h-3" />
        ) : (
          <CloudCheck className="w-3 h-3" />
        )}
        {saveStatus === 'saving'
          ? 'Saving Changes...'
          : saveStatus === 'error'
          ? 'Save Error'
          : 'Changes Saved'}
      </div>

      {/* Actions Dropdown */}
      <div className="relative group">
        <button className="btn-primary flex items-center gap-2 px-4 py-2">
          Actions{' '}
          <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
        </button>
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-stone-100 rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          <button
            onClick={() => onTestExport('png')}
            disabled={isExporting}
            className="w-full text-left px-4 py-2 hover:bg-stone-50 text-sm flex items-center gap-2 text-stone-600"
          >
            <FileImage className="w-4 h-4" /> Test PNG
          </button>
          <button
            onClick={() => onTestExport('pdf')}
            disabled={isExporting}
            className="w-full text-left px-4 py-2 hover:bg-stone-50 text-sm flex items-center gap-2 text-stone-600"
          >
            <FileText className="w-4 h-4" /> Test PDF
          </button>
        </div>
      </div>
    </div>
  );
}
