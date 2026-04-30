import { useState, useEffect } from 'react';
import { galleryService, getAssetUrl } from '../../services/api';
import { Plus, Trash2, Eye, EyeOff, Image as ImageIcon, UserCheck, ArrowUpDown, GripVertical, Check } from 'lucide-react';
import { Reorder } from 'framer-motion';
import ImageUpload from '../../components/admin/ImageUpload';
import AdminPageHero from '../../components/admin/AdminPageHero';
/* Force refresh: 2026-04-15 06:45 - Critical fix for ReferenceError & HMR recovery */
import { useGallery } from '../../hooks/useApiHooks';
import { useSearch } from '../../context/SearchContext';

export default function GalleryManager() {
  const { data: fetchedItems, isLoading: loading, refetch: fetchGallery } = useGallery();
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isReordering, setIsReordering] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const { searchQuery } = useSearch();

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
        fetchGallery(); // Refresh to ensure backend sync
    } catch (err) {
        alert('Failed to save order');
    }
  };

  const filteredItems = items
    .filter(item => {
      const activeSearch = searchQuery || '';
      return true; // Search by caption removed as captions are gone
    })
    .sort((a, b) => b.id - a.id);

  return (
    <div className="space-y-6">
       <AdminPageHero
            title="Gallery Management"
            description={`${items.length} photos in gallery`}
            breadcrumb={[
                { label: 'Dashboard', path: '/admin/dashboard' },
                { label: 'Gallery' },
            ]}
            icon={<ImageIcon className="w-5 h-5 text-[#A67B5B]" />}
            actions={
                <div className="flex items-center gap-3">
                    {items.length > 0 && (
                        <button 
                            onClick={() => setSelectedIds(selectedIds.length === items.length ? [] : items.map(i => i.id))}
                            className="text-xs font-bold text-[#A67B5B] hover:text-[#8B7B6B] transition-colors"
                        >
                            {selectedIds.length === items.length ? 'Deselect All' : 'Select All'}
                        </button>
                    )}
                    <button 
                        onClick={() => isReordering ? saveOrder() : setIsReordering(!isReordering)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            isReordering 
                                ? 'bg-green-500 text-white hover:bg-green-600' 
                                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                    >
                        {isReordering ? 'Save Order' : <><ArrowUpDown className="w-4 h-4" /> Reorder</>}
                    </button>
                </div>
            }
        />

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
                                       onClick={() => setEditingItem({...editingItem, object_position: pos})}
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

       {loading ? <p>Loading...</p> : (
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {/* Uploading Placeholders */}
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

               {filteredItems.map(item => (
                   <div 
                    key={item.id} 
                    className={`group relative aspect-square bg-stone-100 rounded-xl overflow-hidden shadow-sm transition-all cursor-pointer ${selectedIds.includes(item.id) ? 'ring-4 ring-[#A67B5B] ring-offset-2 scale-[0.98]' : ''}`}
                    onClick={(e) => {
                        if (e.target.closest('button')) return;
                        toggleSelection(item.id);
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
                                    onClick={() => setEditingItem(item)}
                                    className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-sm flex-1 flex items-center justify-center gap-2"
                               >
                                    <ImageIcon className="w-3 h-3" /> <span className="text-xs">Edit</span>
                               </button>
                               <button 
                                    onClick={() => toggleVisibility(item)}
                                    className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-sm"
                                    title={item.is_visible ? 'Hide' : 'Show'}
                               >
                                    {item.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                               </button>
                               <button 
                                    onClick={() => handleDelete(item.id)}
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
               ))}
               {items.length === 0 && !loading && (
                   <div className="col-span-full py-12 text-center text-stone-500 border-2 border-dashed border-stone-200 rounded-xl">
                       <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                       <p>No photos in gallery yet.</p>
                   </div>
               )}
           </div>
       )}

        {/* Bulk Management Bar */}
        {selectedIds.length > 0 && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8">
                <div className="bg-[#4A3F35] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 backdrop-blur-md border border-white/10">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold">{selectedIds.length} Items Selected</span>
                        <button onClick={() => setSelectedIds([])} className="text-[10px] text-white/60 uppercase tracking-widest hover:text-white text-left">Deselect All</button>
                    </div>
                    
                    <div className="h-8 w-px bg-white/10" />
                    
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => handleBulkVisibility(true)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex flex-col items-center gap-1"
                            title="Show Selected"
                        >
                            <Eye className="w-5 h-5" />
                            <span className="text-[9px] uppercase font-bold tracking-tighter">Show</span>
                        </button>
                        <button 
                            onClick={() => handleBulkVisibility(false)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex flex-col items-center gap-1"
                            title="Hide Selected"
                        >
                            <EyeOff className="w-5 h-5" />
                            <span className="text-[9px] uppercase font-bold tracking-tighter">Hide</span>
                        </button>
                        <button 
                            onClick={handleBulkDelete}
                            className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors flex flex-col items-center gap-1"
                            title="Delete Selected"
                        >
                            <Trash2 className="w-5 h-5" />
                            <span className="text-[9px] uppercase font-bold tracking-tighter">Delete</span>
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
