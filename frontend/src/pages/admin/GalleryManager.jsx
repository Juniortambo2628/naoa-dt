import Overlay from '../../components/Overlay';
import { useState, useEffect } from 'react';
import { galleryService, getAssetUrl } from '../../services/api';
import { Plus, Trash2, Eye, EyeOff, Image as ImageIcon, UserCheck, ArrowUpDown, GripVertical, Check, Upload, X } from 'lucide-react';
import { Reorder } from 'framer-motion';
import ImageUpload from '../../components/admin/ImageUpload';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminBulkActions from '../../components/admin/AdminBulkActions';
import EmptyState from '../../components/admin/EmptyState';
import DeleteButton from '../../components/admin/DeleteButton';
import Button from '../../components/Button';
import SegmentedControl from '../../components/SegmentedControl';
import { useGallery } from '../../hooks/useApiHooks';
import { useSearch } from '../../context/SearchContext';
import useAdminAction, { useBulkAdminAction } from '../../hooks/useAdminAction';

const POSITION_OPTIONS = ['top', 'left', 'center', 'right', 'bottom'].map((pos) => ({
  value: pos,
  label: pos.charAt(0).toUpperCase() + pos.slice(1),
}));

const VIEWS = [
  { id: 'all', label: 'All photos', icon: ImageIcon, match: () => true },
  { id: 'visible', label: 'On the website', icon: Eye, match: (item) => item.is_visible },
  { id: 'hidden', label: 'Hidden', icon: EyeOff, match: (item) => !item.is_visible },
  { id: 'guests', label: 'From guests', icon: UserCheck, match: (item) => !!item.is_guest_upload },
];

