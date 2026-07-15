import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { settingService } from '../../services/api';
import {
    Palette, Sliders, Undo2, Redo2,
    Maximize, Minimize, GripHorizontal, Eye, EyeOff,
    FileImage, FileText
} from 'lucide-react';
import InvitationCanvas from '../../components/admin/InvitationCanvas';
import InvitationExportContainer from '../../components/admin/InvitationExportContainer';
import InvitationToolbar from '../../components/admin/InvitationToolbar';
import InvitationSidebar from '../../components/admin/InvitationSidebar';
import AdminPageHero from '../../components/admin/AdminPageHero';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import AdminFloatingToolbar from '../../components/admin/AdminFloatingToolbar';
import { saveAs } from 'file-saver';
import { Skeleton } from '../../components/Skeleton';
/* Force refresh: 2026-04-15 07:02 - Syntax fix complete. Component should now reload. */

export default function InvitationDesigner() {
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUpdatingFromHistory, setIsUpdatingFromHistory] = useState(false);

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('style'); // style, text, layout, items
  const [designType, setDesignType] = useState('invitation'); // invitation, save_the_date
  const [editorLang, setEditorLang] = useState('en');
  const [selectedItemId, setSelectedItemId] = useState(null);
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
    bgImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    accentColor: '#A67B5B',
    
    // Multi-language Content (Shared by all text items)
    content: {
        en: { title: 'Dinah & Tze Ren', message: 'We invite you to celebrate our wedding' },
        zh: { title: 'Dinah & Tze Ren', message: '我们诚挚地邀请您参加我们的婚礼' },
        ms: { title: 'Dinah & Tze Ren', message: 'Kami menjemput anda untuk meraikan perkahwinan kami' },
        luo: { title: 'Dinah & Tze Ren', message: 'Wakwayi mondo ibe kodo e harus' } 
    },
    
    // Advanced Settings
    showIllustrations: true,
    overlayOpacity: 10,
    showBorder: true,
    orientation: 'portrait', // portrait or landscape
    frame: {
        visible: true,
        color: '#A67B5B',
        thickness: 1,
        padding: 20
    },
    showOuterOutline: false,
    
    // Items Layer (Now includes Title and Message for 100% position accuracy)
    items: [
        { id: 'title_1', type: 'text', textKey: 'title', x: 25, y: 180, width: 450, height: 120, fontStyle: 'cursive', fontSize: 52, zIndex: 50 },
        { id: 'message_1', type: 'text', textKey: 'message', x: 25, y: 320, width: 450, height: 160, fontStyle: 'serif', fontSize: 17, letterSpacing: 0, zIndex: 25 },
        { id: 'frame_1', type: 'frame', x: 20, y: 20, width: 460, height: 585, color: '#A67B5B', thickness: 2, zIndex: 10 }
    ],
    
    // Editor State
    showGrid: true,
    snapToGrid: true,
    editorLang: 'en'
  });

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

                setSettings(res.data);
                const finalDesign = { ...design, ...loaded };
                setDesign(finalDesign);
                
                // Initialize history with loaded state
                setHistory([JSON.parse(JSON.stringify(finalDesign))]);
                setHistoryIndex(0);
            } else {
                // Reset to default for new design type if no saved data
                const defaultDesign = {
                    bgImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
                    accentColor: '#A67B5B',
                    content: {
                        en: { title: 'Dinah & Tze Ren', message: designType === 'invitation' ? 'We invite you to celebrate our wedding' : 'Save the Date for our Wedding' },
                        zh: { title: 'Dinah & Tze Ren', message: designType === 'invitation' ? '我们诚挚地邀请您参加我们的婚礼' : '请保留我们的婚礼日期' },
                        ms: { title: 'Dinah & Tze Ren', message: designType === 'invitation' ? 'Kami menjemput anda untuk meraikan perkahwinan kami' : 'Simpan tarikh untuk perkahwinan kami' },
                        luo: { title: 'Dinah & Tze Ren', message: designType === 'invitation' ? 'Wakwayi mondo ibe kodo e harus' : 'Wakwayi mondo iwer kodwa e harus' } 
                    },
                    items: [
                        { id: 'title_1', type: 'text', textKey: 'title', x: 25, y: 180, width: 450, height: 120, fontStyle: 'cursive', fontSize: 52, zIndex: 50 },
                        { id: 'message_1', type: 'text', textKey: 'message', x: 25, y: 320, width: 450, height: 160, fontStyle: 'serif', fontSize: 17, letterSpacing: 0, zIndex: 25 },
                        { id: 'frame_1', type: 'frame', x: 20, y: 20, width: 460, height: 585, color: '#A67B5B', thickness: 2, zIndex: 10 }
                    ],
                    orientation: 'portrait'
                };
                setDesign(defaultDesign);
                setHistory([JSON.parse(JSON.stringify(defaultDesign))]);
                setHistoryIndex(0);
            }
        } catch (err) {
            console.error("Failed to load design", err);
        }
        setLoading(false);
    };
    loadDesign();
  }, [designType]);

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

  const handleSave = async () => {
      await performSilentSave();
      if (saveStatus === 'error') {
          alert('Failed to save design.');
      } else {
          alert(`${designType === 'invitation' ? 'Invitation' : 'Save the Date'} design saved successfully!`);
      }
  };

  // Autosave effect
  useEffect(() => {
      if (loading) return; // Don't autosave while initial loading
      
      const timer = setTimeout(() => {
          performSilentSave();
      }, 2000); // 2 second debounce

      return () => clearTimeout(timer);
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
          setHistoryIndex(historyIndex - 1);
          setTimeout(() => setIsUpdatingFromHistory(false), 0);
      }
  };

  const handleRedo = () => {
      if (historyIndex < history.length - 1) {
          setIsUpdatingFromHistory(true);
          const nextState = history[historyIndex + 1];
          setDesign(nextState);
          setHistoryIndex(historyIndex + 1);
          setTimeout(() => setIsUpdatingFromHistory(false), 0);
      }
  };

  const updateDesign = (key, value) => {
      setDesign(prev => {
          const newState = { ...prev, [key]: value };
          
          // Sync global frame to interactive frame
          if (key === 'frame' || key === 'accentColor') {
              const frameItem = newState.items.find(i => i.type === 'frame');
              if (frameItem) {
                  const padding = newState.frame?.padding ?? 20;
                  const thickness = newState.frame?.thickness ?? 1;
                  const color = newState.frame?.color ?? newState.accentColor;
                  
                  const isLandscape = newState.orientation === 'landscape';
                  const canvasW = isLandscape ? 625 : 500;
                  const canvasH = isLandscape ? 500 : 625;
                  
                  frameItem.x = padding;
                  frameItem.y = padding;
                  frameItem.width = canvasW - (padding * 2);
                  frameItem.height = canvasH - (padding * 2);
                  frameItem.thickness = thickness;
                  frameItem.color = color;
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
          const newState = {
            ...prev,
            items: prev.items.map(item => 
              item.id === id ? { ...item, ...updates } : item
            )
          };

          // Sync interactive frame back to global frame
          const updatedItem = newState.items.find(i => i.id === id);
          if (updatedItem && updatedItem.type === 'frame') {
              newState.frame = {
                  ...newState.frame,
                  thickness: updatedItem.thickness || newState.frame?.thickness,
                  color: updatedItem.color || newState.frame?.color,
                  // Padding is harder to sync back precisely because it's x/y but we can try
                  padding: Math.round(updatedItem.x)
              };
          }

          addToHistory(newState);
          return newState;
      });
    } else if (type === 'move_item') {
        setDesign(prev => {
            const { id, direction } = payload;
            const items = [...prev.items];
            const index = items.findIndex(i => i.id === id);
            if (index === -1) return prev;
            
            const item = items[index];
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
            const finalState = { ...prev, items: newItems };
            addToHistory(finalState);
            return finalState;
        });
    } else {
      updateDesign(type, payload);
    }
  };

  const insertPlaceholder = (field, tag) => {
      const ref = field === 'title' ? titleRef : messageRef;
      const currentValue = design.content?.[editorLang]?.[field] || '';
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
            const newItem = {
                id: Date.now().toString(),
                type,
                x: 50,
                y: 50,
                width: 100,
                height: 100,
                zIndex: design.items.length > 0 ? Math.max(...design.items.map(i => i.zIndex || 0)) + 1 : 10,
                ...extra
            };
            setDesign(prev => {
                const newState = {
                    ...prev,
                    items: [...prev.items, newItem]
                };
                addToHistory(newState);
                return newState;
            });
        };

  const deleteItem = (id) => {
      setDesign(prev => {
          const newState = {
              ...prev,
              items: prev.items.filter(item => item.id !== id)
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
              editorLang: lang, // Sync active lang on change
              content: {
                  ...prev.content,
                  [lang]: {
                      ...prev.content?.[lang],
                      [key]: value
                  }
              }
          };
          addToHistory(newState);
          return newState;
      });
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
            design={design}
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
            
            {loading ? (
                 <div className="flex-1 flex items-center justify-center p-8 z-10">
                     <Skeleton variant="image" width="400px" height="600px" className="rounded-2xl shadow-xl max-w-full" />
                 </div>
            ) : (
                <InvitationCanvas 
                    design={design} 
                    onUpdateDesign={(type, payload) => updateDesign(type, payload)} 
                    selectedId={selectedItemId}
                    onSelectExclusively={setSelectedItemId}
                    mode="edit" 
                    guest={dummyGuest}
                    showGrid={design.showGrid}
                    snapToGrid={design.snapToGrid}
                    weddingSettings={settings}
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
                                        value={design.items.find(i => i.id === selectedItemId)?.opacity ?? 100}
                                        onChange={(e) => handleDesignUpdate('update_item', { id: selectedItemId, opacity: parseInt(e.target.value) })}
                                        className="w-20 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#A67B5B]"
                                    />
                                    <span className="text-[10px] font-bold text-stone-500 w-6">{design.items.find(i => i.id === selectedItemId)?.opacity ?? 100}%</span>
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
                weddingSettings={settings}
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
