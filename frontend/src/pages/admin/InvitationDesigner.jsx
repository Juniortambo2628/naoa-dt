import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { settingService } from '../../services/api';
import { 
    Palette, Type, Sliders, Image as ImageIcon, Plus, 
    Save, FileText, FileImage, Trash2, Move, 
    Calendar, Hash, User, AlignLeft, AlignCenter, 
    AlignRight, AlignJustify, ArrowUpToLine, ArrowDownToLine, 
    ChevronUp, ChevronDown, ArrowUp, ArrowDown, X, MapPin,
    Table as TableIcon, SquareDashedMousePointer, Undo2, Redo2,
    Loader2, CloudUpload, CloudCheck, AlertCircle
} from 'lucide-react';
import ImageUpload from '../../components/admin/ImageUpload';
import InvitationCanvas from '../../components/admin/InvitationCanvas';
import InvitationExportContainer from '../../components/admin/InvitationExportContainer';
import AdminPageHero from '../../components/admin/AdminPageHero';
import { saveAs } from 'file-saver';
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
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
        <AdminPageHero
          title="Invitation Designer"
          description="Design your digital wedding invitations and Save the Date cards."
          breadcrumb={[
            { label: 'Dashboard', path: '/admin/dashboard' },
            { label: 'Designer' },
          ]}
          icon={<Palette className="w-5 h-5 text-[#A67B5B]" />}
          actions={
              <div className="flex items-center gap-3">
                  <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 ${
                      saveStatus === 'saving' ? 'bg-amber-50 text-amber-700' : 
                      saveStatus === 'error' ? 'bg-red-50 text-red-700' : 
                      'bg-green-50 text-green-700'
                  }`}>
                      {saveStatus === 'saving' ? <Loader2 className="w-3 h-3 animate-spin" /> : 
                       saveStatus === 'error' ? <AlertCircle className="w-3 h-3" /> : 
                       <CloudCheck className="w-3 h-3" />}
                      {saveStatus === 'saving' ? 'Saving Changes...' : 
                       saveStatus === 'error' ? 'Save Error' : 
                       'Changes Saved'}
                  </div>
                  
                  {/* Actions Dropdown */}
                  <div className="relative group">
                      <button className="btn-primary flex items-center gap-2 px-4 py-2">
                          Actions <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
                      </button>
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-stone-100 rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                          <button 
                              onClick={() => handleTestExport('png')}
                              disabled={isExporting}
                              className="w-full text-left px-4 py-2 hover:bg-stone-50 text-sm flex items-center gap-2 text-stone-600"
                          >
                              <FileImage className="w-4 h-4" /> Test PNG
                          </button>
                          <button 
                              onClick={() => handleTestExport('pdf')}
                              disabled={isExporting}
                              className="w-full text-left px-4 py-2 hover:bg-stone-50 text-sm flex items-center gap-2 text-stone-600"
                          >
                              <FileText className="w-4 h-4" /> Test PDF
                          </button>
                      </div>
                  </div>
              </div>
          }
       />

       <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Controls Sidebar */}
        <div className="w-96 bg-white rounded-2xl shadow-sm border border-stone-100 flex flex-col overflow-hidden">
            
            <div className="flex-1 overflow-y-auto font-sans">
                <div className="p-6 space-y-8">
                    {/* Tabs Navigation */}
                    <div className="flex p-1 bg-stone-100/50 rounded-xl mb-6">
                        {(['style', 'text', 'layout', 'items', 'layers']).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${activeTab === tab ? 'bg-white text-[#A67B5B] shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                
                {activeTab === 'items' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                        <div className="space-y-4">
                             <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 text-center space-y-3">
                                <h3 className="font-bold text-stone-700" style={{ fontFamily: 'Lato, sans-serif' }}>Add Element</h3>
                                
                                <div className="mb-4">
                                     <ImageUpload 
                                        onUpload={(url) => addItem('image', { src: url, height: 120 })}
                                        allowMultiple={false}
                                    />
                                </div>

                                 <div className="grid grid-cols-2 gap-2">
                                     <button 
                                        onClick={() => addItem('rsvp_code', { width: 120, height: 60 })}
                                        className="p-3 bg-white border border-stone-200 rounded-lg hover:border-[#A67B5B] text-sm text-stone-600 flex flex-col items-center gap-2"
                                    >
                                        <Move className="w-5 h-5" /> RSVP Code
                                    </button>
                                     <button 
                                         onClick={() => addItem('calendar_link', { width: 140, height: 70 })}
                                         className="p-3 bg-white border border-stone-200 rounded-lg hover:border-[#A67B5B] text-sm text-stone-600 flex flex-col items-center gap-2"
                                     >
                                         <Calendar className="w-5 h-5" /> Save Date
                                     </button>
                                     <button 
                                         onClick={() => {
                                             const newId = `loc_${Date.now()}`;
                                             addItem('text', { id: newId, textKey: newId, width: 300, height: 40, fontStyle: 'serif', fontSize: 18, x: 100, y: 250 });
                                             updateContent(editorLang, newId, 'Nairobi, Kenya');
                                         }}
                                         className="p-3 bg-white border border-stone-200 rounded-lg hover:border-[#A67B5B] text-sm text-stone-600 flex flex-col items-center gap-2"
                                     >
                                         <MapPin className="w-5 h-5" /> Location
                                     </button>
                                     <button 
                                         onClick={() => {
                                             const newId = `final_${Date.now()}`;
                                             addItem('text', { id: newId, textKey: newId, width: 300, height: 40, fontStyle: 'serif', fontSize: 16, x: 100, y: 450, italic: true });
                                             updateContent(editorLang, newId, 'invite to follow');
                                         }}
                                         className="p-3 bg-white border border-stone-200 rounded-lg hover:border-[#A67B5B] text-sm text-stone-600 flex flex-col items-center gap-2"
                                     >
                                         <AlignLeft className="w-5 h-5" /> Final Line
                                     </button>
                                     <button 
                                         onClick={() => {
                                             addItem('frame', { 
                                                 width: design.orientation === 'landscape' ? 585 : 460, 
                                                 height: design.orientation === 'landscape' ? 460 : 585, 
                                                 x: 20, 
                                                 y: 20, 
                                                 color: design.accentColor,
                                                 thickness: 2
                                             });
                                         }}
                                         className="p-3 bg-white border border-stone-200 rounded-lg hover:border-[#A67B5B] text-sm text-stone-600 flex flex-col items-center gap-2"
                                     >
                                         <SquareDashedMousePointer className="w-5 h-5" /> Interactive Frame
                                     </button>
                                </div>
                             </div>

                        </div>
                    </div>
                )}

                {activeTab === 'layers' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                        <div className="space-y-4">
                            <h3 className="text-[10px] uppercase font-bold text-stone-400 tracking-[0.2em]" style={{ fontFamily: 'Lato, sans-serif' }}>Layers</h3>
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                                 {design.items.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0)).map((item, index) => {
                                     return (
                                         <div 
                                         key={item.id}
                                         className={`group flex items-center gap-3 p-3 bg-white border rounded-xl transition-all cursor-pointer ${selectedItemId === item.id ? 'border-[#A67B5B] ring-1 ring-[#A67B5B] shadow-sm' : 'border-stone-100 hover:border-stone-200'}`}
                                         onClick={() => setSelectedItemId(item.id)}
                                     >
                                         <div className="p-2 bg-stone-50 rounded-lg text-stone-400 group-hover:text-[#A67B5B] transition-colors">
                                             {item.type === 'text' ? <FileText className="w-4 h-4" /> : 
                                              item.type === 'image' ? <FileImage className="w-4 h-4" /> : 
                                              item.type === 'frame' ? <SquareDashedMousePointer className="w-4 h-4" /> :
                                              <Move className="w-4 h-4" />}
                                         </div>
                                         <div className="flex-1 min-w-0">
                                             <p className="text-xs font-bold text-stone-700 truncate font-sans">
                                                 {item.type === 'text' ? (item.textKey === 'title' ? 'Main Title' : item.textKey === 'message' ? 'Message Text' : 'Custom Text') : 
                                                  item.type === 'rsvp_code' ? 'RSVP Code' : 
                                                  item.type === 'frame' ? 'Interactive Frame' :
                                                  item.type === 'calendar_link' ? 'Save the Date' : 'Image ' + item.id.split('_')[1]}
                                             </p>
                                         </div>
                                         <button 
                                             onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                                             className="p-1.5 opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-all"
                                         >
                                             <X className="w-3.5 h-3.5" />
                                         </button>
                                     </div>
                                     );
                                 })}
                             </div>
                        </div>

                        {selectedItemId && (
                            <div className="space-y-4 p-4 bg-stone-50 rounded-xl border border-stone-200 animate-in fade-in slide-in-from-top-4">
                                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider font-sans">Layering Control</h3>
                                <div className="grid grid-cols-4 gap-1">
                                    <button 
                                        onClick={() => handleDesignUpdate('move_item', { id: selectedItemId, direction: 'to_front' })}
                                        title="Bring to Front"
                                        className="p-2 bg-white border border-stone-200 rounded-lg hover:border-[#A67B5B] flex flex-col items-center gap-1"
                                    >
                                        <ChevronUp className="w-4 h-4" /> <span className="text-[8px] font-sans">Front</span>
                                    </button>
                                    <button 
                                        onClick={() => handleDesignUpdate('move_item', { id: selectedItemId, direction: 'forward' })}
                                        title="Bring Forward"
                                        className="p-2 bg-white border border-stone-200 rounded-lg hover:border-[#A67B5B] flex flex-col items-center gap-1"
                                    >
                                        <ArrowUp className="w-4 h-4" /> <span className="text-[8px] font-sans">Up</span>
                                    </button>
                                    <button 
                                        onClick={() => handleDesignUpdate('move_item', { id: selectedItemId, direction: 'backward' })}
                                        title="Send Backward"
                                        className="p-2 bg-white border border-stone-200 rounded-lg hover:border-[#A67B5B] flex flex-col items-center gap-1"
                                    >
                                        <ArrowDown className="w-4 h-4" /> <span className="text-[8px] font-sans">Down</span>
                                    </button>
                                    <button 
                                        onClick={() => handleDesignUpdate('move_item', { id: selectedItemId, direction: 'to_back' })}
                                        title="Send to Back"
                                        className="p-2 bg-white border border-stone-200 rounded-lg hover:border-[#A67B5B] flex flex-col items-center gap-1"
                                    >
                                        <ChevronDown className="w-4 h-4" /> <span className="text-[8px] font-sans">Back</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {activeTab === 'style' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                        <div className="space-y-4 font-sans">
                            <h3 className="text-[10px] uppercase font-bold text-stone-400 tracking-[0.2em]" style={{ fontFamily: 'Lato, sans-serif' }}>Background</h3>
                            <div className="grid grid-cols-4 gap-2">
                                <button 
                                    onClick={() => updateDesign('bgImage', null)}
                                    className={`aspect-square rounded-lg border-2 flex items-center justify-center transition-all ${!design.bgImage ? 'border-[#A67B5B] bg-[#A67B5B]/5' : 'border-stone-100 hover:border-stone-200'}`}
                                >
                                    <div className="w-4 h-4 rounded-full border border-stone-300" />
                                </button>
                                {presetBackgrounds.map(bg => (
                                    <button 
                                        key={bg}
                                        onClick={() => updateDesign('bgImage', bg)}
                                        className={`aspect-square rounded-lg border-2 overflow-hidden transition-all ${design.bgImage === bg ? 'border-[#A67B5B] shadow-md' : 'border-stone-100 hover:border-stone-200'}`}
                                    >
                                        <img src={bg} alt="preset" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                                <div className="col-span-4 mt-1">
                                    <div className="p-3 border-2 border-dashed border-[#A67B5B]/20 rounded-xl bg-[#A67B5B]/5 hover:border-[#A67B5B]/40 transition-all text-center">
                                        <p className="text-[10px] font-bold text-[#A67B5B] uppercase tracking-wider mb-2">Upload Background</p>
                                        <ImageUpload 
                                            onUpload={(url) => updateDesign('bgImage', url)}
                                            allowMultiple={false}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 font-sans">
                            <h3 className="text-[10px] uppercase font-bold text-stone-400 tracking-[0.2em]" style={{ fontFamily: 'Lato, sans-serif' }}>Accent Color</h3>
                            <div className="flex flex-wrap gap-2">
                                {presetColors.map(color => (
                                    <button 
                                        key={color}
                                        onClick={() => updateDesign('accentColor', color)}
                                        className={`w-8 h-8 rounded-full border-2 transition-all transform hover:scale-110 ${design.accentColor === color ? 'border-white ring-2 ring-[#A67B5B] shadow-sm' : 'border-transparent'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                                <div className="relative group">
                                    <input 
                                        type="color" 
                                        value={design.accentColor}
                                        onChange={(e) => updateDesign('accentColor', e.target.value)}
                                        className="w-8 h-8 rounded-full border-2 border-stone-100 cursor-pointer p-0"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'text' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                        {/* Language Selector */}
                        <div className="flex bg-stone-100 p-1 rounded-lg">
                            {languages.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setEditorLang(lang.code);
                                        updateDesign('editorLang', lang.code);
                                    }}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${editorLang === lang.code ? 'bg-white shadow-sm text-[#A67B5B]' : 'text-stone-500 hover:text-stone-700'}`}
                                >
                                    {lang.label}
                                </button>
                            ))}
                        </div>

                        {selectedItemId && design.items.find(i => i.id === selectedItemId)?.type === 'text' && (
                            <>
                                <div className="space-y-4 p-4 bg-stone-50 rounded-xl border border-stone-200 animate-in fade-in slide-in-from-top-4">
                                    <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider font-sans">Alignment & Indent</h3>
                                    <div className="space-y-4">
                                        {/* Horizontal Alignment */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-stone-500 font-sans">Horizontal</span>
                                            <div className="flex bg-white rounded-lg border border-stone-200 p-1">
                                                {[
                                                    { id: 'left', icon: AlignLeft },
                                                    { id: 'center', icon: AlignCenter },
                                                    { id: 'right', icon: AlignRight }
                                                ].map(align => (
                                                    <button
                                                        key={align.id}
                                                        onClick={() => handleDesignUpdate('update_item', { id: selectedItemId, textAlign: align.id })}
                                                        className={`p-1.5 rounded transition-colors ${design.items.find(i => i.id === selectedItemId)?.textAlign === align.id ? 'bg-[#A67B5B] text-white' : 'text-stone-400 hover:bg-stone-50'}`}
                                                    >
                                                        <align.icon className="w-4 h-4" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Vertical Alignment */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-stone-500 font-sans">Vertical</span>
                                            <div className="flex bg-white rounded-lg border border-stone-200 p-1">
                                                {[
                                                    { id: 'top', icon: ArrowUpToLine },
                                                    { id: 'middle', icon: AlignJustify },
                                                    { id: 'bottom', icon: ArrowDownToLine }
                                                ].map(valign => (
                                                    <button
                                                        key={valign.id}
                                                        onClick={() => handleDesignUpdate('update_item', { id: selectedItemId, verticalAlign: valign.id })}
                                                        className={`p-1.5 rounded transition-colors ${design.items.find(i => i.id === selectedItemId)?.verticalAlign === valign.id ? 'bg-[#A67B5B] text-white' : 'text-stone-400 hover:bg-stone-50'}`}
                                                    >
                                                        <valign.icon className="w-4 h-4 rotate-0" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Indentation (Left Padding) */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-stone-500 font-sans">
                                                <span>Indentation (Left Padding)</span>
                                                <span>{design.items.find(i => i.id === selectedItemId)?.paddingLeft || 0}px</span>
                                            </div>
                                            <input 
                                                type="range" min="0" max="100" 
                                                value={design.items.find(i => i.id === selectedItemId)?.paddingLeft || 0}
                                                onChange={(e) => handleDesignUpdate('update_item', { id: selectedItemId, paddingLeft: parseInt(e.target.value) })}
                                                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#A67B5B]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                 <div className="space-y-4 p-4 bg-[#A67B5B]/5 rounded-xl border border-[#A67B5B]/20 animate-in fade-in slide-in-from-top-4 font-sans">
                                    <h3 className="text-xs font-bold text-[#A67B5B] uppercase tracking-wider font-sans">Element Properties</h3>
                                    
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-medium text-stone-600 font-sans">Color</label>
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="color" 
                                                    value={design.items.find(i => i.id === selectedItemId)?.color || design.accentColor}
                                                    onChange={(e) => handleDesignUpdate('update_item', { id: selectedItemId, color: e.target.value })}
                                                    className="w-6 h-6 rounded border border-stone-200 p-0 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                     {(design.items.find(i => i.id === selectedItemId)?.type === 'text' || design.items.find(i => i.id === selectedItemId)?.type === 'frame') && (
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-[10px] text-stone-500 font-bold font-sans">
                                                <span>{design.items.find(i => i.id === selectedItemId)?.type === 'frame' ? 'Border Thickness' : 'Font/Icon Size'}</span>
                                                <span>{design.items.find(i => i.id === selectedItemId)?.type === 'frame' ? design.items.find(i => i.id === selectedItemId)?.thickness || 1 : design.items.find(i => i.id === selectedItemId)?.fontSize || 16}px</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min={design.items.find(i => i.id === selectedItemId)?.type === 'frame' ? 1 : 10} 
                                                max={design.items.find(i => i.id === selectedItemId)?.type === 'frame' ? 20 : 120} 
                                                value={design.items.find(i => i.id === selectedItemId)?.type === 'frame' ? design.items.find(i => i.id === selectedItemId)?.thickness || 1 : design.items.find(i => i.id === selectedItemId)?.fontSize || 16}
                                                onChange={(e) => handleDesignUpdate('update_item', { id: selectedItemId, [design.items.find(i => i.id === selectedItemId)?.type === 'frame' ? 'thickness' : 'fontSize']: parseInt(e.target.value) })}
                                                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#A67B5B]"
                                            />
                                        </div>
                                    )}

                                    {design.items.find(i => i.id === selectedItemId)?.type === 'text' && (
                                        <div className="space-y-3">
                                            <label className="text-xs font-medium text-stone-600 font-sans">Font Style</label>
                                            <div className="grid grid-cols-3 gap-1">
                                                {['cursive', 'serif', 'sans'].map(style => (
                                                    <button 
                                                        key={style}
                                                        onClick={() => handleDesignUpdate('update_item', { id: selectedItemId, fontStyle: style })}
                                                        className={`py-2 text-[10px] border rounded-lg transition-all font-sans ${design.items.find(i => i.id === selectedItemId)?.fontStyle === style ? 'border-[#A67B5B] bg-white text-[#A67B5B]' : 'bg-stone-50 border-stone-200 text-stone-500'}`}
                                                        style={{ fontFamily: fonts[style] }}
                                                    >
                                                        {style.charAt(0).toUpperCase() + style.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {design.items.find(i => i.id === selectedItemId)?.textKey === 'message' && (
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-[10px] text-stone-500 font-medium font-sans">
                                                <span>Letter Spacing</span>
                                                <span>{design.items.find(i => i.id === selectedItemId)?.letterSpacing || 0}px</span>
                                            </div>
                                            <input 
                                                type="range" min="0" max="10" 
                                                value={design.items.find(i => i.id === selectedItemId)?.letterSpacing || 0}
                                                onChange={(e) => handleDesignUpdate('update_item', { id: selectedItemId, letterSpacing: parseInt(e.target.value) })}
                                                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#A67B5B]"
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-3 pt-2 border-t border-stone-100">
                                        <div className="flex justify-between text-[10px] text-stone-500 font-bold font-sans">
                                            <span>Opacity</span>
                                            <span>{design.items.find(i => i.id === selectedItemId)?.opacity ?? 100}%</span>
                                        </div>
                                        <input 
                                            type="range" min="0" max="100" 
                                            value={design.items.find(i => i.id === selectedItemId)?.opacity ?? 100}
                                            onChange={(e) => handleDesignUpdate('update_item', { id: selectedItemId, opacity: parseInt(e.target.value) })}
                                            className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#A67B5B]"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-stone-700 font-sans">Content ({languages.find(l => l.code === editorLang)?.label})</label>
                                <div className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold font-sans">Dynamic Fields</div>
                            </div>
                            
                            <div className="space-y-2">
                                 <div className="flex justify-between items-center text-xs text-stone-500 mb-1 font-sans">
                                    <span>Invitation Title</span>
                                    <div className="flex gap-1">
                                        <button onClick={() => insertPlaceholder('title', '{{name}}')} title="Insert Guest Name" className="p-1 hover:bg-[#A67B5B]/10 rounded text-[#A67B5B] border border-[#A67B5B]/20 flex items-center gap-1 font-sans">
                                            <User className="w-3 h-3" /> <span className="text-[9px]">Name</span>
                                        </button>
                                    </div>
                                </div>
                                {!design.items.some(i => i.textKey === 'title') && (
                                    <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                        <span className="text-[11px] text-amber-700 font-medium flex-1">Layer missing from canvas</span>
                                        <button
                                            onClick={() => {
                                                addItem('text', {
                                                    id: 'title_1',
                                                    textKey: 'title',
                                                    x: 25, y: 180, width: 450, height: 120,
                                                    fontStyle: 'cursive', fontSize: 52, zIndex: 50
                                                });
                                            }}
                                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-md transition-colors flex items-center gap-1 whitespace-nowrap"
                                        >
                                            <Plus className="w-3 h-3" /> Add to Design
                                        </button>
                                    </div>
                                )}
                                <input 
                                    ref={titleRef}
                                    className="w-full p-3 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-[#A67B5B]/20 outline-none font-sans"
                                    value={design.content?.[editorLang]?.title || ''}
                                    onChange={(e) => updateContent(editorLang, 'title', e.target.value)}
                                    onFocus={() => setSelectedItemId(design.items.find(i => i.textKey === 'title')?.id)}
                                    placeholder="Main Title (e.g. Names)"
                                />
                            </div>

                            {/* Additional Text Fields for Custom Text Items */}
                            {design.items.filter(i => i.type === 'text' && i.textKey !== 'title' && i.textKey !== 'message').map(item => (
                                <div key={item.id} className="space-y-2 p-3 bg-stone-50 rounded-lg border border-stone-100 font-sans">
                                    <div className="flex justify-between items-center text-xs text-stone-500 font-sans">
                                        <span className="font-bold">Text Element ({item.id})</span>
                                        <button 
                                            onClick={() => deleteItem(item.id)}
                                            className="text-red-400 hover:text-red-600"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <input 
                                        className="w-full p-2 border border-stone-200 rounded text-sm focus:ring-2 focus:ring-[#A67B5B]/20 outline-none font-sans"
                                        value={design.content?.[editorLang]?.[item.textKey] || ''}
                                        onChange={(e) => updateContent(editorLang, item.textKey, e.target.value)}
                                        onFocus={() => setSelectedItemId(item.id)}
                                        placeholder="Enter custom text..."
                                    />
                                </div>
                            ))}

                            <div className="space-y-2 font-sans">
                                <div className="flex justify-between items-center text-xs text-stone-500 mb-1 font-sans">
                                    <span>Invitation Message</span>
                                    <div className="flex gap-1">
                                        <button onClick={() => insertPlaceholder('message', '{{name}}')} title="Insert Guest Name" className="p-1 hover:bg-[#A67B5B]/10 rounded text-[#A67B5B] border border-[#A67B5B]/20 flex items-center gap-1 font-sans">
                                            <User className="w-3 h-3" /> <span className="text-[9px]">Name</span>
                                        </button>
                                        <button onClick={() => insertPlaceholder('message', '{{code}}')} title="Insert RSVP Code" className="p-1 hover:bg-[#A67B5B]/10 rounded text-[#A67B5B] border border-[#A67B5B]/20 flex items-center gap-1 font-sans">
                                            <Hash className="w-3 h-3" /> <span className="text-[9px]">Code</span>
                                        </button>
                                        <button onClick={() => insertPlaceholder('message', '{{table}}')} title="Insert Table Name" className="p-1 hover:bg-[#A67B5B]/10 rounded text-[#A67B5B] border border-[#A67B5B]/20 flex items-center gap-1 font-sans">
                                            <TableIcon className="w-3 h-3" /> <span className="text-[9px]">Table</span>
                                        </button>
                                    </div>
                                </div>
                                {!design.items.some(i => i.textKey === 'message') && (
                                    <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                        <span className="text-[11px] text-amber-700 font-medium flex-1">Layer missing from canvas</span>
                                        <button
                                            onClick={() => {
                                                addItem('text', {
                                                    id: 'message_1',
                                                    textKey: 'message',
                                                    x: 25, y: 320, width: 450, height: 160,
                                                    fontStyle: 'serif', fontSize: 17, letterSpacing: 0, zIndex: 25
                                                });
                                            }}
                                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-md transition-colors flex items-center gap-1 whitespace-nowrap"
                                        >
                                            <Plus className="w-3 h-3" /> Add to Design
                                        </button>
                                    </div>
                                )}
                                <textarea 
                                    ref={messageRef}
                                    className="w-full p-3 border border-stone-200 rounded-lg text-sm h-32 resize-none focus:ring-2 focus:ring-[#A67B5B]/20 outline-none font-sans"
                                    value={design.content?.[editorLang]?.message || ''}
                                    onChange={(e) => updateContent(editorLang, 'message', e.target.value)}
                                    onFocus={() => setSelectedItemId(design.items.find(i => i.textKey === 'message')?.id)}
                                    placeholder="Invitation message/details..."
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'layout' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 font-sans">
                        <div className="space-y-4 font-sans">
                            {/* Orientation Selection */}
                            <div className="space-y-3 font-sans">
                                <label className="text-sm font-medium text-stone-700 font-sans">Orientation</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        onClick={() => updateDesign('orientation', 'portrait')}
                                        className={`p-3 border rounded-xl flex flex-col items-center gap-2 transition-all font-sans ${design.orientation === 'portrait' ? 'border-[#A67B5B] bg-[#A67B5B]/5 text-[#A67B5B]' : 'border-stone-200 bg-white text-stone-500'}`}
                                    >
                                        <div className="w-6 h-8 border-2 border-current rounded-sm" />
                                        <span className="text-xs font-bold">Portrait (4:5)</span>
                                    </button>
                                    <button 
                                        onClick={() => updateDesign('orientation', 'landscape')}
                                        className={`p-3 border rounded-xl flex flex-col items-center gap-2 transition-all font-sans ${design.orientation === 'landscape' ? 'border-[#A67B5B] bg-[#A67B5B]/5 text-[#A67B5B]' : 'border-stone-200 bg-white text-stone-500'}`}
                                    >
                                        <div className="w-8 h-6 border-2 border-current rounded-sm" />
                                        <span className="text-xs font-bold">Landscape (5:4)</span>
                                    </button>
                                </div>
                            </div>

                            {/* Frame Controls */}
                            <div className="pt-4 border-t border-stone-100 space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-stone-700">Frame (Border)</label>
                                    <input 
                                        type="checkbox"
                                        checked={design.frame?.visible || design.showBorder}
                                        onChange={(e) => updateDesign('frame', { ...(design.frame || {}), visible: e.target.checked })}
                                        className="rounded text-[#A67B5B] focus:ring-[#A67B5B]"
                                    />
                                </div>

                                { (design.frame?.visible || design.showBorder) && (
                                    <div className="space-y-4 pl-4 border-l-2 border-stone-100 animate-in fade-in slide-in-from-top-2">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase font-bold text-stone-400">Color</label>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="color" 
                                                        value={design.frame?.color || design.accentColor}
                                                        onChange={(e) => updateDesign('frame', { ...(design.frame || {}), color: e.target.value })}
                                                        className="w-8 h-8 rounded border-0 p-0 cursor-pointer"
                                                    />
                                                    <span className="text-[10px] font-mono text-stone-500">{design.frame?.color || design.accentColor}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase font-bold text-stone-400">Thickness ({design.frame?.thickness || 1}px)</label>
                                                <input 
                                                    type="range" min="1" max="10" 
                                                    value={design.frame?.thickness || 1}
                                                    onChange={(e) => updateDesign('frame', { ...(design.frame || {}), thickness: parseInt(e.target.value) })}
                                                    className="w-full h-1 bg-stone-200 rounded appearance-none cursor-pointer accent-[#A67B5B]"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-bold text-stone-400">Padding ({design.frame?.padding || 20}px)</label>
                                            <input 
                                                type="range" min="0" max="100" 
                                                value={design.frame?.padding || 20}
                                                onChange={(e) => updateDesign('frame', { ...(design.frame || {}), padding: parseInt(e.target.value) })}
                                                className="w-full h-1 bg-stone-200 rounded appearance-none cursor-pointer accent-[#A67B5B]"
                                            />
                                        </div>
                                    </div>
                                )}

                                <label className="flex items-center justify-between p-3 border border-stone-200 rounded-lg cursor-pointer hover:bg-stone-50">
                                    <span className="text-sm font-medium text-stone-700">Show Overall Outline</span>
                                    <input 
                                        type="checkbox"
                                        checked={design.showOuterOutline}
                                        onChange={(e) => updateDesign('showOuterOutline', e.target.checked)}
                                        className="rounded text-[#A67B5B] focus:ring-[#A67B5B]"
                                    />
                                </label>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium text-stone-700">Overlay Opacity</span>
                                    <span className="text-stone-500">{design.overlayOpacity}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" max="90" 
                                    value={design.overlayOpacity}
                                    onChange={(e) => updateDesign('overlayOpacity', parseInt(e.target.value))}
                                    className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#A67B5B]"
                                />
                            </div>

                            <label className="flex items-center justify-between p-3 border border-stone-200 rounded-lg cursor-pointer hover:bg-stone-50">
                                <span className="text-sm font-medium text-stone-700">Show Illustrations</span>
                                <input 
                                    type="checkbox"
                                    checked={design.showIllustrations}
                                    onChange={(e) => updateDesign('showIllustrations', e.target.checked)}
                                    className="rounded text-[#A67B5B] focus:ring-[#A67B5B]"
                                />
                            </label>

                            <div className="pt-4 border-t border-stone-100 space-y-2">
                                <label className="flex items-center justify-between p-3 border border-stone-200 rounded-lg cursor-pointer hover:bg-stone-50">
                                    <span className="text-sm font-medium text-stone-700">Show Grid</span>
                                    <input 
                                        type="checkbox"
                                        checked={design.showGrid}
                                        onChange={(e) => updateDesign('showGrid', e.target.checked)}
                                        className="rounded text-[#A67B5B] focus:ring-[#A67B5B]"
                                    />
                                </label>
                                <label className="flex items-center justify-between p-3 border border-stone-200 rounded-lg cursor-pointer hover:bg-stone-50">
                                    <span className="text-sm font-medium text-stone-700">Snap to Grid</span>
                                    <input 
                                        type="checkbox"
                                        checked={design.snapToGrid}
                                        onChange={(e) => updateDesign('snapToGrid', e.target.checked)}
                                        className="rounded text-[#A67B5B] focus:ring-[#A67B5B]"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            </div>

            </div>

        {/* Live Preview Area */}
        <div className="flex-1 bg-stone-100 rounded-2xl border-2 border-dashed border-stone-200 flex items-center justify-center p-3 overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />
            
            <InvitationCanvas 
                design={design} 
                onUpdateDesign={handleDesignUpdate} 
                selectedId={selectedItemId}
                onSelectExclusively={setSelectedItemId}
                mode="edit" 
                guest={dummyGuest}
                showGrid={design.showGrid}
                snapToGrid={design.snapToGrid}
                weddingSettings={settings}
            />

            {/* Floating Workspace Controls (Undo/Redo & Design Type) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-stone-200 p-1.5 z-50">
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
  );
}
