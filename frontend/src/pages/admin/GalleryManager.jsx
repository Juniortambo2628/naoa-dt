import { useState, useEffect } from 'react';
import { galleryService } from '../../services/api';
import { Plus, Trash2, Eye, EyeOff, Image as ImageIcon, UserCheck, ArrowUpDown, GripVertical } from 'lucide-react';
import { Reorder } from 'framer-motion';
import ImageUpload from '../../components/admin/ImageUpload';
import AdminPageHero from '../../components/admin/AdminPageHero';
import { useGallery } from '../../hooks/useApiHooks';

export default function GalleryManager() {
  const { data: fetchedItems, isLoading: loading, refetch: fetchGallery } = useGallery();
  const [items, setItems] = useState([]);
  const [newUrls, setNewUrls] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    if (fetchedItems) setItems(fetchedItems);
  }, [fetchedItems]);

  const handleBulkAdd = async (e) => {
      e.preventDefault();
      try {
          // Create an item for each uploaded URL
          await Promise.all(newUrls.map(url => 
            galleryService.create({ image_url: url, caption: '' })
          ));
          setNewUrls([]);
          setIsAdding(false);
          fetchGallery();
      } catch (err) {
          alert('Failed to add images');
      }
  };

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
              caption: editingItem.caption,
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

  return (
    <div className="space-y-6">
       <AdminPageHero
            title="Gallery Management"
            breadcrumb={[
                { label: 'Dashboard', path: '/admin/dashboard' },
                { label: 'Gallery' },
            ]}
            icon={<ImageIcon className="w-5 h-5 text-[#A67B5B]" />}
            actions={
                <>
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
                    {!isReordering && (
                        <button 
                            onClick={() => setIsAdding(!isAdding)}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> Add photos
                        </button>
                    )}
                </>
            }
       />

       {isAdding && (
           <form onSubmit={handleBulkAdd} className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 space-y-4 animate-in fade-in slide-in-from-top-4">
               <div>
                   <label className="block text-sm font-medium text-stone-700 mb-2">Upload Photos</label>
                   <ImageUpload 
                        allowMultiple={true}
                        maxFiles={10}
                        onUpload={(url) => setNewUrls(prev => [...prev, url])}
                   />
                   <p className="text-xs text-stone-500 mt-2">
                       {newUrls.length} photos ready to add. Captions can be added after uploading.
                   </p>
               </div>
               
               <div className="flex items-center gap-2 pt-4 border-t border-stone-50">
                   <button type="button" onClick={() => { setIsAdding(false); setNewUrls([]); }} className="px-4 py-2 text-stone-500 hover:bg-stone-50 rounded-lg">Cancel</button>
                   <button type="submit" disabled={newUrls.length === 0} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                        <Plus className="w-4 h-4 mr-2" />
                        Add {newUrls.length > 0 ? `${newUrls.length} Photos` : 'Photos'}
                   </button>
               </div>
           </form>
       )}

       {editingItem && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setEditingItem(null)}>
               <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
                   <h3 className="text-lg font-medium text-[#4A3F35] mb-4">Edit Photo</h3>
                   <div className="mb-4 rounded-lg overflow-hidden h-48 bg-stone-100">
                       <img 
                           src={editingItem.image_url} 
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
                       <div className="mb-4">
                           <label className="block text-sm font-medium text-stone-700 mb-2">Caption</label>
                           <textarea
                                className="w-full p-3 border border-stone-200 rounded-lg text-sm h-24 resize-none focus:ring-2 focus:ring-[#A67B5B]/20 outline-none"
                                placeholder="Add a caption..."
                                value={editingItem.caption || ''}
                                onChange={e => setEditingItem({...editingItem, caption: e.target.value})}
                           />
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
               {items.map(item => (
                   <div key={item.id} className="group relative aspect-square bg-stone-100 rounded-xl overflow-hidden shadow-sm">
                       <img src={item.image_url} alt={item.caption} className={`w-full h-full object-cover transition-opacity ${item.is_visible ? 'opacity-100' : 'opacity-50 grayscale'}`} />
                       
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                           <div className="mb-2">
                               {item.is_guest_upload && (
                                   <span className="inline-block px-2 py-1 bg-white/20 text-white text-xs rounded mb-1 backdrop-blur-sm">
                                       Guest Upload: {item.uploaded_by}
                                   </span>
                               )}
                               <p className="text-white text-sm font-medium truncate">{item.caption || 'No caption'}</p>
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
    </div>
  );
}
