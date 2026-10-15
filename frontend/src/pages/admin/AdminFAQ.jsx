import { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Trash2, Save, HelpCircle, ArrowUp, ArrowDown, Image as ImageIcon, Table as TableIcon } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import TableInsertModal from '../../components/admin/TableInsertModal';
import { useFAQs } from '../../hooks/useApiHooks';
import { faqService, contentService } from '../../services/api';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminCard from '../../components/admin/AdminCard';
import EmptyState from '../../components/admin/EmptyState';
import EditableFieldset from '../../components/admin/EditableFieldset';
import Button from '../../components/Button';
import { useSearch } from '../../context/SearchContext';
import useAdminAction from '../../hooks/useAdminAction';
import useRole from '../../hooks/useRole';
import useUnsavedChangesGuard from '../../hooks/useUnsavedChangesGuard';
import { notifyError } from '../../utils/feedback';

registerPlugin(FilePondPluginImagePreview);

const NEW = 'new';

const QUILL_MODULES = {
    toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: ['#000000', '#ffffff', '#4A3F35', '#A67B5B', '#8B6A4D', '#7D8B9A', '#8B9A7D', '#D4A59A', '#F8E8E0', '#6B5E53', '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff'] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['link', 'clean'],
    ],
};

/**
 * FAQs: the questions are the side panel's list; the selected question is
 * edited on the left; Save / Add / Delete / Move live in the shared toolbar.
 * Each question keeps its own draft, so switching between them never loses
 * an edit (unsaved ones are marked with a dot).
 */