export default function GalleryManager() {
  const { data: fetchedItems, isLoading: loading, refetch: fetchGallery } = useGallery();
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isReordering, setIsReordering] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const { searchQuery } = useSearch();
  const [viewMode, setViewMode] = useState('grid');
  const [view, setView] = useState('all');

  useEffect(() => {
    if (fetchedItems) setItems(fetchedItems);
  }, [fetchedItems]);

  const refresh = () => fetchGallery();
  const remove = useAdminAction((id) => galleryService.delete(id), {
    confirm: 'Delete this image?',
    error: 'Failed to delete image',
    onSuccess: refresh,
  });
  const handleDelete = remove.run;

  const visibility = useAdminAction((item) => galleryService.update(item.id, { is_visible: !item.is_visible }), {
    key: (item) => item.id,
    error: 'Failed to update visibility',
    onSuccess: refresh,
  });
  const toggleVisibility = visibility.run;

  const updatePhoto = useAdminAction(() => galleryService.update(editingItem.id, {
    object_position: editingItem.object_position || 'center',
  }), {
    key: () => 'edit',
    error: 'Failed to update photo',
    onSuccess: () => { setEditingItem(null); refresh(); },
  });
  const handleUpdate = (e) => {
    e.preventDefault();
    updatePhoto.run();
  };

  const addUpload = useAdminAction((url) => galleryService.create({ image_url: url, caption: '', order: -1 }), {
    error: 'Failed to add the uploaded photo',
    onSuccess: (_, __, fileId) => {
      setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
      refresh();
    },
  });

  const handleReorder = (newOrder) => {
    setItems(newOrder);
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const afterBulk = () => { setSelectedIds([]); refresh(); };
  const bulkDelete = useBulkAdminAction((id) => galleryService.delete(id), {
    confirm: (ids) => `Delete ${ids.length} selected photos?`,
    onSuccess: afterBulk,
  });
  const bulkShow = useBulkAdminAction((id) => galleryService.update(id, { is_visible: true }), { onSuccess: afterBulk });
  const bulkHide = useBulkAdminAction((id) => galleryService.update(id, { is_visible: false }), { onSuccess: afterBulk });

  const reorder = useAdminAction(
    () => galleryService.reorder(items.map((item, index) => ({ id: item.id, order: index }))),
    {
      key: () => 'reorder',
      error: 'Failed to save order',
      onSuccess: () => { setIsReordering(false); refresh(); },
    },
  );
  const saveOrder = reorder.run;

  // Search by caption or uploader; reordering always works on the full set.
  const searchLower = (searchQuery || '').trim().toLowerCase();
  const filteredItems = items
    .filter(item => isReordering || (VIEWS.find(v => v.id === view)?.match(item) && (!searchLower
      || [item.caption, item.uploaded_by].some(v => v && String(v).toLowerCase().includes(searchLower)))))
    .sort((a, b) => b.id - a.id);

  // The upload panel only takes space when it's needed: on request, for an
  // empty gallery, while uploading, or when files are dragged onto the page.
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const showUploader = !isReordering && (uploaderOpen || items.length === 0 || uploadingFiles.length > 0);
  useEffect(() => {
    const onDragEnter = (e) => { if (e.dataTransfer?.types?.includes('Files')) setUploaderOpen(true); };
    window.addEventListener('dragenter', onDragEnter);
    return () => window.removeEventListener('dragenter', onDragEnter);
  }, []);

  const toolbarActions = [
    {
      id: 'upload',
      label: 'Upload Photos',
      icon: Upload,
      variant: 'secondary',
      onClick: () => setUploaderOpen(open => !open),
      hidden: isReordering,
    },
    {
      id: 'select-all',
      label: selectedIds.length === items.length ? 'Deselect All' : 'Select All',
      icon: selectedIds.length === items.length ? Check : Plus,
      onClick: () => setSelectedIds(selectedIds.length === items.length ? [] : items.map(i => i.id)),
      hidden: items.length === 0,
    },
    {
      id: 'reorder',
      label: isReordering ? 'Save Order' : 'Reorder',
      icon: ArrowUpDown,
      variant: isReordering ? 'secondary' : 'primary',
      onClick: () => isReordering ? saveOrder() : setIsReordering(!isReordering),
    },
  ];

  return (
    <>
      <AdminPageLayout
        actions={toolbarActions}
        hero={
          <AdminPageHero
            title="Gallery Management"
            description={`${items.length} photos in gallery`}
            breadcrumb="Gallery"
            icon={<ImageIcon className="w-5 h-5 text-[#A67B5B]" />}
          />
        }
        search="Search gallery…"
        filters={{ view: { options: ['grid', 'list'], value: viewMode, onChange: setViewMode } }}
        panel={{
          id: 'gallery',
          title: 'Photos',
          icon: ImageIcon,
          subtitle: isReordering ? 'Reordering shows every photo' : 'Drop photos anywhere on the page to upload',
          items: VIEWS.map(({ match, ...v }) => ({ ...v, count: items.filter(match).length })),
          activeId: isReordering ? 'all' : view,
          onChange: (id) => { if (!isReordering) setView(id); },
        }}
      >
        {/* Multi-Upload Dropzone */}
        {showUploader && (
          <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-dashed border-[#A67B5B]/20 transition-all hover:border-[#A67B5B]/40">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-[#A67B5B]/10 rounded-lg">
                <ImageIcon className="w-5 h-5 text-[#A67B5B]" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-stone-800">Add Gallery Photos</h3>
                <p className="text-xs text-stone-600">Drop images here (or anywhere on the page) to upload them instantly</p>
              </div>
              {items.length > 0 && uploadingFiles.length === 0 && (
                <button type="button" onClick={() => setUploaderOpen(false)} className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100" aria-label="Close upload panel">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <ImageUpload
              allowMultiple={true}
              maxFiles={10}
              showList={false}
              className="filepond-custom hide-filepond-list"
              onFileAdded={(file) => {
                setUploadingFiles(prev => [...prev, {
                  id: file.id,
                  name: file.filename,
                  progress: 0,
                  preview: URL.createObjectURL(file.file)
                }]);
              }}
              onFileProgress={(id, progress) => {
                setUploadingFiles(prev => prev.map(f =>
                  f.id === id ? { ...f, progress } : f
                ));
              }}
              onFileRemoved={(id) => {
                setUploadingFiles(prev => prev.filter(f => f.id !== id));
              }}
              onUpload={(url, id) => addUpload.run(url, id)}
            />
          </div>
        )}

        {editingItem && (
          <Overlay onClose={() => setEditingItem(null)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-medium text-[#4A3F35] mb-4">Edit Photo</h3>
              <div className="mb-4 rounded-lg overflow-hidden h-48 bg-stone-100">
                <img
                  src={getAssetUrl(editingItem.image_url)}
                  alt="Preview"
                  className="w-full h-full object-cover transition-all"
                  style={{ objectPosition: editingItem.object_position || 'center' }}
                />
              </div>
              <form onSubmit={handleUpdate}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-stone-700 mb-2">Photo Position</label>
                  <SegmentedControl
                    aria-label="Photo position"
                    size="sm"
                    fullWidth
                    className="gap-2"
                    options={POSITION_OPTIONS}
                    value={editingItem.object_position || 'center'}
                    onChange={(pos) => setEditingItem({ ...editingItem, object_position: pos })}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button onClick={() => setEditingItem(null)}>Cancel</Button>
                  <Button edit type="submit" variant="secondary">Save Changes</Button>
                </div>
              </form>
            </div>
          </Overlay>
        )}

        {loading ? <EmptyState loading rows={4} /> : viewMode === 'grid' ? (
          <GalleryGrid
            items={filteredItems}
            uploadingFiles={uploadingFiles}
            selectedIds={selectedIds}
            isReordering={isReordering}
            onReorder={handleReorder}
            onToggleSelection={toggleSelection}
            onEdit={setEditingItem}
            onDelete={handleDelete}
            onToggleVisibility={toggleVisibility}
          />
        ) : (
          <GalleryList
            items={filteredItems}
            uploadingFiles={uploadingFiles}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            onEdit={setEditingItem}
            onDelete={handleDelete}
            onToggleVisibility={toggleVisibility}
          />
        )}

        <AdminBulkActions
          selectedCount={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
          actions={[
            { id: 'show', label: 'Show', icon: Eye, variant: 'secondary', action: bulkShow, args: [selectedIds] },
            { id: 'hide', label: 'Hide', icon: EyeOff, variant: 'primary', action: bulkHide, args: [selectedIds] },
            { id: 'delete', label: 'Delete', icon: Trash2, variant: 'danger', action: bulkDelete, args: [selectedIds] },
          ]}
        />
      </AdminPageLayout>
    </>
  );
}

function GalleryGrid({ items, uploadingFiles, selectedIds, isReordering, onReorder, onToggleSelection, onEdit, onDelete, onToggleVisibility }) {
  const renderItem = (item) => (
    <div
      key={item.id}
      className={`group relative aspect-square bg-stone-100 rounded-xl overflow-hidden shadow-sm transition-all cursor-pointer ${selectedIds.includes(item.id) ? 'ring-4 ring-[#A67B5B] ring-offset-2 scale-[0.98]' : ''}`}
      onClick={(e) => {
        if (e.target.closest('button')) return;
        onToggleSelection(item.id);
      }}
    >
      <div className={`absolute top-3 left-3 z-20 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedIds.includes(item.id) ? 'bg-[#A67B5B] border-[#A67B5B]' : 'bg-white/40 border-white/60 opacity-0 group-hover:opacity-100'}`}>
        {selectedIds.includes(item.id) && <Check className="w-3.5 h-3.5 text-white" />}
      </div>
      <img src={getAssetUrl(item.image_url)} alt="Gallery Image" className={`w-full h-full object-cover transition-opacity ${item.is_visible ? 'opacity-100' : 'opacity-50 grayscale'}`} />

      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
        <div className="mb-2">
          {item.is_guest_upload && (
            <span className="inline-block px-2 py-1 bg-white/20 text-white text-xs rounded mb-1 backdrop-blur-sm">
              Guest Upload: {item.uploaded_by}
            </span>
          )}
          <p className="text-white text-sm font-medium truncate">Uploaded by: {item.uploaded_by || 'Anonymous'}</p>
        </div>
        <div className="flex gap-2">
          <Button edit size="sm" icon={ImageIcon} className="flex-1" onClick={() => onEdit(item)}>
            Edit
          </Button>
          <Button edit
            size="icon"
            icon={item.is_visible ? Eye : EyeOff}
            onClick={() => onToggleVisibility(item)}
            title={item.is_visible ? 'Hide' : 'Show'}
            aria-label={item.is_visible ? 'Hide photo' : 'Show photo'}
          />
          <DeleteButton onClick={() => onDelete(item.id)} title="Delete photo" />
        </div>
      </div>

      <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
        {!item.is_visible && (
          <div className="px-2 py-1 bg-black/60 text-white text-xs rounded-full backdrop-blur-sm">
            Hidden
          </div>
        )}
        {item.is_guest_upload && (
          <div className="px-2 py-1 bg-[#A67B5B]/90 text-white text-xs rounded-full backdrop-blur-sm flex items-center gap-1">
            <UserCheck className="w-3 h-3" /> Guest
          </div>
        )}
      </div>
    </div>
  );

  return isReordering ? (
    <Reorder.Group axis="y" values={items} onReorder={onReorder} className="grid grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4 gap-4">
      {items.map(item => (
        <Reorder.Item key={item.id} value={item} className="relative aspect-square bg-stone-100 rounded-xl overflow-hidden shadow-sm cursor-grab active:cursor-grabbing">
          <img src={getAssetUrl(item.image_url)} alt="Gallery Image" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <GripVertical className="w-8 h-8 text-white" />
          </div>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  ) : (
    <div className="grid grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4 gap-4">
      {uploadingFiles.map(file => (
        <div key={file.id} className="aspect-square rounded-xl overflow-hidden shadow-sm upload-placeholder shimmer-bg">
          <img src={file.preview} alt="Uploading..." className="w-full h-full object-cover" />
          <div className="upload-placeholder-overlay">
            <div className="text-white text-[10px] font-bold uppercase tracking-wider mb-1 bg-black/20 px-2 py-0.5 rounded shadow-sm backdrop-blur-md">
              Uploading {Math.round(file.progress * 100)}%
            </div>
            <div className="upload-progress-container">
              <div
                className="upload-progress-bar shadow-[0_0_8px_rgba(166,123,91,0.5)]"
                style={{ width: `${file.progress * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
      {items.map(renderItem)}
      {items.length === 0 && uploadingFiles.length === 0 && (
        <EmptyState icon={ImageIcon} message="No photos in gallery yet" className="col-span-full border-2 border-dashed border-stone-200 rounded-xl" />
      )}
    </div>
  );
}

function GalleryList({ items, uploadingFiles, selectedIds, onToggleSelection, onEdit, onDelete, onToggleVisibility }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-3 bg-stone-50 border-b border-stone-100 text-xs font-semibold text-stone-500 uppercase tracking-wider">
        <div className="w-8"></div>
        <span>Photo</span>
        <span>Status</span>
        <span className="text-right">Actions</span>
      </div>

      <div className="divide-y divide-stone-100">
        {uploadingFiles.map(file => (
          <div key={file.id} className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-4 items-center">
            <div className="w-8"></div>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-stone-100 overflow-hidden">
                <img src={file.preview} alt="Uploading..." className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-700">{file.name}</p>
                <div className="w-32 h-2 bg-stone-100 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-[#A67B5B] rounded-full" style={{ width: `${file.progress * 100}%` }} />
                </div>
              </div>
            </div>
            <span className="text-xs text-stone-500">Uploading...</span>
            <div></div>
          </div>
        ))}

        {items.map(item => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <div
              key={item.id}
              onClick={() => onToggleSelection(item.id)}
              className={`grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-4 items-center transition-colors cursor-pointer ${isSelected ? 'bg-[#A67B5B]/5' : 'hover:bg-stone-50'}`}
            >
              <div className="w-8 flex justify-center">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#A67B5B] border-[#A67B5B]' : 'border-stone-300'}`}>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <img src={getAssetUrl(item.image_url)} alt="Gallery" className="w-16 h-16 rounded-lg object-cover" />
                <div>
                  <p className="text-sm font-medium text-stone-800">Uploaded by: {item.uploaded_by || 'Anonymous'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {item.is_guest_upload && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#A67B5B]/10 text-[#A67B5B]">
                        <UserCheck className="w-3 h-3" /> Guest
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                {item.is_visible ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <Eye className="w-3 h-3" /> Visible
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-600">
                    <EyeOff className="w-3 h-3" /> Hidden
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button edit
                  size="icon"
                  icon={ImageIcon}
                  aria-label="Edit photo position"
                  title="Edit photo position"
                  onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                />
                <Button edit
                  size="icon"
                  icon={item.is_visible ? Eye : EyeOff}
                  aria-label={item.is_visible ? 'Hide photo' : 'Show photo'}
                  title={item.is_visible ? 'Hide' : 'Show'}
                  onClick={(e) => { e.stopPropagation(); onToggleVisibility(item); }}
                />
                <DeleteButton onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} title="Delete photo" />
              </div>
            </div>
          );
        })}

        {items.length === 0 && uploadingFiles.length === 0 && (
          <EmptyState icon={ImageIcon} message="No photos in gallery yet" className="py-12" />
        )}
      </div>
    </div>
  );
}
