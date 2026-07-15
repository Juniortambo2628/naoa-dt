import React, { useState, useEffect, useRef } from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { Plus, Edit, Trash2, Save, HelpCircle, GripVertical, Image as ImageIcon, Table as TableIcon, CheckCircle } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import TableInsertModal from '../../components/admin/TableInsertModal';
import 'react-quill-new/dist/quill.snow.css'; // ES6
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import { useFAQs } from '../../hooks/useApiHooks';
import { faqService, contentService } from '../../services/api';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminToolbar from '../../components/admin/AdminToolbar';
import AdminFloatingToolbar from '../../components/admin/AdminFloatingToolbar';
import AdminModal from '../../components/admin/AdminModal';
import EmptyState from '../../components/admin/EmptyState';
import AdminCard from '../../components/admin/AdminCard';
import AdminBulkActions from '../../components/admin/AdminBulkActions';
import { useSearch } from '../../context/SearchContext';
import useFilteredItems from '../../hooks/useFilteredItems';
import useCrudHandlers from '../../hooks/useCrudHandlers';
import { toast } from 'react-hot-toast';

registerPlugin(FilePondPluginImagePreview);

function FaqReorderItem({ faq, searchQuery, isSelected, onToggleSelect, onEdit, onDelete }) {
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            value={faq}
            dragListener={false}
            dragControls={dragControls}
            className={`p-4 flex gap-4 items-start hover:bg-stone-50 transition-colors shadow-sm relative group ${isSelected ? 'bg-[#A67B5B]/5' : 'bg-white'}`}
        >
            <div
                className={`mt-1 text-stone-300 hover:text-stone-500 ${searchQuery ? 'opacity-20 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                onPointerDown={(e) => { if (!searchQuery) dragControls.start(e); }}
            >
                <GripVertical className="w-5 h-5" />
            </div>
            <div
                className="w-5 h-5 mt-1.5 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors"
                onClick={(e) => { e.stopPropagation(); onToggleSelect(faq.id); }}
            >
                {isSelected && <CheckCircle className="w-3.5 h-3.5 text-[#A67B5B]" />}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-medium text-stone-800 text-lg mb-2">{faq.question}</h3>
                <div
                    className="faq-answer-prose text-stone-600 prose prose-sm max-w-none max-h-24 overflow-hidden relative"
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-stone-50 to-transparent pointer-events-none"></div>
            </div>
            <div className="flex gap-2 shrink-0">
                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onEdit(faq); }}
                    className="p-2 text-[#A67B5B] bg-[#A67B5B]/10 rounded-lg hover:bg-[#A67B5B]/20 transition-colors"
                >
                    <Edit className="w-4 h-4" />
                </button>
                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onDelete(faq.id); }}
                    className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </Reorder.Item>
    );
}

function FaqGridCard({ faq, isSelected, onToggleSelect, onEdit, onDelete }) {
    return (
        <div
            onClick={() => onToggleSelect(faq.id)}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                    ? 'border-[#A67B5B] ring-2 ring-[#A67B5B]/20 bg-[#A67B5B]/5'
                    : 'border-stone-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5'
            }`}
        >
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#A67B5B] border-[#A67B5B]' : 'border-stone-300'}`}>
                        {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <h3 className="font-medium text-stone-800 line-clamp-1">{faq.question}</h3>
                </div>
            </div>
            <div
                className="faq-answer-prose text-stone-600 prose prose-sm max-w-none max-h-32 overflow-hidden relative mb-4"
                dangerouslySetInnerHTML={{ __html: faq.answer }}
            />
            <div className="flex gap-2">
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(faq); }}
                    className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-1.5"
                >
                    <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(faq.id); }}
                    className="flex-1 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl text-sm py-2 flex items-center justify-center gap-1.5"
                >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
            </div>
        </div>
    );
}

