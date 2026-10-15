import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Check, Clock,
  PlayCircle, RefreshCw, CheckCircle, Trash2,
  ListChecks,
} from 'lucide-react';
import { useSongRequests } from '../../hooks/useApiHooks';
import { songRequestService } from '../../services/api';
import AdminCard from '../../components/admin/AdminCard';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminListPanel from '../../components/admin/AdminListPanel';
import AdminBulkActions from '../../components/admin/AdminBulkActions';
import StatCard from '../../components/admin/StatCard';
import EmptyState from '../../components/admin/EmptyState';
import DeleteButton from '../../components/admin/DeleteButton';
import Button from '../../components/Button';
import { useSearch } from '../../context/SearchContext';
import useFilteredItems from '../../hooks/useFilteredItems';
import useCrudHandlers from '../../hooks/useCrudHandlers';
import useAdminAction, { useBulkAdminAction } from '../../hooks/useAdminAction';
import usePolling from '../../hooks/usePolling';

export default function AdminSongRequests() {
  const { data, isLoading: loading, refetch } = useSongRequests();
  const songs = data?.songs || [];
  const stats = data?.stats || { total: 0, played: 0, pending: 0 };
  const { searchQuery } = useSearch();
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [selectedIds, setSelectedIds] = useState([]);
  const { handleDelete, isProcessing: isDeleting } = useCrudHandlers({
    service: songRequestService,
    onRefresh: refetch,
  });

  const searchFilteredSongs = useFilteredItems(songs, searchQuery, (song, searchLower) =>
    (song.song_title && song.song_title.toLowerCase().includes(searchLower)) ||
    (song.artist && song.artist.toLowerCase().includes(searchLower)) ||
    (song.guest_name && song.guest_name.toLowerCase().includes(searchLower))
  );

  const filteredSongs = searchFilteredSongs.filter(song =>
    filter === 'all' ? true : (filter === 'played' ? song.is_played : !song.is_played)
  );

  usePolling(refetch, 30000);


  const toggleSelection = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredSongs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSongs.map(s => s.id));
    }
  };

  const clearSelection = () => setSelectedIds([]);

  const togglePlayed = useAdminAction((id, played) => songRequestService.setPlayed(id, played), {
    error: 'Failed to update song',
    onSuccess: () => refetch(),
  });
  const handleTogglePlayed = togglePlayed.run;
  const handleLocalDelete = handleDelete;

  const afterBulk = () => { clearSelection(); refetch(); };
  const bulkMarkPlayed = useBulkAdminAction((id) => songRequestService.setPlayed(id, true), {
    error: 'Failed to mark songs as played',
    onSuccess: afterBulk,
  });
  const bulkDelete = useBulkAdminAction((id) => songRequestService.delete(id), {
    confirm: (ids) => `Are you sure you want to delete ${ids.length} selected requests?`,
    onSuccess: afterBulk,
  });

  // Row spinners: the row's own action, or a bulk action that includes it.
  const bulkBusy = bulkMarkPlayed.pending || bulkDelete.pending;
  const isProcessing = (id) => togglePlayed.isPending(id) || isDeleting(id) || (bulkBusy && selectedIds.includes(id));

  const bulkActions = [
    { id: 'mark-played', label: 'Mark Played', icon: CheckCircle, variant: 'secondary', action: bulkMarkPlayed, args: [selectedIds] },
    { id: 'delete', label: 'Delete', icon: Trash2, variant: 'danger', action: bulkDelete, args: [selectedIds] },
  ];

  return (
    <>
      <AdminPageLayout
        fill
        actions={[
          {
            id: 'refresh', readOnly: true,
            label: 'Refresh',
            icon: RefreshCw,
            onClick: () => refetch(),
            disabled: loading,
          },
          {
            id: 'select-all',
            label: selectedIds.length === filteredSongs.length && filteredSongs.length > 0 ? 'Deselect All' : 'Select All',
            icon: ListChecks,
            onClick: toggleSelectAll,
            hidden: filteredSongs.length === 0,
          },
        ]}
        hero={
          <AdminPageHero
            title="Song Requests"
            description={`${songs.length} total requests from guests`}
            breadcrumb="Songs"
            icon={<Music className="w-5 h-5 text-[#A67B5B]" />}
          />
        }
        summary={
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              icon={<Music className="w-6 h-6" />}
              label="Total Requests"
              value={stats.total}
              color="#A67B5B"
            />
            <StatCard
              icon={<Clock className="w-6 h-6" />}
              label="Pending"
              value={stats.pending}
              color="#D4A59A"
            />
            <StatCard
              icon={<Check className="w-6 h-6" />}
              label="Played"
              value={stats.played}
              color="#8B9A7D"
            />
          </div>
        }
        search="Search songs…"
        filters={{ view: { options: ['list', 'grid'], value: viewMode, onChange: setViewMode } }}
        panel={{
          id: 'songs',
          title: 'Requests',
          icon: Music,
          subtitle: 'Checked for new requests every 30 seconds',
          items: [
            { id: 'all', label: 'All requests', icon: Music, count: songs.length },
            { id: 'pending', label: 'Not played yet', icon: Clock, count: songs.filter(song => !song.is_played).length },
            { id: 'played', label: 'Played', icon: Check, count: songs.filter(song => song.is_played).length },
          ],
          activeId: filter,
          onChange: (id) => { setFilter(id); clearSelection(); },
        }}
      >
        <AdminBulkActions
          selectedCount={selectedIds.length}
          onClearSelection={clearSelection}
          actions={bulkActions}
        />

        <AdminListPanel plain>
          {loading && songs.length === 0 ? (
            <EmptyState loading />
          ) : songs.length === 0 ? (
            <EmptyState icon={Music} message="No song requests yet" />
          ) : viewMode === 'grid' ? (
            <SongGrid
              songs={filteredSongs}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelection}
              onTogglePlayed={handleTogglePlayed}
              onDelete={handleLocalDelete}
              isProcessing={isProcessing}
            />
          ) : (
            <AdminCard padding={false} className="overflow-hidden">
              <div className="divide-y divide-stone-100">
                <AnimatePresence>
                  {filteredSongs.map((song) => (
                    <motion.div
                      key={song.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => toggleSelection(song.id)}
                      className={`p-4 flex items-center gap-4 transition-colors cursor-pointer ${
                        selectedIds.includes(song.id)
                          ? 'bg-[#A67B5B]/5'
                          : song.is_played
                            ? 'opacity-60 bg-stone-50 hover:bg-stone-50'
                            : 'hover:bg-stone-50'
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                          selectedIds.includes(song.id) ? 'bg-[#A67B5B] border-[#A67B5B]' : 'border-stone-300'
                        }`}
                        onClick={(e) => { e.stopPropagation(); toggleSelection(song.id); }}
                      >
                        {selectedIds.includes(song.id) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      </div>

                      {/* Status Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        song.is_played
                          ? 'bg-green-100 text-green-600'
                          : 'bg-orange-100 text-orange-600'
                      }`}>
                        {song.is_played ? <Check className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                      </div>

                      {/* Song Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-medium truncate ${song.is_played ? 'text-stone-500 line-through' : 'text-stone-800'}`}>
                            {song.song_title}
                          </h3>
                          {song.song_data?.preview_url && (
                            <a
                              href={song.song_data.preview_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[#A67B5B] hover:text-[#8B6B4D]"
                              title="Listen Preview"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-stone-500 truncate">{song.artist}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-stone-400">
                          <span>Requested by: <span className="font-medium text-stone-600">{song.guest_name}</span></span>
                          <span>•</span>
                          <span>{song.requested_at}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button edit
                          size="sm"
                          variant={song.is_played ? 'secondary' : 'primary'}
                          icon={Check}
                          onClick={() => handleTogglePlayed(song.id, !song.is_played)}
                          loading={isProcessing(song.id)}
                          aria-pressed={!!song.is_played}
                          title={song.is_played ? 'Mark as not played' : 'Mark as played'}
                        >
                          <span className="hidden sm:inline">Played</span>
                        </Button>

                        <DeleteButton
                          onClick={() => handleLocalDelete(song.id, { confirmMessage: 'Are you sure you want to remove this request?' })}
                          processing={isProcessing(song.id)}
                          title="Remove"
                        />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </AdminCard>
          )}
        </AdminListPanel>
      </AdminPageLayout>
    </>
  );
}

function SongGrid({ songs, selectedIds, onToggleSelect, onTogglePlayed, onDelete, isProcessing }) {
  return (
    <div className="grid grid-cols-1 @md:grid-cols-2 @2xl:grid-cols-3 @5xl:grid-cols-4 gap-4">
      {songs.map((song) => {
        const isSelected = selectedIds.includes(song.id);
        return (
          <div
            key={song.id}
            onClick={() => onToggleSelect(song.id)}
            className={`group relative rounded-2xl overflow-hidden bg-white border transition-all cursor-pointer ${
              isSelected
                ? 'border-[#A67B5B] ring-2 ring-[#A67B5B]/20 shadow-md'
                : 'border-stone-100 shadow-sm hover:shadow-lg hover:-translate-y-1'
            }`}
          >
            {/* Selection checkbox */}
            <div className="absolute top-3 left-3 z-10">
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                isSelected ? 'bg-[#A67B5B] border-[#A67B5B]' : 'bg-white/80 border-white'
              }`}>
                {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
              </div>
            </div>

            {/* Status badge */}
            <div className="absolute top-3 right-3 z-10">
              <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm ${
                song.is_played
                  ? 'bg-green-100 text-green-700'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {song.is_played ? <Check className="w-3 h-3" /> : <Music className="w-3 h-3" />}
                {song.is_played ? 'Played' : 'Pending'}
              </div>
            </div>

            {/* Card content */}
            <div className="p-5 pt-14">
              <h3 className={`text-base font-semibold mb-1 line-clamp-1 ${song.is_played ? 'text-stone-500 line-through' : 'text-[#4A3F35]'}`}>
                {song.song_title}
              </h3>
              <p className="text-sm text-[#8B7B6B] mb-4 line-clamp-1">{song.artist}</p>

              <div className="space-y-2 text-sm text-[#8B7B6B] mb-5">
                <div className="flex items-center gap-2">
                  <span className="text-stone-400">Requested by:</span>
                  <span className="font-medium text-[#4A3F35]">{song.guest_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  <span>{song.requested_at}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button edit
                  size="sm"
                  variant={song.is_played ? 'secondary' : 'primary'}
                  icon={Check}
                  className="flex-1"
                  onClick={(e) => { e.stopPropagation(); onTogglePlayed(song.id, !song.is_played); }}
                  loading={isProcessing(song.id)}
                  aria-pressed={!!song.is_played}
                  title={song.is_played ? 'Mark as not played' : 'Mark as played'}
                >
                  Played
                </Button>
                <Button edit
                  size="sm"
                  variant="danger"
                  icon={Trash2}
                  className="flex-1"
                  onClick={(e) => { e.stopPropagation(); onDelete(song.id, { confirmMessage: 'Are you sure you want to remove this request?' }); }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