export default function AdminFAQ() {
    const { data: faqs = [], isLoading: loading, refetch } = useFAQs();
    const { searchQuery } = useSearch();
    const { canEdit } = useRole();
    const quillRef = useRef(null);
    const [list, setList] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [drafts, setDrafts] = useState({}); // id (or NEW) -> { question, answer }
    const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
    const [tableModalOpen, setTableModalOpen] = useState(false);

    // Keep the local (reorderable) list in step with the server.
    useEffect(() => { setList(faqs); }, [faqs]);

    const saved = (id) => list.find((f) => f.id === id);
    const draftFor = (id) => drafts[id] ?? (id === NEW
        ? { question: '', answer: '' }
        : { question: saved(id)?.question || '', answer: saved(id)?.answer || '' });
    const isDirty = (id) => {
        const draft = drafts[id];
        if (!draft) return false;
        if (id === NEW) return true;
        const faq = saved(id);
        return !!faq && (draft.question !== faq.question || draft.answer !== faq.answer);
    };
    const anyDirty = Object.keys(drafts).some((id) => isDirty(id === NEW ? NEW : Number(id)));
    useUnsavedChangesGuard(anyDirty);

    // Select the first question by default (and after the selected one goes away).
    useEffect(() => {
        if (activeId === NEW || list.some((f) => f.id === activeId)) return;
        setActiveId(list[0]?.id ?? null);
    }, [list, activeId]);

    const searchLower = (searchQuery || '').trim().toLowerCase();
    const visible = useMemo(() => list.filter((faq) => !searchLower
        || `${faq.question} ${faq.answer}`.toLowerCase().includes(searchLower)), [list, searchLower]);

    const items = [
        ...(drafts[NEW] ? [{ id: NEW, label: drafts[NEW].question || 'New question', dot: true }] : []),
        ...visible.map((faq) => ({ id: faq.id, label: draftFor(faq.id).question || 'Untitled question', dot: isDirty(faq.id) })),
    ];

    const draft = activeId != null ? draftFor(activeId) : null;
    const setDraft = (patch) => setDrafts((all) => ({ ...all, [activeId]: { ...draftFor(activeId), ...patch } }));
    const forget = (id) => setDrafts(({ [id]: _dropped, ...rest }) => rest);

    const saveFaq = useAdminAction((id, values) => (id === NEW
        ? faqService.create(values)
        : faqService.update(id, { ...values, order: saved(id)?.order })), {
        key: () => 'save',
        success: 'FAQ saved',
        error: 'Failed to save FAQ.',
        onSuccess: (res, id) => {
            forget(id);
            if (id === NEW && res?.data?.id) setActiveId(res.data.id);
            refetch();
        },
    });
    const save = () => {
        if (!draft?.question.trim()) {
            notifyError('Write the question first.');
            return;
        }
        saveFaq.run(activeId, { question: draft.question.trim(), answer: draft.answer });
    };

    const selectNeighbour = (id) => {
        const index = list.findIndex((f) => f.id === id);
        const next = list[index + 1] || list[index - 1];
        setActiveId(next?.id ?? null);
    };
    const deleteFaq = useAdminAction((id) => faqService.delete(id), {
        key: () => 'delete',
        confirm: 'Delete this FAQ?',
        success: 'FAQ deleted',
        error: 'Failed to delete FAQ',
        onSuccess: (_, id) => { forget(id); selectNeighbour(id); refetch(); },
    });
    const remove = () => {
        if (activeId === NEW) {
            forget(NEW);
            setActiveId(list[0]?.id ?? null);
            return;
        }
        deleteFaq.run(activeId);
    };

    const addFaq = () => {
        setDrafts((all) => ({ ...all, [NEW]: all[NEW] ?? { question: '', answer: '' } }));
        setActiveId(NEW);
        setUploadedFileUrl(null);
    };

    const saveOrder = useAdminAction(
        (ordered) => faqService.reorder(ordered.map((item, index) => ({ id: item.id, order: index }))),
        { key: () => 'reorder', error: 'Failed to update order', onError: () => refetch() },
    );
    const activeIndex = list.findIndex((f) => f.id === activeId);
    const move = (step) => {
        const target = activeIndex + step;
        if (activeIndex < 0 || target < 0 || target >= list.length) return;
        const next = [...list];
        [next[activeIndex], next[target]] = [next[target], next[activeIndex]];
        setList(next);
        saveOrder.run(next);
    };
    // Order follows the full list, so moving is off while a search narrows it.
    const canMove = activeId !== NEW && activeIndex >= 0 && !searchLower;

    const insertImageToQuill = () => {
        if (!uploadedFileUrl || !quillRef.current) return;
        const editor = quillRef.current.getEditor();
        const range = editor.getSelection(true);
        editor.insertEmbed(range.index, 'image', uploadedFileUrl);
        editor.setSelection(range.index + 1);
        setUploadedFileUrl(null);
    };

    const handleInsertTable = (tableHtml) => {
        if (!quillRef.current) return;
        const editor = quillRef.current.getEditor();
        const range = editor.getSelection(true);
        editor.clipboard.dangerouslyPasteHTML(range.index, tableHtml);
        editor.setSelection(range.index + 1);
    };

    return (
        <AdminPageLayout
            actions={[
                {
                    id: 'save-faq',
                    label: saveFaq.pending ? 'Saving...' : 'Save',
                    icon: Save,
                    variant: 'secondary',
                    onClick: save,
                    disabled: !draft || !isDirty(activeId) || saveFaq.pending,
                },
                { id: 'add-faq', label: 'Add FAQ', icon: Plus, onClick: addFaq },
                { id: 'move-up', label: 'Move up', icon: ArrowUp, onClick: () => move(-1), disabled: !canMove || activeIndex === 0 || saveOrder.pending },
                { id: 'move-down', label: 'Move down', icon: ArrowDown, onClick: () => move(1), disabled: !canMove || activeIndex === list.length - 1 || saveOrder.pending },
                { id: 'delete-faq', label: activeId === NEW ? 'Discard' : 'Delete', icon: Trash2, variant: 'danger', onClick: remove, disabled: !draft || deleteFaq.pending },
            ]}
            panel={{
                id: 'faqs',
                title: 'Questions',
                icon: HelpCircle,
                subtitle: searchLower
                    ? `${visible.length} of ${list.length} match your search`
                    : `${list.length} ${list.length === 1 ? 'question' : 'questions'} · in the order guests see them`,
                items,
                activeId,
                onChange: (id) => { setActiveId(id); setUploadedFileUrl(null); },
            }}
            hero={
                <AdminPageHero
                    title="FAQ Management"
                    description={`${faqs.length} questions in database`}
                    breadcrumb="FAQs"
                    icon={<HelpCircle className="w-5 h-5 text-[#A67B5B]" />}
                />
            }
            search="Search FAQs…"
        >
            {loading ? (
                <EmptyState loading />
            ) : !draft ? (
                <AdminCard>
                    <EmptyState icon={HelpCircle} message="No FAQs added yet" action={{ label: 'Add a FAQ', icon: Plus, onClick: addFaq }} />
                </AdminCard>
            ) : (
                <EditableFieldset>
                    <AdminCard className="space-y-5">
                        <div>
                            <label htmlFor="faq-question" className="block text-sm font-medium text-stone-700 mb-1">Question</label>
                            <input
                                id="faq-question"
                                type="text"
                                value={draft.question}
                                onChange={(e) => setDraft({ question: e.target.value })}
                                placeholder="e.g. Is there parking at the venue?"
                                className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-[#A67B5B]/20 outline-none"
                            />
                        </div>

                        <div>
                            <span className="block text-sm font-medium text-stone-700 mb-1">Answer</span>
                            <div className="bg-white border rounded-xl overflow-hidden faq-editor">
                                <ReactQuill
                                    key={activeId}
                                    ref={quillRef}
                                    theme="snow"
                                    value={draft.answer}
                                    // Quill normalises HTML on load; only real edits count.
                                    onChange={(value, _delta, source) => { if (source === 'user') setDraft({ answer: value }); }}
                                    modules={QUILL_MODULES}
                                    readOnly={!canEdit}
                                    style={{ height: '260px' }}
                                />
                            </div>
                        </div>
                    </AdminCard>

                    {canEdit && (
                        <AdminCard className="mt-4">
                            <h3 className="text-sm font-medium text-stone-700 mb-1">Images and tables</h3>
                            <p className="text-xs text-stone-500 mb-3">Upload an image, then insert it where the cursor is in the answer.</p>
                            <div className="grid sm:grid-cols-2 gap-3 items-start">
                                <div className="bg-stone-50 rounded-xl border border-stone-200 p-2">
                                    <FilePond
                                        key={activeId}
                                        server={{
                                            process: async (fieldName, file, metadata, load, error) => {
                                                const formData = new FormData();
                                                formData.append('image', file, file.name);
                                                try {
                                                    const res = await contentService.uploadMedia(formData);
                                                    setUploadedFileUrl(res.data.url);
                                                    load(res.data.url);
                                                } catch {
                                                    error('Upload failed');
                                                }
                                            },
                                        }}
                                        allowImagePreview
                                        name="image"
                                        labelIdle='Drag & Drop an image or <span class="filepond--label-action">Browse</span>'
                                        maxFiles={1}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Button fullWidth icon={ImageIcon} onClick={insertImageToQuill} disabled={!uploadedFileUrl}>
                                        Insert uploaded image
                                    </Button>
                                    <Button fullWidth icon={TableIcon} onClick={() => setTableModalOpen(true)}>
                                        Add a table
                                    </Button>
                                </div>
                            </div>
                        </AdminCard>
                    )}
                </EditableFieldset>
            )}

            {tableModalOpen && (
                <TableInsertModal
                    isOpen={tableModalOpen}
                    onClose={() => setTableModalOpen(false)}
                    onInsert={handleInsertTable}
                />
            )}
        </AdminPageLayout>
    );
}
