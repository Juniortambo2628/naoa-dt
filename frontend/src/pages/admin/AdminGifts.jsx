import { useState, useEffect } from 'react';
import { Gift, Plus, Edit, Save, X, DollarSign, ExternalLink, LayoutGrid, List, CheckCircle, Trash2, ShoppingBag, Heart, ArrowUpRight } from 'lucide-react';
import { useGifts } from '../../hooks/useApiHooks';
import { giftService, getAssetUrl } from '../../services/api';
import ImageUpload from '../../components/admin/ImageUpload';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminToolbar from '../../components/admin/AdminToolbar';
import AdminFloatingToolbar from '../../components/admin/AdminFloatingToolbar';
import AdminModal from '../../components/admin/AdminModal';
import EmptyState from '../../components/admin/EmptyState';
import AdminSummaryCards from '../../components/admin/AdminSummaryCards';
import AdminBulkActions from '../../components/admin/AdminBulkActions';
import { useSearch } from '../../context/SearchContext';
import useCrudHandlers from '../../hooks/useCrudHandlers';
import useFilteredItems from '../../hooks/useFilteredItems';
import { AdminInput, AdminTextarea } from '../../components/admin/AdminInput';
import SubmitButton from '../../components/admin/SubmitButton';
import Spinner from '../../components/admin/Spinner';
import { toast } from 'react-hot-toast';