export default function AdminFAQ() {
    const { data: faqs = [], isLoading: loading, refetch } = useFAQs();
    const { searchQuery, setSearchQuery } = useSearch();
    const quillRef = useRef(null);
    const [reorderableFaqs, setReorderableFaqs] = useState([]);
    const [order, setOrder] = useState(0);
    const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
    const [tableModalOpen, setTableModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('list');
    const [selectedIds, setSelectedIds] = useState([]);

    const toggleSelection = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Delete ${selectedIds.length} selected FAQs?`)) return;
        try {
            await Promise.all(selectedIds.map(id => faqService.delete(id)));
            toast.success(`${selectedIds.length} FAQs deleted`);
            setSelectedIds([]);
            refetch();
        } catch (err) {
            toast.error('Failed to delete some FAQs');
        }
    };

    // Form state
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');

    const {
        selectedItem: selectedFaq,
        modalOpen,
        setModalOpen,
        handleAdd,
        handleEdit,
        handleDelete,
    } = useCrudHandlers({
        service: faqService,
        onRefresh: refetch,
    });

    // Sync local reorderable list with server data
    useEffect(() => {
        setReorderableFaqs(faqs);
    }, [faqs]);

    useEffect(() => {
        if (selectedFaq) {
            setQuestion(selectedFaq.question || '');
            setAnswer(selectedFaq.answer || '');
            setOrder(selectedFaq.order || 0);
        } else {
            setQuestion('');
            setAnswer('');
            setOrder(0);
        }
    }, [selectedFaq, modalOpen]);

    const handleEditFaq = (faq) => {
        setAnswer(faq.answer);
        setUploadedFileUrl(null);
        handleEdit(faq);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (selectedFaq) {
                await faqService.update(selectedFaq.id, { question, answer, order: selectedFaq.order });
            } else {
                await faqService.create({ question, answer });
            }
            setModalOpen(false);
        } catch (err) {
            console.error(err);
            alert("Failed to save FAQ.");
        }
    };

    const handleReorder = async (newOrder) => {
        if (searchQuery) return; // Prevent reorder while search is active
        setReorderableFaqs(newOrder);
        const updatedFaqs = newOrder.map((item, index) => ({ id: item.id, order: index }));
        try {
            await faqService.reorder(updatedFaqs);
        } catch (error) {
            console.error("Failed to update order", error);
        }
    };

    const filteredFaqs = useFilteredItems(reorderableFaqs, searchQuery, (faq, searchLower) =>
        faq.question.toLowerCase().includes(searchLower) || 
        faq.answer.toLowerCase().includes(searchLower)
    );

    const insertImageToQuill = () => {
        if (!uploadedFileUrl || !quillRef.current) return;
        
        const editor = quillRef.current.getEditor();
        const range = editor.getSelection(true); // Get cursor position
        editor.insertEmbed(range.index, 'image', uploadedFileUrl);
        editor.setSelection(range.index + 1); // Move cursor right after the image
        setUploadedFileUrl(null); // Reset after dropping
    };

    const handleInsertTable = (tableHtml) => {
        if (!quillRef.current) return;
        const editor = quillRef.current.getEditor();
        const range = editor.getSelection(true);
        editor.clipboard.dangerouslyPasteHTML(range.index, tableHtml);
        editor.setSelection(range.index + 1);
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': ['#000000', '#ffffff', '#4A3F35', '#A67B5B', '#8B6A4D', '#7D8B9A', '#8B9A7D', '#D4A59A', '#F8E8E0', '#6B5E53', '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff'] }, { 'background': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link', 'clean']
        ],
    };

    return (
        <>
            <AdminPageLayout
                hero={
                    <AdminPageHero
                        title="FAQ Management"
                        description={`${faqs.length} questions in database`}
                        breadcrumb="FAQs"
                        icon={<HelpCircle className="w-5 h-5 text-[#A67B5B]" />}
                    />
                }
                toolbar={
                    <AdminToolbar
                        search={searchQuery}
                        onSearchChange={setSearchQuery}
                        searchPlaceholder="Search FAQs..."
                        viewMode={viewMode}
                        viewOptions={['list', 'grid']}
                        onViewModeChange={setViewMode}
                    />
                }
            >
                <AdminBulkActions
                    selectedCount={selectedIds.length}
                    onClearSelection={() => setSelectedIds([])}
                    actions={[
                        { id: 'delete', label: 'Delete Selected', icon: Trash2, variant: 'danger', onClick: handleBulkDelete },
                    ]}
                />

                <AdminCard padding={false} className="overflow-hidden">
                    {loading ? (
                        <EmptyState loading />
                    ) : filteredFaqs.length === 0 ? (
                        <EmptyState icon={HelpCircle} message={searchQuery ? 'No matching FAQs found' : 'No FAQs added yet'} searchQuery={searchQuery} />
                    ) : viewMode === 'list' ? (
                        <Reorder.Group axis="y" values={filteredFaqs} onReorder={handleReorder} className="divide-y divide-stone-100">
                            {filteredFaqs.map((faq) => (
                                <FaqReorderItem
                                    key={faq.id}
                                    faq={faq}
                                    searchQuery={searchQuery}
                                    isSelected={selectedIds.includes(faq.id)}
                                    onToggleSelect={toggleSelection}
                                    onEdit={handleEditFaq}
                                    onDelete={(id) => handleDelete(id, { confirmMessage: 'Are you sure you want to delete this FAQ?' })}
                                />
                            ))}
                        </Reorder.Group>
                    ) : (
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredFaqs.map((faq) => (
                                <FaqGridCard
                                    key={faq.id}
                                    faq={faq}
                                    isSelected={selectedIds.includes(faq.id)}
                                    onToggleSelect={toggleSelection}
                                    onEdit={handleEditFaq}
                                    onDelete={(id) => handleDelete(id, { confirmMessage: 'Are you sure you want to delete this FAQ?' })}
                                />
                            ))}
                        </div>
                    )}
                </AdminCard>

                <AdminModal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedFaq ? 'Edit FAQ' : 'Add New FAQ'} size="2xl">
                    <form onSubmit={handleSave} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Question</label>
                            <input 
                                type="text" 
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#A67B5B]/20 outline-none"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Answer (Rich Text)</label>
                                <div className="bg-white border rounded-xl overflow-hidden" style={{ minHeight: '300px' }}>
                                    <ReactQuill 
                                        ref={quillRef}
                                        theme="snow" 
                                        value={answer} 
                                        onChange={setAnswer} 
                                        modules={modules}
                                        style={{ height: '250px' }}
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Media Upload</label>
                                    <p className="text-xs text-stone-500 mb-2">Upload images here, then insert them into the answer text.</p>
                                    <div className="bg-stone-50 rounded-xl border border-stone-200 p-2">
                                        <FilePond
                                            server={{
                                                process: async (fieldName, file, metadata, load, error, progress) => {
                                                    const formData = new FormData();
                                                    formData.append('image', file, file.name);
                                                    try {
                                                        const res = await contentService.uploadMedia(formData);
                                                        setUploadedFileUrl(res.data.url);
                                                        load(res.data.url);
                                                    } catch (err) {
                                                        error('Upload failed');
                                                    }
                                                }
                                            }}
                                            allowImagePreview={true}
                                            name="image"
                                            labelIdle='Drag & Drop your files or <span class="filepond--label-action">Browse</span>'
                                            maxFiles={1}
                                        />
                                        
                                        {uploadedFileUrl && (
                                            <button
                                                type="button"
                                                onClick={insertImageToQuill}
                                                className="w-full mt-2 py-2 flex items-center justify-center gap-2 bg-[#8B9A7D] text-white rounded-lg hover:bg-[#78886D] transition-colors shadow-sm text-sm font-medium"
                                            >
                                                <ImageIcon className="w-4 h-4" /> Insert Uploaded Image into Text
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => setTableModalOpen(true)}
                                            className="w-full mt-2 py-2 flex items-center justify-center gap-2 bg-[#7D8B9A] text-white rounded-lg hover:bg-[#6D7888] transition-colors shadow-sm text-sm font-medium"
                                        >
                                            <TableIcon className="w-4 h-4" /> Add Table to Answer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                            <button type="button" onClick={() => setModalOpen(false)} className="px-6 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-medium transition-colors">
                                Cancel
                            </button>
                            <button type="submit" className="px-6 py-2 rounded-xl bg-[#A67B5B] text-white font-medium hover:bg-[#8B5E3C] transition-colors shadow-lg shadow-[#A67B5B]/30 flex items-center gap-2">
                                <Save className="w-4 h-4" /> Save FAQ
                            </button>
                        </div>
                    </form>
                </AdminModal>
                {tableModalOpen && (
                    <TableInsertModal 
                        isOpen={tableModalOpen}
                        onClose={() => setTableModalOpen(false)}
                        onInsert={handleInsertTable}
                    />
                )}
            </AdminPageLayout>
            <AdminFloatingToolbar
                actions={[
                    {
                        id: 'add-faq',
                        label: 'Add FAQ',
                        icon: Plus,
                        variant: 'primary',
                        onClick: handleAdd,
                    },
                ]}
            />
        </>
    );
}
