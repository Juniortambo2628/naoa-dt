import { useState, useEffect } from 'react';
import { galleryService, getAssetUrl } from '../../services/api';
import { Plus, Trash2, Eye, EyeOff, Image as ImageIcon, UserCheck, ArrowUpDown, GripVertical, Check } from 'lucide-react';
import { Reorder } from 'framer-motion';
import ImageUpload from '../../components/admin/ImageUpload';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminToolbar from '../../components/admin/AdminToolbar';
import AdminFloatingToolbar from '../../components/admin/AdminFloatingToolbar';
import AdminBulkActions from '../../components/admin/AdminBulkActions';
import EmptyState from '../../components/admin/EmptyState';
import { useGallery } from '../../hooks/useApiHooks';
import { useSearch } from '../../context/SearchContext';

export default function GalleryManager() {
  const { data: fetchedItems, isLoading: loading, refetch: fetchGallery } = useGallery();
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isReordering, setIsReordering] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const { searchQuery, setSearchQuery } = useSearch();
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    if (fetchedItems) setItems(fetchedItems);
  }, [fetchedItems]);

  const handleDelete = async (id) => {
    if (confirm('Delete this image?')) {
      await galleryService.delete(id);
      fetchGallery();
    }
  };

  const toggleVisibility = async (item) => {
    try {
      await galleryService.update(item.id, { is_visible: !item.is_visible });
      fetchGallery();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await galleryService.update(editingItem.id, {
        object_position: editingItem.object_position || 'center'
      });
      setEditingItem(null);
      fetchGallery();
    } catch (err) {
      alert('Failed to update photo');
    }
  };

  const handleReorder = (newOrder) => {
    setItems(newOrder);
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (confirm(`Delete ${selectedIds.length} selected photos?`)) {
      await Promise.all(selectedIds.map(id => galleryService.delete(id)));
      setSelectedIds([]);
      fetchGallery();
    }
  };

  const handleBulkVisibility = async (visible) => {
    await Promise.all(selectedIds.map(id =>
      galleryService.update(id, { is_visible: visible })
    ));
    setSelectedIds([]);
    fetchGallery();
  };

  const saveOrder = async () => {
    try {
      const reorderedItems = items.map((item, index) => ({
        id: item.id,
        order: index
      }));
      await galleryService.reorder(reorderedItems);
      setIsReordering(false);
      fetchGallery();
    } catch (err) {
      alert('Failed to save order');
    }
  };

  const filteredItems = items
    .filter(() => true)
    .sort((a, b) => b.id - a.id);

  const toolbarActions = [
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
      variant: isReordering ? 'primary' : 'secondary',
      onClick: () => isReordering ? saveOrder() : setIsReordering(!isReordering),
    },
  ];

  return (
    <>
      <AdminPageLayout
        hero={
          <AdminPageHero
            title="Gallery Management"
            description={`${items.length} photos in gallery`}
            breadcrumb="Gallery"
            icon={<ImageIcon className="w-5 h-5 text-[#A67B5B]" />}
          />
        }
        toolbar={
          <AdminToolbar
            search={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search gallery..."
            viewMode={viewMode}
            viewOptions={['grid', 'list']}
            onViewModeChange={setViewMode}
          />
        }
      >
        {/* Multi-Upload Dropzone */}
        {!isReordering && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-dashed border-[#A67B5B]/20 transition-all hover:border-[#A67B5B]/40">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 bg-[#A67B5B]/10 rounded-lg">
                <ImageIcon className="w-5 h-5 text-[#A67B5B]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-800">Add Gallery Photos</h3>
                <p className="text-xs text-stone-500">Drag and drop multiple images to upload them instantly</p>
              </div>
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
              onUpload={async (url, id) => {
                try {
                  await galleryService.create({ image_url: url, caption: '', order: -1 });
                  setUploadingFiles(prev => prev.filter(f => f.id !== id));
                  fetchGallery();
                } catch (err) {
                  console.error('Auto-upload error:', err);
                }
              }}
            />
          </div>
        )}

        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setEditingItem(null)}>
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
                  <div className="grid grid-cols-5 gap-2">
                    {['top', 'left', 'center', 'right', 'bottom'].map(pos => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, object_position: pos })}
                        className={`p-2 text-xs rounded-lg border transition-all capitalize ${
                          (editingItem.object_position || 'center') === pos
                            ? 'border-[#A67B5B] bg-[#A67B5B]/10 text-[#A67B5B]'
                            : 'border-stone-200 hover:border-stone-300 text-stone-600'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setEditingItem(null)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? <p>Loading...</p> : viewMode === 'grid' ? (
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
            { id: 'show', label: 'Show', icon: Eye, variant: 'primary', onClick: () => handleBulkVisibility(true) },
            { id: 'hide', label: 'Hide', icon: EyeOff, variant: 'secondary', onClick: () => handleBulkVisibility(false) },
            { id: 'delete', label: 'Delete', icon: Trash2, variant: 'danger', onClick: handleBulkDelete },
          ]}
        />
      </AdminPageLayout>
      <AdminFloatingToolbar actions={toolbarActions} />
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
          <button
            onClick={() => onEdit(item)}
            className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-sm flex-1 flex items-center justify-center gap-2"
          >
            <ImageIcon className="w-3 h-3" /> <span className="text-xs">Edit</span>
          </button>
          <button
            onClick={() => onToggleVisibility(item)}
            className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-sm"
            title={item.is_visible ? 'Hide' : 'Show'}
          >
            {item.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg backdrop-blur-sm"
          >
            <Trash2 className="w-4 h-4" />
          </button>
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
    <Reorder.Group axis="y" values={items} onReorder={onReorder} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                  className="p-2 rounded-lg text-stone-400 hover:text-[#A67B5B] hover:bg-stone-100 transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleVisibility(item); }}
                  className="p-2 rounded-lg text-stone-400 hover:text-[#A67B5B] hover:bg-stone-100 transition-colors"
                >
                  {item.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                  className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
