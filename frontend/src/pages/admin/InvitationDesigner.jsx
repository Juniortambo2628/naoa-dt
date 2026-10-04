import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { settingService, contentService } from '../../services/api';
import { getWeddingInfo } from '../../utils/weddingInfo';
import { WEDDING_DEFAULTS } from '../../utils/weddingDefaults';
import {
    Palette, Sliders, Undo2, Redo2,
    Maximize, Minimize, GripHorizontal, Eye, EyeOff,
    FileImage, FileText, Plus, Copy, Trash2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toDocument, getPageDesign, createBlankPage, clonePage, SHARED_KEYS } from '../../utils/invitationPages';
import InvitationCanvas from '../../components/admin/InvitationCanvas';
import InvitationExportContainer from '../../components/admin/InvitationExportContainer';
import InvitationToolbar from '../../components/admin/InvitationToolbar';
import InvitationSidebar from '../../components/admin/InvitationSidebar';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminFloatingToolbar from '../../components/admin/AdminFloatingToolbar';
import { saveAs } from 'file-saver';
import { Skeleton } from '../../components/Skeleton';

export default function InvitationDesigner() {
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUpdatingFromHistory, setIsUpdatingFromHistory] = useState(false);

  const [loading, setLoading] = useState(true);
  // Dynamic wedding details (date/venue/coordinates) sourced from the same
  // configuration the public site uses, so the designer preview and exports
  // always reflect the real configured values rather than stale defaults.
  const [weddingInfo, setWeddingInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('style'); // style, text, layout, items
  const [designType, setDesignType] = useState('invitation'); // invitation, save_the_date
  const [editorLang, setEditorLang] = useState('en');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const exporterRef = useRef(null);
  const titleRef = useRef(null);
  const messageRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // saved, saving, error
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isWidgetExpanded, setIsWidgetExpanded] = useState(true);
  const previewContainerRef = useRef(null);
  
  const dummyGuest = {
      name: 'John & Jane Doe',
      unique_code: 'LOVE2026',
      table: { name: 'VVIP Table 1' }
  };
  
  const [design, setDesign] = useState({
    // Shared document-level settings
    accentColor: '#A67B5B',
    orientation: 'portrait', // portrait or landscape
    showGrid: true,
    snapToGrid: true,
    editorLang: 'en',

    // One entry per page. Each page carries its own content, items & styling.
    pages: [
      {
        id: 'page_default',
        bgImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',

        // Multi-language Content (scoped to this page)
        content: {
            en: { title: WEDDING_DEFAULTS.coupleNames, message: 'We invite you to celebrate our wedding' },
            zh: { title: WEDDING_DEFAULTS.coupleNames, message: '我们诚挚地邀请您参加我们的婚礼' },
            ms: { title: WEDDING_DEFAULTS.coupleNames, message: 'Kami menjemput anda untuk meraikan perkahwinan kami' },
            luo: { title: WEDDING_DEFAULTS.coupleNames, message: 'Wakwayi mondo ibe kodo e harus' }
        },

        // Advanced Settings
        showIllustrations: true,
        overlayOpacity: 10,
        showBorder: true,
        frame: {
            visible: true,
            color: '#A67B5B',
            thickness: 1,
            padding: 20
        },
        showOuterOutline: false,

        // Items Layer (includes Title and Message for 100% position accuracy)
        items: [
            { id: 'title_1', type: 'text', textKey: 'title', x: 25, y: 180, width: 450, height: 120, fontStyle: 'cursive', fontSize: 52, zIndex: 50 },
            { id: 'message_1', type: 'text', textKey: 'message', x: 25, y: 320, width: 450, height: 160, fontStyle: 'serif', fontSize: 17, letterSpacing: 0, zIndex: 25 },
            { id: 'frame_1', type: 'frame', x: 20, y: 20, width: 460, height: 585, color: '#A67B5B', thickness: 2, zIndex: 10 }
        ]
      }
    ]
  });

  // Flattened design for the currently-active page (what the canvas & sidebar consume).
  const activePageDesign = getPageDesign(design, currentPage);
  const totalPages = design.pages?.length || 1;

  useEffect(() => {
    const loadDesign = async () => {
        try {
            const res = await settingService.getAll();
            const key = designType === 'invitation' ? 'invitation_theme' : 'save_the_date_theme';
            
            if (res.data[key]) {
                let loaded = res.data[key];
                if (typeof loaded === 'string') {
                    try {
                        loaded = JSON.parse(loaded);
                    } catch (e) {
                        console.error("Error parsing theme JSON", e);
                    }
                }
                
                // Migration for legacy single-language structure
                if (loaded.title && typeof loaded.title === 'string') {
                    loaded.content = {
                        en: { title: loaded.title, message: loaded.message },
                        zh: { title: loaded.title, message: loaded.message },
                        ms: { title: loaded.title, message: loaded.message },
                        luo: { title: loaded.title, message: loaded.message },
                    };
                    delete loaded.title;
                    delete loaded.message;
                }
                
                // Migration for legacy structure (if title/message aren't in items yet)
                if (!loaded.items || !loaded.items.some(i => i.type === 'text')) {
                    const defaultItems = [
                        { id: 'title_1', type: 'text', textKey: 'title', x: 25, y: 250, width: 450, height: 100, fontStyle: loaded.fontStyle || 'cursive', fontSize: (loaded.fontSize / 100) * 48 || 48, zIndex: 50 },
                        { id: 'message_1', type: 'text', textKey: 'message', x: 25, y: 360, width: 450, height: 150, fontStyle: 'serif', fontSize: (loaded.fontSize / 100) * 16 || 16, letterSpacing: loaded.letterSpacing || 0, zIndex: 25 }
                    ];
                    loaded.items = [...(loaded.items || []), ...defaultItems];
                }

                // Migration for legacy frame
                if (loaded.showBorder !== undefined && !loaded.frame) {
                    loaded.frame = {
                        visible: loaded.showBorder,
                        color: loaded.accentColor || '#A67B5B',
                        thickness: 1,
                        padding: 20
                    };
                }

                // Normalize into a multi-page document (backward compatible).
                const finalDesign = toDocument(loaded);
                setDesign(finalDesign);
                setCurrentPage(0);
                setSelectedItemId(null);

                // Initialize history with loaded state
                setHistory([JSON.parse(JSON.stringify(finalDesign))]);
                setHistoryIndex(0);
            } else {
                // Reset to default for new design type if no saved data
                const defaultDesign = {
                    bgImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
                    accentColor: '#A67B5B',
                    content: {
                        en: { title: WEDDING_DEFAULTS.coupleNames, message: designType === 'invitation' ? 'We invite you to celebrate our wedding' : 'Save the Date for our Wedding' },
                        zh: { title: WEDDING_DEFAULTS.coupleNames, message: designType === 'invitation' ? '我们诚挚地邀请您参加我们的婚礼' : '请保留我们的婚礼日期' },
                        ms: { title: WEDDING_DEFAULTS.coupleNames, message: designType === 'invitation' ? 'Kami menjemput anda untuk meraikan perkahwinan kami' : 'Simpan tarikh untuk perkahwinan kami' },
                        luo: { title: WEDDING_DEFAULTS.coupleNames, message: designType === 'invitation' ? 'Wakwayi mondo ibe kodo e harus' : 'Wakwayi mondo iwer kodwa e harus' } 
                    },
                    items: [
                        { id: 'title_1', type: 'text', textKey: 'title', x: 25, y: 180, width: 450, height: 120, fontStyle: 'cursive', fontSize: 52, zIndex: 50 },
                        { id: 'message_1', type: 'text', textKey: 'message', x: 25, y: 320, width: 450, height: 160, fontStyle: 'serif', fontSize: 17, letterSpacing: 0, zIndex: 25 },
                        { id: 'frame_1', type: 'frame', x: 20, y: 20, width: 460, height: 585, color: '#A67B5B', thickness: 2, zIndex: 10 }
                    ],
                    orientation: 'portrait'
                };
                const finalDefault = toDocument(defaultDesign);
                setDesign(finalDefault);
                setCurrentPage(0);
                setSelectedItemId(null);
                setHistory([JSON.parse(JSON.stringify(finalDefault))]);
                setHistoryIndex(0);
            }
        } catch (err) {
            console.error("Failed to load design", err);
        }
        setLoading(false);
    };
    loadDesign();
  }, [designType]);

  // Load the dynamic wedding details once so the Save-the-Date and Location
  // elements render the real configured date/venue/coordinates.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [settingsRes, contentRes] = await Promise.all([
          settingService.getAll(),
          contentService.getAll(),
        ]);
        if (!cancelled) {
          setWeddingInfo(getWeddingInfo(settingsRes.data, contentRes.data));
        }
      } catch (err) {
        console.error('Failed to load wedding info', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const performSilentSave = async (designToSave = design) => {
      setSaveStatus('saving');
      try {
          const key = designType === 'invitation' ? 'invitation_theme' : 'save_the_date_theme';
          await settingService.update({
              [key]: JSON.stringify(designToSave)
          });
          setSaveStatus('saved');
      } catch (err) {
          console.error('Autosave failed', err);
          setSaveStatus('error');
      }
  };

  // Autosave effect — debounced, intentionally keyed only on `design`.
  useEffect(() => {
      if (loading) return; // Don't autosave while initial loading

      const timer = setTimeout(() => {
          performSilentSave();
      }, 2000); // 2 second debounce

      return () => clearTimeout(timer);
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design]);

  const handleTestExport = async (format = 'png') => {
      setIsExporting(true);
      // Wait for React to render the exporter
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
          if (format === 'png') {
              const dataUrl = await exporterRef.current.generateImage();
              if (dataUrl) {
                  saveAs(dataUrl, `Test_Invitation_Design.png`);
              }
          } else {
              const blob = await exporterRef.current.generatePdf();
              if (blob) {
                  saveAs(blob, `Test_Invitation_Design.pdf`);
              }
          }
      } catch (err) {
          console.error("Test export failed", err);
          alert("Failed to export test invitation.");
      } finally {
          setIsExporting(false);
      }
  };

  const fonts = {
      cursive: "'Great Vibes', cursive",
      serif: "'Cormorant Garamond', serif",
      sans: "'Lato', sans-serif"
  };

  const addToHistory = (nextState) => {
      if (isUpdatingFromHistory) return;
      setHistory(prev => {
          const newHistory = prev.slice(0, historyIndex + 1);
          newHistory.push(JSON.parse(JSON.stringify(nextState)));
          // Limit history to 50 steps
          if (newHistory.length > 50) newHistory.shift();
          return newHistory;
      });
      setHistoryIndex(prev => Math.min(prev + 1, 49));
  };

  const handleUndo = () => {
      if (historyIndex > 0) {
          setIsUpdatingFromHistory(true);
          const prevState = history[historyIndex - 1];
          setDesign(prevState);
          setCurrentPage(c => Math.min(c, (prevState.pages?.length || 1) - 1));
          setSelectedItemId(null);
          setHistoryIndex(historyIndex - 1);
          setTimeout(() => setIsUpdatingFromHistory(false), 0);
      }
  };

  const handleRedo = () => {
      if (historyIndex < history.length - 1) {
          setIsUpdatingFromHistory(true);
          const nextState = history[historyIndex + 1];
          setDesign(nextState);
          setCurrentPage(c => Math.min(c, (nextState.pages?.length || 1) - 1));
          setSelectedItemId(null);
          setHistoryIndex(historyIndex + 1);
          setTimeout(() => setIsUpdatingFromHistory(false), 0);
      }
  };

  // Replace the active page inside the document.
  const replaceActivePage = (prev, updater) => ({
      ...prev,
      pages: prev.pages.map((p, i) => (i === currentPage ? updater(p) : p)),
  });

  const updateDesign = (key, value) => {
      setDesign(prev => {
          let newState;
          if (SHARED_KEYS.includes(key)) {
              newState = { ...prev, [key]: value };
          } else {
              newState = replaceActivePage(prev, p => ({ ...p, [key]: value }));
          }

          // Keep the interactive frame element in sync with frame/orientation/accent changes.
          if (key === 'frame' || key === 'accentColor' || key === 'orientation') {
              const page = newState.pages[currentPage];
              const frameItem = page?.items?.find(i => i.type === 'frame');
              if (frameItem) {
                  const padding = page.frame?.padding ?? 20;
                  const thickness = page.frame?.thickness ?? 1;
                  const color = page.frame?.color ?? newState.accentColor;

                  const isLandscape = newState.orientation === 'landscape';
                  const canvasW = isLandscape ? 625 : 500;
                  const canvasH = isLandscape ? 500 : 625;

                  const newItems = page.items.map(it => it.id === frameItem.id ? {
                      ...it,
                      x: padding,
                      y: padding,
                      width: canvasW - (padding * 2),
                      height: canvasH - (padding * 2),
                      thickness,
                      color,
                  } : it);
                  newState = replaceActivePage(newState, p => ({ ...p, items: newItems }));
              }
          }

          addToHistory(newState);
          return newState;
      });
  };

  const handleDesignUpdate = (type, payload) => {
    if (type === 'update_item') {
      const { id, ...updates } = payload;
      setDesign(prev => {
          const page = prev.pages[currentPage];
          const newItems = page.items.map(item =>
              item.id === id ? { ...item, ...updates } : item
          );
          let newPage = { ...page, items: newItems };

          // Sync interactive frame back to the page's frame settings
          const updatedItem = newItems.find(i => i.id === id);
          if (updatedItem && updatedItem.type === 'frame') {
              newPage.frame = {
                  ...newPage.frame,
                  thickness: updatedItem.thickness || newPage.frame?.thickness,
                  color: updatedItem.color || newPage.frame?.color,
                  // Padding is harder to sync back precisely because it's x/y but we can try
                  padding: Math.round(updatedItem.x)
              };
          }

          const newState = { ...prev, pages: prev.pages.map((p, i) => i === currentPage ? newPage : p) };
          addToHistory(newState);
          return newState;
      });
    } else if (type === 'move_item') {
        setDesign(prev => {
            const { id, direction } = payload;
            const page = prev.pages[currentPage];
            const items = [...page.items];
            const index = items.findIndex(i => i.id === id);
            if (index === -1) return prev;

            const sortedItems = [...items].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
            const currentOrderIndex = sortedItems.findIndex(i => i.id === id);

            let newItems = [...items];

            if (direction === 'to_front') {
                const maxZ = Math.max(...items.map(i => i.zIndex || 0), 10);
                newItems = items.map(i => i.id === id ? { ...i, zIndex: maxZ + 1 } : i);
            } else if (direction === 'to_back') {
                const minZ = Math.min(...items.map(i => i.zIndex || 0), 10);
                newItems = items.map(i => i.id === id ? { ...i, zIndex: Math.max(1, minZ - 1) } : i);
            } else if (direction === 'forward') {
                if (currentOrderIndex < sortedItems.length - 1) {
                    const nextItem = sortedItems[currentOrderIndex + 1];
                    const targetZ = nextItem.zIndex || 10;
                    newItems = items.map(i => i.id === id ? { ...i, zIndex: targetZ + 1 } : i);
                }
            } else if (direction === 'backward') {
                if (currentOrderIndex > 0) {
                    const prevItem = sortedItems[currentOrderIndex - 1];
                    const targetZ = prevItem.zIndex || 10;
                    newItems = items.map(i => i.id === id ? { ...i, zIndex: Math.max(1, targetZ - 1) } : i);
                }
            }
            const finalState = { ...prev, pages: prev.pages.map((p, i) => i === currentPage ? { ...p, items: newItems } : p) };
            addToHistory(finalState);
            return finalState;
        });
    } else {
      updateDesign(type, payload);
    }
  };

  const insertPlaceholder = (field, tag) => {
      const ref = field === 'title' ? titleRef : messageRef;
      const currentValue = activePageDesign.content?.[editorLang]?.[field] || '';
      const input = ref.current;
      
      if (!input) return;

      const start = input.selectionStart;
      const end = input.selectionEnd;
      const newValue = currentValue.substring(0, start) + tag + currentValue.substring(end);
      
      updateContent(editorLang, field, newValue);
      
      // Reset focus and cursor position after React update
      setTimeout(() => {
          input.focus();
          input.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
  };
  

  const addItem = (type, extra = {}) => {
            setDesign(prev => {
                const page = prev.pages[currentPage];
                const newItem = {
                    id: Date.now().toString(),
                    type,
                    x: 50,
                    y: 50,
                    width: 100,
                    height: 100,
                    zIndex: page.items.length > 0 ? Math.max(...page.items.map(i => i.zIndex || 0)) + 1 : 10,
                    ...extra
                };
                const newState = {
                    ...prev,
                    pages: prev.pages.map((p, i) => i === currentPage ? { ...p, items: [...p.items, newItem] } : p)
                };
                addToHistory(newState);
                return newState;
            });
        };

  const deleteItem = (id) => {
      setDesign(prev => {
          const newState = {
              ...prev,
              pages: prev.pages.map((p, i) => i === currentPage ? { ...p, items: p.items.filter(item => item.id !== id) } : p)
          };
          addToHistory(newState);
          return newState;
      });
      setSelectedItemId(null);
  };

  const updateContent = (lang, key, value) => {
      setDesign(prev => {
          const newState = {
              ...prev,
              editorLang: lang, // Sync active lang on change (document-level)
              pages: prev.pages.map((p, i) => i === currentPage ? {
                  ...p,
                  content: {
                      ...p.content,
                      [lang]: {
                          ...p.content?.[lang],
                          [key]: value
                      }
                  }
              } : p)
          };
          addToHistory(newState);
          return newState;
      });
  };

  // ----- Page management -----
  const goToPage = (index) => {
      if (index < 0 || index >= (design.pages?.length || 1)) return;
      setCurrentPage(index);
      setSelectedItemId(null);
  };

  const addPage = () => {
      setDesign(prev => {
          const newPage = createBlankPage({ accentColor: prev.accentColor, orientation: prev.orientation });
          const newState = { ...prev, pages: [...prev.pages, newPage] };
          addToHistory(newState);
          return newState;
      });
      setCurrentPage(() => (design.pages?.length || 1)); // move to the new last page
      setSelectedItemId(null);
  };

  const duplicatePage = (index) => {
      setDesign(prev => {
          const source = prev.pages[index];
          if (!source) return prev;
          const copy = clonePage(source);
          const pages = [...prev.pages];
          pages.splice(index + 1, 0, copy);
          const newState = { ...prev, pages };
          addToHistory(newState);
          return newState;
      });
      setCurrentPage(index + 1);
      setSelectedItemId(null);
  };

  const deletePage = (index) => {
      if ((design.pages?.length || 1) <= 1) return; // keep at least one page
      if (!window.confirm(`Delete page ${index + 1}? This cannot be undone with the page bar (use Undo).`)) return;
      setDesign(prev => {
          if (prev.pages.length <= 1) return prev;
          const pages = prev.pages.filter((_, i) => i !== index);
          const newState = { ...prev, pages };
          addToHistory(newState);
          return newState;
      });
      setCurrentPage(c => Math.max(0, Math.min(c, (design.pages?.length || 2) - 2)));
      setSelectedItemId(null);
  };

  const movePage = (index, direction) => {
      const target = index + direction;
      setDesign(prev => {
          if (target < 0 || target >= prev.pages.length) return prev;
          const pages = [...prev.pages];
          const [moved] = pages.splice(index, 1);
          pages.splice(target, 0, moved);
          const newState = { ...prev, pages };
          addToHistory(newState);
          return newState;
      });
      if (target >= 0 && target < (design.pages?.length || 1)) {
          setCurrentPage(target);
          setSelectedItemId(null);
      }
  };

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'ms', label: 'Melayu', flag: '🇲🇾' },
    { code: 'luo', label: 'Luo', flag: '🇰🇪' }
  ];

  const presetBackgrounds = [
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=800&q=80'
  ];

  const presetColors = ['#A67B5B', '#8B9A7D', '#D4A59A', '#4A3F35', '#2C3E50', '#E74C3C'];

  return (
    <>
      <AdminPageLayout
        hero={
          <AdminPageHero
            title="Invitation Designer"
            description="Design your digital wedding invitations and Save the Date cards."
            breadcrumb="Designer"
            icon={<Palette className="w-5 h-5 text-[#A67B5B]" />}
          />
        }
      >
        <div className="flex flex-col gap-4 h-[calc(100vh-140px)]">
          <InvitationToolbar
            saveStatus={saveStatus}
            isExporting={isExporting}
            onTestExport={handleTestExport}
          />

        <div className="flex-1 flex gap-6 overflow-hidden">
         <InvitationSidebar
            loading={loading}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            design={activePageDesign}
            editorLang={editorLang}
            setEditorLang={setEditorLang}
            selectedItemId={selectedItemId}
            setSelectedItemId={setSelectedItemId}
            updateDesign={updateDesign}
            handleDesignUpdate={handleDesignUpdate}
            addItem={addItem}
            deleteItem={deleteItem}
            updateContent={updateContent}
            insertPlaceholder={insertPlaceholder}
            titleRef={titleRef}
            messageRef={messageRef}
            languages={languages}
            presetBackgrounds={presetBackgrounds}
            presetColors={presetColors}
            fonts={fonts}
         />

        {/* Live Preview Area */}
        <div 
            ref={previewContainerRef}
            className={`transition-all duration-300 flex items-center justify-center relative overflow-hidden ${
                isFullscreen 
                    ? 'fixed inset-0 z-[100] bg-stone-100/95 backdrop-blur-md p-8' 
                    : 'flex-1 bg-stone-100 rounded-2xl border-2 border-dashed border-stone-200 p-3'
            }`}
        >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />

            {/* Page Navigator */}
            {!loading && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200 p-1.5 max-w-[90%]">
                    <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage <= 0}
                        className={`p-2 rounded-xl transition-all ${currentPage > 0 ? 'text-[#A67B5B] hover:bg-stone-100' : 'text-stone-300 cursor-not-allowed'}`}
                        title="Previous Page"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide max-w-[280px] px-0.5">
                        {design.pages.map((pg, idx) => (
                            <button
                                key={pg.id || idx}
                                onClick={() => goToPage(idx)}
                                className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-bold transition-all ${currentPage === idx ? 'bg-[#A67B5B] text-white shadow-sm' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
                                title={`Go to page ${idx + 1}`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage >= totalPages - 1}
                        className={`p-2 rounded-xl transition-all ${currentPage < totalPages - 1 ? 'text-[#A67B5B] hover:bg-stone-100' : 'text-stone-300 cursor-not-allowed'}`}
                        title="Next Page"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>

                    <div className="w-px h-6 bg-stone-200 mx-0.5" />

                    <button
                        onClick={addPage}
                        className="p-2 rounded-xl text-[#A67B5B] hover:bg-[#A67B5B]/10 transition-all flex items-center gap-1"
                        title="Add a new page"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Add Page</span>
                    </button>
                    <button
                        onClick={() => duplicatePage(currentPage)}
                        className="p-2 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-[#A67B5B] transition-all"
                        title="Duplicate current page"
                    >
                        <Copy className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => movePage(currentPage, -1)}
                        disabled={currentPage <= 0}
                        className={`p-2 rounded-xl transition-all ${currentPage > 0 ? 'text-stone-400 hover:bg-stone-100 hover:text-[#A67B5B]' : 'text-stone-200 cursor-not-allowed'}`}
                        title="Move page left"
                    >
                        <ChevronLeft className="w-4 h-4" strokeWidth={3} />
                    </button>
                    <button
                        onClick={() => movePage(currentPage, 1)}
                        disabled={currentPage >= totalPages - 1}
                        className={`p-2 rounded-xl transition-all ${currentPage < totalPages - 1 ? 'text-stone-400 hover:bg-stone-100 hover:text-[#A67B5B]' : 'text-stone-200 cursor-not-allowed'}`}
                        title="Move page right"
                    >
                        <ChevronRight className="w-4 h-4" strokeWidth={3} />
                    </button>
                    <button
                        onClick={() => deletePage(currentPage)}
                        disabled={totalPages <= 1}
                        className={`p-2 rounded-xl transition-all ${totalPages > 1 ? 'text-stone-400 hover:bg-red-50 hover:text-red-500' : 'text-stone-200 cursor-not-allowed'}`}
                        title="Delete current page"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )}

            {loading ? (
                 <div className="flex-1 flex items-center justify-center p-8 z-10">
                     <Skeleton variant="image" width="400px" height="600px" className="rounded-2xl shadow-xl max-w-full" />
                 </div>
            ) : (
                <InvitationCanvas
                    design={activePageDesign}
                    onUpdateDesign={(type, payload) => handleDesignUpdate(type, payload)}
                    selectedId={selectedItemId}
                    onSelectExclusively={setSelectedItemId}
                    mode="edit" 
                    guest={dummyGuest}
                    showGrid={design.showGrid}
                    snapToGrid={design.snapToGrid}
                    weddingSettings={weddingInfo}
                />
            )}

            {/* Floating Workspace Controls (Undo/Redo & Design Type) */}
            <motion.div 
                drag 
                dragMomentum={false}
                dragConstraints={previewContainerRef}
                initial={{ x: "-50%", y: 0 }}
                style={{ translateX: "-50%" }}
                className="absolute bottom-6 left-1/2 flex items-center bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200 p-1.5 z-50"
            >
                <div className="flex items-center px-2 cursor-grab active:cursor-grabbing text-stone-300 hover:text-stone-500" title="Drag to move">
                    <GripHorizontal className="w-4 h-4" />
                </div>
                
                {isWidgetExpanded && (
                    <div className="flex items-center">
                        <div className="w-px h-6 bg-stone-200 mx-1" />
                        <button 
                            onClick={handleUndo} 
                            disabled={historyIndex <= 0}
                            className={`p-3 rounded-xl transition-all ${historyIndex > 0 ? 'text-[#A67B5B] hover:bg-stone-100' : 'text-stone-300 cursor-not-allowed'}`}
                            title="Undo (Ctrl+Z)"
                        >
                            <Undo2 className="w-5 h-5" />
                        </button>
                        <div className="w-px h-6 bg-stone-200 mx-1" />
                        <button 
                            onClick={handleRedo} 
                            disabled={historyIndex >= history.length - 1}
                            className={`p-3 rounded-xl transition-all ${historyIndex < history.length - 1 ? 'text-[#A67B5B] hover:bg-stone-100' : 'text-stone-300 cursor-not-allowed'}`}
                            title="Redo (Ctrl+Y)"
                        >
                            <Redo2 className="w-5 h-5" />
                        </button>
                        <div className="w-px h-6 bg-stone-200 mx-1" />
                        
                        {/* Selected Element Opacity Adjustment */}
                        {selectedItemId && (
                            <>
                                <div className="flex items-center gap-2 px-2" title="Element Opacity">
                                    <Sliders className="w-4 h-4 text-[#A67B5B]" />
                                    <input
                                        type="range"
                                        min="0" max="100"
                                        value={activePageDesign.items.find(i => i.id === selectedItemId)?.opacity ?? 100}
                                        onChange={(e) => handleDesignUpdate('update_item', { id: selectedItemId, opacity: parseInt(e.target.value) })}
                                        className="w-20 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#A67B5B]"
                                    />
                                    <span className="text-[10px] font-bold text-stone-500 w-6">{activePageDesign.items.find(i => i.id === selectedItemId)?.opacity ?? 100}%</span>
                                </div>
                                <div className="w-px h-6 bg-stone-200 mx-1" />
                            </>
                        )}

                        <select
                            value={designType}
                            onChange={(e) => setDesignType(e.target.value)}
                            className="px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-transparent text-[#A67B5B] cursor-pointer hover:bg-stone-100 transition-all border-none outline-none appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23A67B5B' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 4px center', paddingRight: '20px' }}
                        >
                            <option value="invitation">Invitation</option>
                            <option value="save_the_date">Save the Date</option>
                        </select>
                    </div>
                )}
                
                <div className="w-px h-6 bg-stone-200 mx-1" />
                <button
                    onClick={() => setIsWidgetExpanded(!isWidgetExpanded)}
                    className="p-2 rounded-xl transition-all text-stone-400 hover:bg-stone-100 hover:text-[#A67B5B]"
                    title={isWidgetExpanded ? "Collapse Controls" : "Expand Controls"}
                >
                    {isWidgetExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <div className="w-px h-6 bg-stone-200 mx-1" />
                <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-2 rounded-xl transition-all text-stone-400 hover:bg-stone-100 hover:text-[#A67B5B]"
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Preview"}
                >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
            </motion.div>

            {/* Hidden Exporter */}
            <InvitationExportContainer 
                ref={exporterRef} 
                design={design} 
                guest={dummyGuest} 
                weddingSettings={weddingInfo}
                onReady={(methods) => {
                    exporterRef.current = methods;
                }}
            />
        </div>
        </div>
        </div>
      </AdminPageLayout>
      <AdminFloatingToolbar
        actions={[
          {
            id: 'test-png',
            label: 'Test PNG',
            icon: FileImage,
            onClick: () => handleTestExport('png'),
            disabled: isExporting,
          },
          {
            id: 'test-pdf',
            label: 'Test PDF',
            icon: FileText,
            onClick: () => handleTestExport('pdf'),
            disabled: isExporting,
          },
        ]}
      />
    </>
  );
}
