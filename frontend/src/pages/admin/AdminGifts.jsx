import { useState, useEffect } from 'react';
import { Gift, Plus, Trash2, Edit, Save, X, Loader2, DollarSign, ExternalLink } from 'lucide-react';
import { giftService } from '../../services/api';
import ImageUpload from '../../components/admin/ImageUpload';
import AdminPageHero from '../../components/admin/AdminPageHero';

export default function AdminGifts() {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState(null);

  const fetchGifts = async () => {
    try {
      const response = await giftService.getAll();
      setGifts(response.data || []);
    } catch (err) {
      console.error("Error fetching gifts:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGifts();
  }, []);

  const handleAdd = () => {
    setSelectedGift(null);
    setModalOpen(true);
  };

  const handleEdit = (gift) => {
    setSelectedGift(gift);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this gift?')) {
      try {
        await giftService.delete(id);
        fetchGifts();
      } catch (e) {
        console.error(e);
        alert('Failed to delete gift');
      }
    }
  };

  const handleSave = async (data) => {
    if (selectedGift) {
        await giftService.update(selectedGift.id, data);
    } else {
        await giftService.create(data);
    }
    fetchGifts();
  };

  return (
    <div className="space-y-6">
      <AdminPageHero
        title="Gift Registry"
        breadcrumb={[
          { label: 'Dashboard', path: '/admin/dashboard' },
          { label: 'Gifts' },
        ]}
        icon={<Gift className="w-5 h-5 text-[#A67B5B]" />}
        actions={
          <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add Gift
          </button>
        }
      />

      {loading ? (
        <p>Loading...</p>
      ) : gifts.length === 0 ? (
        <p className="text-center py-12 text-stone-500">No gifts in the registry yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {gifts.map((gift) => (
            <div 
              key={gift.id}
              className="rounded-2xl overflow-hidden bg-white shadow-sm border border-stone-100 group"
            >
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={gift.image_url || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80'} 
                  alt={gift.name} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                {gift.is_cash_fund && (
                  <div className="absolute top-2 right-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Cash Fund
                  </div>
                )}
                {!gift.is_available && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-white px-4 py-2 rounded-full font-medium text-stone-800">Reserved</span>
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-lg font-medium mb-1 text-[#4A3F35] flex justify-between items-start">
                    {gift.name}
                    {gift.product_link && (
                        <a href={gift.product_link} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-[#A67B5B]">
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    )}
                </h3>
                <p className="text-sm mb-4 text-[#8B7B6B]">
                  {gift.is_cash_fund ? 'Contribution' : (gift.price ? `$${Number(gift.price).toLocaleString()}` : 'Any Amount')}
                </p>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(gift)} className="flex-1 btn-secondary text-sm py-2">Edit</button>
                  <button onClick={() => handleDelete(gift.id)} className="flex-1 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm py-2">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <GiftModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        gift={selectedGift}
      />
    </div>
  );
}

function GiftModal({ isOpen, onClose, onSave, gift }) {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        image_url: '',
        product_link: '',
        is_cash_fund: false,
        description: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (gift) {
            setFormData({
                name: gift.name || '',
                price: gift.price || '',
                image_url: gift.image_url || '',
                product_link: gift.product_link || '',
                is_cash_fund: !!gift.is_cash_fund,
                description: gift.description || ''
            });
        } else {
            setFormData({ name: '', price: '', image_url: '', product_link: '', is_cash_fund: false, description: '' });
        }
    }, [gift, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch(e) { console.error(e); alert('Error saving gift'); }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-medium text-[#4A3F35]">{gift ? 'Edit Gift' : 'Add Gift'}</h2>
                    <button onClick={onClose}><X className="w-5 h-5 text-stone-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Gift Name</label>
                        <input required className="input-field w-full p-2 border rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Price / Goal Amount</label>
                        <input type="number" step="0.01" className="input-field w-full p-2 border rounded-lg" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Product Link (Optional)</label>
                        <input type="url" className="input-field w-full p-2 border rounded-lg text-sm" value={formData.product_link} onChange={e => setFormData({...formData, product_link: e.target.value})} placeholder="https://..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Gift Image</label>
                        <ImageUpload 
                            currentImage={formData.image_url}
                            onUpload={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                        />
                    </div>
                    <div className="flex items-center gap-2 py-2">
                        <input type="checkbox" id="cashFund" className="w-4 h-4 text-[#A67B5B]" checked={formData.is_cash_fund} onChange={e => setFormData({...formData, is_cash_fund: e.target.checked})} />
                        <label htmlFor="cashFund" className="text-sm font-medium text-stone-700">This is a Cash Fund</label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Description (Optional)</label>
                        <textarea className="input-field w-full p-2 border rounded-lg" rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                    </div>
                    <div className="flex justify-end pt-4">
                         <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center items-center gap-2">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Gift
                         </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
