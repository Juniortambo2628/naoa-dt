import React, { useState, useEffect, useRef } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Plus, Edit, Trash2, Save, X, HelpCircle, GripVertical, Image as ImageIcon, Table as TableIcon } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import TableInsertModal from '../../components/admin/TableInsertModal';
import 'react-quill-new/dist/quill.snow.css'; // ES6
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import { faqService } from '../../services/api';
import AdminPageHero from '../../components/admin/AdminPageHero';

registerPlugin(FilePondPluginImagePreview);

export default function AdminFAQ() {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedFaq, setSelectedFaq] = useState(null);
    const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
    const [tableModalOpen, setTableModalOpen] = useState(false);
    const quillRef = useRef(null);

    // Form state
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');

    const fetchFaqs = async () => {
        try {
            const res = await faqService.getAll();
            setFaqs(res.data || []);
        } catch (error) {
            console.error("Failed to fetch FAQs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFaqs();
    }, []);

    const handleAdd = () => {
        setSelectedFaq(null);
        setQuestion('');
        setAnswer('');
        setUploadedFileUrl(null);
        setModalOpen(true);
    };

    const handleEdit = (faq) => {
        setSelectedFaq(faq);
        setQuestion(faq.question);
        setAnswer(faq.answer);
        setUploadedFileUrl(null);
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this FAQ?")) return;
        try {
            await faqService.delete(id);
            fetchFaqs();
        } catch (err) {
            console.error(err);
            alert("Failed to delete.");
        }
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
            fetchFaqs();
        } catch (err) {
            console.error(err);
            alert("Failed to save FAQ.");
        }
    };

    const handleReorder = async (newOrder) => {
        setFaqs(newOrder);
        // Map to expected format
        const updatedFaqs = newOrder.map((item, index) => ({ id: item.id, order: index }));
        try {
            await faqService.reorder(updatedFaqs);
        } catch (error) {
            console.error("Failed to update order", error);
        }
    };

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
        // ReactQuill doesn't always handle raw HTML well via insertEmbed for complex structures
        // but we can use clipboard.dangerouslyPasteHTML
        editor.clipboard.dangerouslyPasteHTML(range.index, tableHtml);
        editor.setSelection(range.index + 1);
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'clean']
        ],
    };

    return (
        <div className="space-y-6">
            <AdminPageHero
                title="FAQ Management"
                description="Manage public Frequently Asked Questions and their order."
                breadcrumb={[
                    { label: 'Dashboard', path: '/admin/dashboard' },
                    { label: 'FAQs' },
                ]}
                icon={<HelpCircle className="w-5 h-5 text-[#A67B5B]" />}
                actions={
                    <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
                        <Plus className="w-5 h-5" /> Add New FAQ
                    </button>
                }
            />

            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-[#A67B5B]">Loading FAQs...</div>
                ) : faqs.length === 0 ? (
                    <div className="p-12 text-center text-stone-500 italic">No FAQs added yet.</div>
                ) : (
                    <Reorder.Group axis="y" values={faqs} onReorder={handleReorder} className="divide-y divide-stone-100">
                        {faqs.map((faq) => (
                            <Reorder.Item 
                                key={faq.id} 
                                value={faq} 
                                className="p-4 flex gap-4 bg-white items-start hover:bg-stone-50 transition-colors shadow-sm relative group cursor-pointer"
                            >
                                <div className="mt-1 cursor-grab active:cursor-grabbing text-stone-300 hover:text-stone-500">
                                    <GripVertical className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-medium text-stone-800 text-lg mb-2">{faq.question}</h3>
                                    <div 
                                        className="text-stone-600 prose prose-sm max-w-none max-h-24 overflow-hidden relative break-words [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg"
                                        dangerouslySetInnerHTML={{ __html: faq.answer }}
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-stone-50 to-transparent flex justify-end px-4"></div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleEdit(faq); }} 
                                        className="p-2 text-[#A67B5B] bg-[#A67B5B]/10 rounded-lg hover:bg-[#A67B5B]/20"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(faq.id); }} 
                                        className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                    >
                        <div className="sticky top-0 bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between z-10">
                            <h2 className="text-xl font-semibold text-stone-800">
                                {selectedFaq ? 'Edit FAQ' : 'Add New FAQ'}
                            </h2>
                            <button onClick={() => setModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 space-y-6">
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
                                                            const res = await faqService.uploadMedia(formData);
                                                            // Provide URL back 
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
                    </motion.div>
                </div>
            )}
            {tableModalOpen && (
                <TableInsertModal 
                    isOpen={tableModalOpen}
                    onClose={() => setTableModalOpen(false)}
                    onInsert={handleInsertTable}
                />
            )}
        </div>
    );
}
