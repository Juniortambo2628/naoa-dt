import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Clock, RefreshCw, CheckCircle, Trash2 } from 'lucide-react';
import { useGuestbook } from '../../hooks/useApiHooks';
import { guestbookService } from '../../services/api';
import EmptyState from '../../components/admin/EmptyState';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminListPanel from '../../components/admin/AdminListPanel';
import AdminBulkActions from '../../components/admin/AdminBulkActions';
import DeleteButton from '../../components/admin/DeleteButton';
import Button from '../../components/Button';
import { useSearch } from '../../context/SearchContext';
import useFilteredItems from '../../hooks/useFilteredItems';
import useCrudHandlers from '../../hooks/useCrudHandlers';
import { toast } from 'react-hot-toast';
import { confirmAction } from '../../utils/feedback';

export default function AdminGuestbook() {
  const { data, isLoading: loading, refetch } = useGuestbook();
  const entries = data?.entries || [];
  const { searchQuery } = useSearch();

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

  const clearSelection = () => setSelectedIds([]);

  const handleBulkDelete = async () => {
    if (!await confirmAction(`Delete ${selectedIds.length} selected messages?`)) return;
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
        fill
        actions={[
          {
            id: 'refresh',
            label: 'Refresh',
            icon: RefreshCw,
            onClick: () => refetch(),
            disabled: loading,
          },
        ]}
        hero={
          <AdminPageHero
            title="Guestbook Messages"
            description={`${entries.length} messages received`}
            breadcrumb="Guestbook"
            icon={<MessageSquare className="w-5 h-5 text-[#A67B5B]" />}
          />
        }
        search="Search messages or guest names..."
        filters={{ view: { options: ['list', 'grid'], value: viewMode, onChange: setViewMode } }}
      >
        <AdminBulkActions
          selectedCount={selectedIds.length}
          onClearSelection={clearSelection}
          actions={bulkActions}
        />

        <AdminListPanel plain>
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
        </AdminListPanel>
      </AdminPageLayout>
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
              <Button
                variant="danger"
                size="icon-sm"
                icon={Trash2}
                aria-label="Delete Message"
                title="Delete Message"
                className="absolute top-4 right-4"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(entry.id, { confirmMessage: 'Delete this message?' });
                }}
              />

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
