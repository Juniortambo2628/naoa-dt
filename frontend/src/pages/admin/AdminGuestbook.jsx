import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Clock, RefreshCw, CheckCircle, Trash2 } from 'lucide-react';
import { useGuestbook } from '../../hooks/useApiHooks';
import { guestbookService } from '../../services/api';
import EmptyState from '../../components/admin/EmptyState';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminToolbar from '../../components/admin/AdminToolbar';
import AdminFloatingToolbar from '../../components/admin/AdminFloatingToolbar';
import AdminBulkActions from '../../components/admin/AdminBulkActions';
import DeleteButton from '../../components/admin/DeleteButton';
import { useSearch } from '../../context/SearchContext';
import useFilteredItems from '../../hooks/useFilteredItems';
import useCrudHandlers from '../../hooks/useCrudHandlers';
import { toast } from 'react-hot-toast';

export default function AdminGuestbook() {
  const { t } = useTranslation();
  const { data, isLoading: loading, refetch } = useGuestbook();
  const entries = data?.entries || [];
  const { searchQuery, setSearchQuery } = useSearch();

  const { processing, handleDelete } = useCrudHandlers({
    service: guestbookService,
    onRefresh: refetch,
  });

  const [viewMode, setViewMode] = useState('list');
  const [selectedIds, setSelectedIds] = useState([]);

  const filteredEntries = useFilteredItems(entries, searchQuery, (entry, searchLower) =>
    (entry.guest_name || '').toLowerCase().includes(searchLower) ||
    (entry.message || '').toLowerCase().includes(searchLower)
  );

  const toggleSelection = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredEntries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEntries.map((entry) => entry.id));
    }
  };

  const clearSelection = () => setSelectedIds([]);

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} selected messages?`)) return;
    try {
      await Promise.all(selectedIds.map((id) => guestbookService.delete(id)));
      toast.success(`${selectedIds.length} messages deleted`);
      clearSelection();
      refetch();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete some messages');
    }
  };

  const bulkActions = [
    { id: 'delete', label: 'Delete Selected', icon: Trash2, variant: 'danger', onClick: handleBulkDelete },
  ];

  return (
    <>
      <AdminPageLayout
        hero={
          <AdminPageHero
            title="Guestbook Messages"
            description={`${entries.length} messages received`}
            breadcrumb="Guestbook"
            icon={<MessageSquare className="w-5 h-5 text-[#A67B5B]" />}
          />
        }
        toolbar={
          <AdminToolbar
            search={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search messages or guest names..."
            viewMode={viewMode}
            viewOptions={['list', 'grid']}
            onViewModeChange={setViewMode}
          />
        }
      >
        <AdminBulkActions
          selectedCount={selectedIds.length}
          onClearSelection={clearSelection}
          actions={bulkActions}
        />

        {loading && entries.length === 0 ? (
          <EmptyState loading />
        ) : filteredEntries.length === 0 ? (
          <EmptyState icon={MessageSquare} message="No messages yet" searchQuery={searchQuery} />
        ) : viewMode === 'grid' ? (
          <GuestbookGrid
            entries={filteredEntries}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelection}
            onDelete={handleDelete}
          />
        ) : (
          <GuestbookList
            entries={filteredEntries}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelection}
            onDelete={handleDelete}
            processing={processing}
          />
        )}
      </AdminPageLayout>
      <AdminFloatingToolbar
        actions={[
          {
            id: 'refresh',
            label: 'Refresh',
            icon: RefreshCw,
            onClick: () => refetch(),
            disabled: loading,
          },
        ]}
      />
    </>
  );
}

function SelectionCheckbox({ isSelected }) {
  return (
    <div
      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
        isSelected ? 'bg-[#A67B5B] border-[#A67B5B]' : 'border-stone-300 bg-white'
      }`}
    >
      {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
    </div>
  );
}

function GuestbookList({ entries, selectedIds, onToggleSelect, onDelete, processing }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <AnimatePresence>
        {entries.map((entry) => {
          const isSelected = selectedIds.includes(entry.id);
          return (
            <motion.div
              key={entry.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onToggleSelect(entry.id)}
              className={`bg-white p-6 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4 justify-between cursor-pointer transition-all ${
                isSelected ? 'border-[#A67B5B] ring-2 ring-[#A67B5B]/20' : 'border-stone-100'
              }`}
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="pt-1">
                  <SelectionCheckbox isSelected={isSelected} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-[#A67B5B]">{entry.guest_name}</span>
                    <span className="text-xs text-stone-400 flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-full">
                      <Clock className="w-3 h-3" /> {entry.time_ago}
                    </span>
                  </div>
                  <p className="text-stone-600 italic">"{entry.message}"</p>
                </div>
              </div>

              <div className="flex items-center gap-2 md:border-l md:border-stone-100 md:pl-4">
                <DeleteButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(entry.id, { confirmMessage: 'Delete this message?' });
                  }}
                  processing={processing === entry.id}
                  title="Delete Message"
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function GuestbookGrid({ entries, selectedIds, onToggleSelect, onDelete }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence>
        {entries.map((entry) => {
          const isSelected = selectedIds.includes(entry.id);
          return (
            <motion.div
              key={entry.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              onClick={() => onToggleSelect(entry.id)}
              className={`group relative bg-white rounded-2xl border border-stone-100 shadow-sm p-6 cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#A67B5B] ring-2 ring-[#A67B5B]/20'
                  : 'hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              {/* Selection checkbox */}
              <div className="absolute top-4 left-4">
                <div
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-[#A67B5B] border-[#A67B5B]' : 'bg-white border-stone-200 group-hover:border-[#A67B5B]/40'
                  }`}
                >
                  {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
              </div>

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(entry.id, { confirmMessage: 'Delete this message?' });
                }}
                className="absolute top-4 right-4 p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Delete Message"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="pt-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-bold text-[#A67B5B]">{entry.guest_name}</span>
                  <span className="text-xs text-stone-400 flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-full">
                    <Clock className="w-3 h-3" /> {entry.time_ago}
                  </span>
                </div>
                <p className="text-stone-600 italic leading-relaxed">"{entry.message}"</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
