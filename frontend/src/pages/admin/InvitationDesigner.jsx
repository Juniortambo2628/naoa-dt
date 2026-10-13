import { useState, useEffect, useRef, useCallback } from 'react';
import { settingService, contentService } from '../../services/api';
import { getWeddingInfo } from '../../utils/weddingInfo';
import { WEDDING_DEFAULTS } from '../../utils/weddingDefaults';
import {
    Palette, Sliders, Undo2, Redo2,
    Maximize, Minimize,
    FileImage, FileText, Grid3x3, Magnet, RectangleHorizontal, RectangleVertical, ZoomIn, ZoomOut,
} from 'lucide-react';
import { PortalWhen } from '../../components/Overlay';
import { toDocument, getPageDesign, createBlankPage, clonePage, SHARED_KEYS } from '../../utils/invitationPages';
import InvitationCanvas from '../../components/admin/InvitationCanvas';
import InvitationExportContainer from '../../components/admin/InvitationExportContainer';
import InvitationSidebar from '../../components/admin/InvitationSidebar';
import InvitationSaveStatus from '../../components/admin/InvitationSaveStatus';
import InvitationPageMenu from '../../components/admin/InvitationPageMenu';
import InvitationAddMenu from '../../components/admin/InvitationAddMenu';
import ContextMenu from '../../components/admin/ContextMenu';
import { buildItemMenu, buildPageMenu, buildSelectionMenu } from '../../components/admin/invitationMenus';
import { canvasSize, nudgeItems, alignItems, distributeItems, layerOrder, pickStyle, applyStyle } from '../../utils/invitationItems';
import { elementPreset } from '../../components/admin/invitationElements';
import { AdminHeaderStatus } from '../../context/AdminChromeContext';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminFloatingToolbar from '../../components/admin/AdminFloatingToolbar';
import { saveAs } from 'file-saver';
import { Skeleton } from '../../components/Skeleton';
import { toast } from 'react-hot-toast';
import { confirmAction, notifyError } from '../../utils/feedback';

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
  // Selection: several elements with Shift-click; the last one is the
  // "primary" the side panel edits.
  const [selectedIds, setSelectedIds] = useState([]);
  const selectedItemId = selectedIds[selectedIds.length - 1] ?? null;
  const setSelectedItemId = useCallback((id) => setSelectedIds(id ? [id] : []), []);
  const handleSelect = useCallback((id, { additive = false } = {}) => {
      if (!id) return setSelectedIds([]);
      setSelectedIds(prev => (additive
          ? (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
          : [id]));
  }, []);
  const [zoom, setZoom] = useState('fit'); // 'fit' or a scale factor
  const [fitScale, setFitScale] = useState(1);
  const [copiedStyle, setCopiedStyle] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  // Open right-click menu: { kind: 'item' | 'page', itemId?, position: { x, y } }
  const [contextMenu, setContextMenu] = useState(null);
  const closeContextMenu = useCallback(() => setContextMenu(null), []);
  const exporterRef = useRef(null);
  const titleRef = useRef(null);
  const messageRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // saved, saving, error
  // Autosave must stay disarmed until a load actually succeeds, otherwise a
  // failed load would leave the default blank document in state and the next
  // edit would overwrite the real saved design (losing extra pages).
  const loadedOkRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  useEffect(() => {
    const loadDesign = async () => {
        loadedOkRef.current = false; // disarm autosave until this load succeeds
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
            // Load succeeded — safe to autosave from here on.
            loadedOkRef.current = true;
        } catch (err) {
            console.error("Failed to load design", err);
            // Leave autosave disarmed so we never overwrite the saved design
            // (which may contain extra pages) with the default blank document.
            setSaveStatus('error');
            toast.error('Could not load your saved design. Reload the page before editing to avoid overwriting it.', { duration: 8000 });
        }
        setLoading(false);
    };
    loadDesign();
  }, [designType, setSelectedItemId]);

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
          toast.error('Autosave failed — your latest changes are NOT saved. Check your connection and try again.', { id: 'invitation-autosave-error', duration: 8000 });
      }
  };

  // Autosave effect — debounced, intentionally keyed only on `design`.
  useEffect(() => {
      if (loading) return; // Don't autosave while initial loading
      if (!loadedOkRef.current) return; // Don't autosave if the load failed (would overwrite saved pages)

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
          notifyError("Failed to export test invitation.");
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
    } else if (type === 'update_items') {
      // Several elements in one undo step (group drag, align, nudge, paste style).
      if (!payload?.length) return;
      const byId = Object.fromEntries(payload.map(({ id, ...changes }) => [id, changes]));
      setDesign(prev => {
          const newState = replaceActivePage(prev, p => ({
              ...p,
              items: p.items.map(item => (byId[item.id] ? { ...item, ...byId[item.id] } : item)),
          }));
          addToHistory(newState);
          return newState;
      });
    } else if (type === 'reorder_layers') {
      handleDesignUpdate('update_items', layerOrder(payload));
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

  const deleteItem = (idOrIds) => {
      const ids = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
      setDesign(prev => {
          const newState = {
              ...prev,
              pages: prev.pages.map((p, i) => i === currentPage ? { ...p, items: p.items.filter(item => !ids.includes(item.id)) } : p)
          };
          addToHistory(newState);
          return newState;
      });
      setSelectedItemId(null);
  };

  // Insert one of the shared element presets (sidebar, toolbar, right-click).
  const addElement = (kind) => {
      const preset = elementPreset(kind, activePageDesign);
      if (!preset) return;
      addItem(preset.type, preset.extra);
      if (preset.text) updateContent(editorLang, preset.extra.textKey, preset.text);
  };

  const duplicateItem = (id) => {
      const newId = `${Date.now()}`;
      setDesign(prev => {
          const page = prev.pages[currentPage];
          const source = page.items.find(i => i.id === id);
          if (!source) return prev;
          const maxZ = Math.max(...page.items.map(i => i.zIndex || 0), 10);
          const copy = { ...source, id: newId, x: (source.x || 0) + 15, y: (source.y || 0) + 15, zIndex: maxZ + 1 };
          let content = page.content;
          // Custom text lines keep their wording under their own key.
          if (source.type === 'text' && source.textKey && source.textKey.startsWith('final_')) {
              copy.textKey = `final_${newId}`;
              content = Object.fromEntries(Object.entries(page.content || {}).map(([lang, values]) => [
                  lang, { ...values, [copy.textKey]: values?.[source.textKey] },
              ]));
          }
          const newState = {
              ...prev,
              pages: prev.pages.map((p, i) => i === currentPage ? { ...p, content, items: [...p.items, copy] } : p),
          };
          addToHistory(newState);
          return newState;
      });
      setSelectedItemId(newId);
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

  const deletePage = async (index) => {
      if ((design.pages?.length || 1) <= 1) return; // keep at least one page
      if (!await confirmAction(`Delete page ${index + 1}? This cannot be undone with the page bar (use Undo).`)) return;
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

  const renamePage = (index, rawName) => {
      const name = (rawName || '').trim();
      setDesign(prev => {
          const current = prev.pages[index];
          if (!current) return prev;
          // Store undefined (falls back to "Page N") when cleared, and skip a
          // no-op history entry when nothing actually changed.
          const nextName = name || undefined;
          if ((current.name || undefined) === nextName) return prev;
          const newState = {
              ...prev,
              pages: prev.pages.map((p, i) => i === index ? { ...p, name: nextName } : p),
          };
          addToHistory(newState);
          return newState;
      });
  };

  // Drag-to-reorder from the page menu. Driven by stable page ids (framer-motion
  // Reorder) and keeps the current page selected by id across the reorder.
  const reorderPages = (newIds) => {
      const activeId = design.pages[currentPage]?.id;
      const byId = Object.fromEntries(design.pages.map(p => [p.id, p]));
      const newPages = newIds.map(id => byId[id]).filter(Boolean);
      if (newPages.length !== design.pages.length) return;
      setDesign(prev => {
          const newState = { ...prev, pages: newPages };
          addToHistory(newState);
          return newState;
      });
      const newIdx = newPages.findIndex(p => p.id === activeId);
      if (newIdx >= 0) setCurrentPage(newIdx);
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

  const canvas = canvasSize(design.orientation);
  const pageItems = activePageDesign.items || [];
  const selectedItem = pageItems.find(i => i.id === selectedItemId);
  const selectedItems = pageItems.filter(i => selectedIds.includes(i.id));
  const openTab = (tab) => { setActiveTab(tab); setContextMenu(null); };
  const updateItems = (updates) => handleDesignUpdate('update_items', updates);

  const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const currentScale = zoom === 'fit' ? fitScale : zoom;
  const zoomBy = (direction) => {
      const next = direction > 0 ? ZOOM_STEPS.find(z => z > currentScale + 0.01) : [...ZOOM_STEPS].reverse().find(z => z < currentScale - 0.01);
      if (next) setZoom(next);
  };

  // Keyboard: undo/redo, select all, duplicate, delete, nudge (Shift = 10px), zoom.
  useEffect(() => {
      const onKeyDown = (e) => {
          const t = e.target;
          if (t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
          const mod = e.ctrlKey || e.metaKey;
          const key = e.key.toLowerCase();
          const arrows = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] };
          if (mod && key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
          else if (mod && (key === 'y' || (key === 'z' && e.shiftKey))) { e.preventDefault(); handleRedo(); }
          else if (mod && key === 'a') { e.preventDefault(); setSelectedIds(pageItems.map(i => i.id)); }
          else if (mod && key === 'd' && selectedItemId) { e.preventDefault(); duplicateItem(selectedItemId); }
          else if (mod && (key === '=' || key === '+')) { e.preventDefault(); zoomBy(1); }
          else if (mod && key === '-') { e.preventDefault(); zoomBy(-1); }
          else if (mod && key === '0') { e.preventDefault(); setZoom('fit'); }
          else if (arrows[key] && selectedItems.length) {
              e.preventDefault();
              const step = e.shiftKey ? 10 : 1;
              updateItems(nudgeItems(selectedItems, arrows[key][0] * step, arrows[key][1] * step, canvas));
          }
          else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length) { e.preventDefault(); deleteItem(selectedIds); }
          else if (e.key === 'Escape' && selectedIds.length) setSelectedIds([]);
      };
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
  });

  const menuContext = {
      update: (id, changes) => handleDesignUpdate('update_item', { id, ...changes }),
      updateItems,
      move: (id, direction) => handleDesignUpdate('move_item', { id, direction }),
      duplicate: duplicateItem,
      remove: deleteItem,
      align: (items, mode) => updateItems(alignItems(items, mode, canvas)),
      alignUpdates: (items, mode) => alignItems(items, mode, canvas),
      distribute: (items, axis) => updateItems(distributeItems(items, axis)),
      copyStyle: (item) => setCopiedStyle(pickStyle(item)),
      pasteStyle: copiedStyle ? (items) => updateItems(applyStyle(items, copiedStyle)) : null,
      canvas,
      presetColors,
      accentColor: design.accentColor,
  };
  const contextItem = contextMenu?.kind === 'item' ? pageItems.find(i => i.id === contextMenu.itemId) : null;
  const contextMenuItems = !contextMenu ? []
      : contextItem && selectedItems.length > 1 && selectedIds.includes(contextItem.id)
      ? buildSelectionMenu(selectedItems, menuContext)
      : contextItem
      ? buildItemMenu(contextItem, {
          ...menuContext,
          editProperties: () => openTab(contextItem.type === 'text' || contextItem.type === 'frame' ? 'text' : 'layers'),
      })
      : contextMenu.kind === 'page'
      ? buildPageMenu({
          design: { ...activePageDesign, showGrid: design.showGrid, snapToGrid: design.snapToGrid },
          addElement,
          updateDesign,
          openTab,
          presetColors,
          selectAll: () => setSelectedIds(pageItems.map(i => i.id)),
      })
      : [];

  const toggleButton = (active) => `p-2 rounded-xl transition-all ${active ? 'bg-[#A67B5B]/15 text-[#8B5E3C]' : 'text-stone-400 hover:bg-stone-100 hover:text-[#A67B5B]'}`;
  const divider = <div className="w-px h-6 bg-stone-200/70 mx-0.5" />;

  return (
    <>
      <AdminHeaderStatus>
        <InvitationSaveStatus status={saveStatus} />
      </AdminHeaderStatus>

      <AdminPageLayout
        fill
        hero={
          <AdminPageHero
            title="Invitation Designer"
            description="Design your digital wedding invitations and Save the Date cards. Right-click any element for quick adjustments."
            breadcrumb="Designer"
            icon={<Palette className="w-5 h-5 text-[#A67B5B]" />}
          />
        }
      >
        {/* Fits the viewport on desktop (like other editors): only the side
            panel scrolls, so its tabs and the canvas always stay in view. */}
        <div className="flex flex-col gap-4 lg:h-[calc(100vh-140px)] fit:h-auto fit:flex-1 fit:min-h-0">
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 lg:gap-6 lg:overflow-hidden">
         <InvitationSidebar
            loading={loading}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            design={activePageDesign}
            editorLang={editorLang}
            setEditorLang={setEditorLang}
            selectedItemId={selectedItemId}
            setSelectedItemId={setSelectedItemId}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            updateDesign={updateDesign}
            handleDesignUpdate={handleDesignUpdate}
            addItem={addItem}
            onAddElement={addElement}
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
        <PortalWhen active={isFullscreen}>
        <div 
            ref={previewContainerRef}
            className={`transition-all duration-300 flex items-center justify-center overflow-hidden ${
                isFullscreen
                    // No `relative` here: it would override `fixed` and leave the preview in the page flow.
                    ? 'fixed inset-0 z-[100] bg-stone-100/95 backdrop-blur-md p-8'
                    : 'relative order-1 lg:order-2 flex-1 min-h-[55vh] lg:min-h-0 bg-stone-100 rounded-2xl border-2 border-dashed border-stone-200 p-3'
            }`}
        >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />

            {loading ? (
                 <div className="flex-1 flex items-center justify-center p-8 z-10">
                     <Skeleton variant="image" width="400px" height="600px" className="rounded-2xl shadow-xl max-w-full" />
                 </div>
            ) : (
                <InvitationCanvas
                    design={activePageDesign}
                    onUpdateDesign={(type, payload) => handleDesignUpdate(type, payload)}
                    selectedIds={selectedIds}
                    onSelect={handleSelect}
                    zoom={zoom}
                    onFitScaleChange={setFitScale}
                    mode="edit" 
                    guest={dummyGuest}
                    showGrid={design.showGrid}
                    snapToGrid={design.snapToGrid}
                    weddingSettings={weddingInfo}
                    onItemContextMenu={(item, position) => setContextMenu({ kind: 'item', itemId: item.id, position })}
                    onCanvasContextMenu={(position) => setContextMenu({ kind: 'page', position })}
                />
            )}

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
        </PortalWhen>
        </div>
        </div>
      </AdminPageLayout>

      <ContextMenu position={contextMenu?.position || null} items={contextMenuItems} onClose={closeContextMenu} />

      <AdminFloatingToolbar
        z={isFullscreen ? 'z-[110]' : 'z-50'}
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
      >
        {!loading && (
          <>
            {/* Pages: switch, reorder, rename, duplicate, delete, add */}
            <InvitationPageMenu
              pages={design.pages}
              currentPage={currentPage}
              onGoTo={goToPage}
              onAdd={addPage}
              onDuplicate={duplicatePage}
              onDelete={deletePage}
              onMove={movePage}
              onReorder={reorderPages}
              onRename={renamePage}
            />

            {divider}

            {/* Undo / redo */}
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className={`p-2 rounded-xl transition-all ${historyIndex > 0 ? 'text-[#A67B5B] hover:bg-stone-100' : 'text-stone-300 cursor-not-allowed'}`}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className={`p-2 rounded-xl transition-all ${historyIndex < history.length - 1 ? 'text-[#A67B5B] hover:bg-stone-100' : 'text-stone-300 cursor-not-allowed'}`}
              title="Redo (Ctrl+Y)"
              aria-label="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>

            {divider}

            {/* Design tools */}
            <InvitationAddMenu onAdd={addElement} />
            <button
              onClick={() => updateDesign('showGrid', !design.showGrid)}
              aria-pressed={!!design.showGrid}
              className={toggleButton(design.showGrid)}
              title="Show grid"
              aria-label="Show grid"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => updateDesign('snapToGrid', !design.snapToGrid)}
              aria-pressed={!!design.snapToGrid}
              className={toggleButton(design.snapToGrid)}
              title="Snap to grid"
              aria-label="Snap to grid"
            >
              <Magnet className="w-4 h-4" />
            </button>
            <button
              onClick={() => updateDesign('orientation', design.orientation === 'landscape' ? 'portrait' : 'landscape')}
              className={toggleButton(false)}
              title={`Orientation: ${design.orientation === 'landscape' ? 'landscape' : 'portrait'} (click to switch)`}
              aria-label={`Switch to ${design.orientation === 'landscape' ? 'portrait' : 'landscape'} orientation`}
            >
              {design.orientation === 'landscape' ? <RectangleHorizontal className="w-4 h-4" /> : <RectangleVertical className="w-4 h-4" />}
            </button>
            <label className="relative p-2 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer" title="Accent colour">
              <span className="block w-4 h-4 rounded-full border border-white shadow-sm" style={{ background: design.accentColor }} />
              <input
                type="color"
                value={design.accentColor || '#A67B5B'}
                onChange={(e) => updateDesign('accentColor', e.target.value)}
                aria-label="Accent colour"
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>

            {/* Selected element opacity (also in the right-click menu and side panel) */}
            {selectedItem && (
              <div className="hidden 2xl:flex items-center">
                {divider}
                <div className="flex items-center gap-2 px-1" title="Element opacity">
                  <Sliders className="w-4 h-4 text-[#A67B5B]" />
                  <input
                    type="range"
                    min="0" max="100"
                    aria-label="Element opacity"
                    value={selectedItem.opacity ?? 100}
                    onChange={(e) => handleDesignUpdate('update_item', { id: selectedItemId, opacity: parseInt(e.target.value) })}
                    className="w-20 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#A67B5B]"
                  />
                  <span className="text-[10px] font-bold text-stone-500 w-6">{selectedItem.opacity ?? 100}%</span>
                </div>
              </div>
            )}

            {divider}

            {/* Zoom */}
            <div className="flex items-center" role="group" aria-label="Zoom">
              <button onClick={() => zoomBy(-1)} className={toggleButton(false)} title="Zoom out (Ctrl −)" aria-label="Zoom out"><ZoomOut className="w-4 h-4" /></button>
              <button
                onClick={() => setZoom('fit')}
                className="min-w-[3.25rem] px-1 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
                title="Fit to screen (Ctrl 0)"
                aria-label={`Zoom ${Math.round(currentScale * 100)}%, click to fit`}
              >
                {zoom === 'fit' ? 'Fit' : `${Math.round(currentScale * 100)}%`}
              </button>
              <button onClick={() => zoomBy(1)} className={toggleButton(false)} title="Zoom in (Ctrl +)" aria-label="Zoom in"><ZoomIn className="w-4 h-4" /></button>
            </div>

            {divider}

            {/* Design type + fullscreen */}
            <select
              value={designType}
              onChange={(e) => setDesignType(e.target.value)}
              aria-label="Design type"
              className="px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-transparent text-[#A67B5B] cursor-pointer hover:bg-stone-100 transition-all border-none outline-none appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23A67B5B' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 4px center', paddingRight: '20px' }}
            >
              <option value="invitation">Invitation</option>
              <option value="save_the_date">Save the Date</option>
            </select>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl transition-all text-stone-400 hover:bg-stone-100 hover:text-[#A67B5B]"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen preview'}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen preview'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </>
        )}
      </AdminFloatingToolbar>
    </>
  );
}