export default function AdminGifts() {
  const { data: gifts = [], isLoading: loading, refetch } = useGifts();
  const { searchQuery, setSearchQuery } = useSearch();
  const { selectedItem, modalOpen, setModalOpen, handleAdd, handleEdit, handleDelete, handleSave } = useCrudHandlers({
    service: giftService,
    onRefresh: refetch,
  });

  const [viewMode, setViewMode] = useState('grid');
  const [selectedIds, setSelectedIds] = useState([]);

  const filteredGifts = useFilteredItems(gifts, searchQuery, (gift, searchLower) =>
    gift.name.toLowerCase().includes(searchLower) ||
    (gift.description && gift.description.toLowerCase().includes(searchLower))
  );

  const stats = {
    total: gifts.length,
    available: gifts.filter(g => g.is_available).length,
    reserved: gifts.filter(g => !g.is_available && !g.is_cash_fund).length,
    cashFunds: gifts.filter(g => g.is_cash_fund).length,
  };

  const statCards = [
    { label: 'Total Gifts', value: stats.total, icon: Gift, color: '#A67B5B' },
    { label: 'Available', value: stats.available, icon: CheckCircle, color: '#8B9A7D' },
    { label: 'Reserved', value: stats.reserved, icon: Heart, color: '#D4A59A' },
    { label: 'Cash Funds', value: stats.cashFunds, icon: DollarSign, color: '#C8A68E' },
  ];

  const toggleSelection = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredGifts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredGifts.map(g => g.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} selected gifts?`)) return;
    try {
      await Promise.all(selectedIds.map(id => giftService.delete(id)));
      toast.success(`${selectedIds.length} gifts deleted`);
      setSelectedIds([]);
      refetch();
    } catch (err) {
      toast.error('Failed to delete some gifts');
    }
  };

  const handleBulkToggleAvailability = async () => {
    try {
      await Promise.all(selectedIds.map(id => {
        const gift = gifts.find(g => g.id === id);
        return giftService.update(id, { is_available: !gift.is_available });
      }));
      toast.success('Availability updated');
      setSelectedIds([]);
      refetch();
    } catch (err) {
      toast.error('Failed to update availability');
    }
  };

  const bulkActions = [
    { id: 'toggle', label: 'Toggle Available', icon: CheckCircle, variant: 'primary', onClick: handleBulkToggleAvailability },
    { id: 'delete', label: 'Delete', icon: Trash2, variant: 'danger', onClick: handleBulkDelete },
  ];

  return (
    <>
      <AdminPageLayout
        hero={
          <AdminPageHero
            title="Gift Registry"
            description={`${gifts.length} total gifts · ${stats.reserved} reserved`}
            breadcrumb="Gifts"
            icon={<Gift className="w-5 h-5 text-[#A67B5B]" />}
          />
        }
        summary={<AdminSummaryCards cards={statCards} columns={4} />}
        toolbar={
          <AdminToolbar
            search={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search gifts..."
            viewMode={viewMode}
            viewOptions={['grid', 'list']}
            onViewModeChange={setViewMode}
          />
        }
      >
        <AdminBulkActions
          selectedCount={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
          actions={bulkActions}
        />

        {loading ? (
          <EmptyState loading />
        ) : filteredGifts.length === 0 ? (
          <EmptyState icon={Gift} message="No matching gifts found" searchQuery={searchQuery} />
        ) : viewMode === 'grid' ? (
          <GiftGrid
            gifts={filteredGifts}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelection}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <GiftList
            gifts={filteredGifts}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelection}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        <GiftModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          gift={selectedItem}
        />
      </AdminPageLayout>
      <AdminFloatingToolbar
        actions={[
          {
            id: 'add-gift',
            label: 'Add Gift',
            icon: Plus,
            variant: 'primary',
            onClick: handleAdd,
          },
        ]}
      />
    </>
  );
}

function GiftGrid({ gifts, selectedIds, onToggleSelect, onEdit, onDelete }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {gifts.map((gift) => {
        const isSelected = selectedIds.includes(gift.id);
        const isReserved = !gift.is_available;
        const progress = gift.is_cash_fund && gift.price
          ? Math.min(100, ((gift.contributed_amount || 0) / gift.price) * 100)
          : 0;

        return (
          <div
            key={gift.id}
            onClick={() => onToggleSelect(gift.id)}
            className={`group relative rounded-2xl overflow-hidden bg-white border transition-all cursor-pointer ${
              isSelected
                ? 'border-[#A67B5B] ring-2 ring-[#A67B5B]/20 shadow-md'
                : 'border-stone-100 shadow-sm hover:shadow-lg hover:-translate-y-1'
            }`}
          >
            {/* Image */}
            <div className="h-52 overflow-hidden relative">
              <img
                src={getAssetUrl(gift.image_url || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80')}
                alt={gift.name}
                className={`w-full h-full object-cover transition-transform duration-500 ${isReserved ? 'grayscale-[0.3]' : 'group-hover:scale-110'}`}
              />
              {gift.is_cash_fund && (
                <div className="absolute top-3 right-3 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-sm">
                  <DollarSign className="w-3 h-3" /> Cash Fund
                </div>
              )}
              {isReserved && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="bg-white/95 px-4 py-2 rounded-full font-medium text-stone-800 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500 fill-red-500" /> Reserved
                  </span>
                </div>
              )}

              {/* Selection checkbox */}
              <div className="absolute top-3 left-3">
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-[#A67B5B] border-[#A67B5B]' : 'bg-white/80 border-white'
                }`}>
                  {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-base font-semibold text-[#4A3F35] line-clamp-1">{gift.name}</h3>
                {gift.product_link && (
                  <a
                    href={gift.product_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-stone-400 hover:text-[#A67B5B] flex-shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              <p className="text-sm text-[#8B7B6B] mb-4 line-clamp-2 min-h-[2.5rem]">
                {gift.description || 'No description provided.'}
              </p>

              {gift.is_cash_fund && gift.price ? (
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-stone-500">Contributed</span>
                    <span className="font-medium text-[#4A3F35]">${Number(gift.contributed_amount || 0).toLocaleString()} / ${Number(gift.price).toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#8B9A7D] rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm font-medium text-[#A67B5B] mb-4">
                  {gift.price ? `$${Number(gift.price).toLocaleString()}` : 'Any Amount'}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(gift); }}
                  className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(gift.id); }}
                  className="flex-1 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm py-2 flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GiftList({ gifts, selectedIds, onToggleSelect, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-stone-50 border-b border-stone-100 text-xs font-semibold text-stone-500 uppercase tracking-wider">
        <div className="w-8"></div>
        <span>Gift</span>
        <span>Price / Goal</span>
        <span>Status</span>
        <span className="text-right">Actions</span>
      </div>

      <div className="divide-y divide-stone-100">
        {gifts.map((gift) => {
          const isSelected = selectedIds.includes(gift.id);
          const isReserved = !gift.is_available;

          return (
            <div
              key={gift.id}
              onClick={() => onToggleSelect(gift.id)}
              className={`grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 px-5 py-4 items-center transition-colors cursor-pointer ${
                isSelected ? 'bg-[#A67B5B]/5' : 'hover:bg-stone-50'
              }`}
            >
              <div className="w-8 flex justify-center">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-[#A67B5B] border-[#A67B5B]' : 'border-stone-300'
                }`}>
                  {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                </div>
              </div>

              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={getAssetUrl(gift.image_url || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=100&q=80')}
                  alt={gift.name}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#4A3F35] truncate">{gift.name}</p>
                  <p className="text-xs text-stone-500 truncate">{gift.is_cash_fund ? 'Cash Fund' : (gift.description || 'No description')}</p>
                </div>
              </div>

              <div className="text-sm text-[#4A3F35]">
                {gift.is_cash_fund
                  ? `$${Number(gift.contributed_amount || 0).toLocaleString()} / ${gift.price ? `$${Number(gift.price).toLocaleString()}` : 'Any Amount'}`
                  : (gift.price ? `$${Number(gift.price).toLocaleString()}` : 'Any Amount')}
              </div>

              <div>
                {isReserved ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    <Heart className="w-3 h-3" /> Reserved
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3" /> Available
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(gift); }}
                  className="p-2 rounded-lg text-stone-400 hover:text-[#A67B5B] hover:bg-stone-100 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(gift.id); }}
                  className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
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
      setFormData({
        name: '',
        price: '',
        image_url: '',
        product_link: '',
        is_cash_fund: false,
        description: ''
      });
    }
  }, [gift, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (e) { console.error(e); alert('Error saving gift'); }
    setLoading(false);
  };

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title={gift ? 'Edit Gift' : 'Add Gift'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AdminInput label="Gift Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        <AdminInput label="Price / Goal Amount" type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
        <AdminInput label="Product Link (Optional)" type="url" value={formData.product_link} onChange={e => setFormData({...formData, product_link: e.target.value})} placeholder="https://..." />
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">Gift Image</label>
          <ImageUpload
            currentImage={formData.image_url}
            onUpload={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
          />
        </div>
        <div className="flex items-center gap-2 py-2">
          <input type="checkbox" id="cashFund" className="w-4 h-4 text-[#A67B5B]" checked={formData.is_cash_fund} onChange={e => setFormData({...formData, is_cash_fund: e.target.checked})} />
          <label htmlFor="cashFund" className="text-sm font-medium text-stone-700">This is a Cash Fund</label>
        </div>
        <AdminTextarea label="Description (Optional)" rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        <SubmitButton loading={loading} icon={<Save className="w-4 h-4" />} label="Save Gift" />
      </form>
    </AdminModal>
  );
}
