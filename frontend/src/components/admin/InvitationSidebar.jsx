import { motion } from 'framer-motion';
import {
  Move, Calendar, MapPin, AlignLeft, SquareDashedMousePointer,
  FileText, FileImage, X, ChevronUp, ChevronDown, ArrowUp, ArrowDown,
  User, Hash, Table as TableIcon, Trash2, Plus,
  AlignCenter, AlignRight, AlignJustify, ArrowUpToLine, ArrowDownToLine,
  AlertCircle, Sliders,
} from 'lucide-react';
import ImageUpload from './ImageUpload';
import { Skeleton } from '../Skeleton';

export default function InvitationSidebar({
  loading,
  activeTab,
  setActiveTab,
  design,
  editorLang,
  setEditorLang,
  selectedItemId,
  setSelectedItemId,
  updateDesign,
  handleDesignUpdate,
  addItem,
  deleteItem,
  updateContent,
  insertPlaceholder,
  titleRef,
  messageRef,
  languages,
  presetBackgrounds,
  presetColors,
  fonts,
}) {
  return (
    <div className="w-96 bg-white rounded-2xl shadow-sm border border-stone-100 flex flex-col overflow-hidden">
      {loading ? (
        <div className="p-6 space-y-6">
          <Skeleton variant="text" width="100%" height="40px" className="rounded-xl" />
          <Skeleton variant="image" width="100%" height="200px" className="rounded-xl" />
          <Skeleton variant="image" width="100%" height="150px" className="rounded-xl" />
        </div>
      ) : (
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
                    {design.items.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0)).map((item) => {
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

                    {(design.frame?.visible || design.showBorder) && (
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-stone-400">Overlay Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={design.overlayColor || '#ffffff'}
                          onChange={(e) => updateDesign('overlayColor', e.target.value)}
                          className="w-8 h-8 rounded border-0 p-0 cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-stone-500">{design.overlayColor || '#ffffff'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-stone-400">Overlay Type</label>
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={design.overlayGradient || false}
                          onChange={(e) => updateDesign('overlayGradient', e.target.checked)}
                          className="rounded text-[#A67B5B] focus:ring-[#A67B5B]"
                        />
                        <span className="text-xs font-medium text-stone-600">Use Gradient</span>
                      </label>
                    </div>
                  </div>

                  {/* Gradient Configuration Popup */}
                  {design.overlayGradient && (
                    <div className="space-y-4 p-4 bg-stone-50 border border-stone-200 rounded-xl animate-in fade-in slide-in-from-top-2">
                      <h4 className="text-[10px] uppercase font-bold text-[#A67B5B] tracking-wider">Gradient Configuration</h4>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Start Color */}
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-bold text-stone-400">Start Color</label>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={design.overlayGradientStartColor || '#ffffff'}
                                onChange={(e) => updateDesign('overlayGradientStartColor', e.target.value)}
                                className={`w-8 h-8 rounded border-0 p-0 ${design.overlayGradientStartTransparent !== false ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                disabled={design.overlayGradientStartTransparent !== false}
                              />
                              <span className="text-[10px] font-mono text-stone-500">{design.overlayGradientStartTransparent !== false ? 'Transparent' : (design.overlayGradientStartColor || '#ffffff')}</span>
                            </div>
                            <label className="flex items-center gap-1 text-[10px] text-stone-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={design.overlayGradientStartTransparent !== false}
                                onChange={(e) => updateDesign('overlayGradientStartTransparent', e.target.checked)}
                                className="rounded text-[#A67B5B]"
                              />
                              Make Transparent
                            </label>
                          </div>
                        </div>

                        {/* End Color */}
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-bold text-stone-400">End Color</label>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={design.overlayGradientEndColor || design.overlayColor || '#ffffff'}
                                onChange={(e) => updateDesign('overlayGradientEndColor', e.target.value)}
                                className={`w-8 h-8 rounded border-0 p-0 ${design.overlayGradientEndTransparent ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                disabled={design.overlayGradientEndTransparent}
                              />
                              <span className="text-[10px] font-mono text-stone-500">{design.overlayGradientEndTransparent ? 'Transparent' : (design.overlayGradientEndColor || design.overlayColor || '#ffffff')}</span>
                            </div>
                            <label className="flex items-center gap-1 text-[10px] text-stone-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={design.overlayGradientEndTransparent || false}
                                onChange={(e) => updateDesign('overlayGradientEndTransparent', e.target.checked)}
                                className="rounded text-[#A67B5B]"
                              />
                              Make Transparent
                            </label>
                          </div>
                        </div>

                        {/* Direction */}
                        <div className="col-span-2 space-y-2 mt-2">
                          <label className="text-[10px] uppercase font-bold text-stone-400">Direction</label>
                          <select
                            value={design.overlayGradientDirection || 'to bottom'}
                            onChange={(e) => updateDesign('overlayGradientDirection', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm text-stone-600 focus:outline-none focus:ring-1 focus:ring-[#A67B5B]"
                          >
                            <option value="to bottom">Top to Bottom</option>
                            <option value="to top">Bottom to Top</option>
                            <option value="to right">Left to Right</option>
                            <option value="to left">Right to Left</option>
                            <option value="circle at center">Radial Center</option>
                          </select>
                        </div>

                        {/* Start Position */}
                        <div className="col-span-2 space-y-2 mt-2">
                          <div className="flex justify-between text-[10px] text-stone-400 uppercase font-bold">
                            <span>Start Position</span>
                            <span>{design.overlayGradientStartPos ?? 0}%</span>
                          </div>
                          <input
                            type="range" min="0" max="100"
                            value={design.overlayGradientStartPos ?? 0}
                            onChange={(e) => updateDesign('overlayGradientStartPos', parseInt(e.target.value))}
                            className="w-full h-1 bg-stone-200 rounded appearance-none cursor-pointer accent-[#A67B5B]"
                          />
                        </div>

                        {/* End Position */}
                        <div className="col-span-2 space-y-2 mt-2">
                          <div className="flex justify-between text-[10px] text-stone-400 uppercase font-bold">
                            <span>End Position</span>
                            <span>{design.overlayGradientEndPos ?? 100}%</span>
                          </div>
                          <input
                            type="range" min="0" max="100"
                            value={design.overlayGradientEndPos ?? 100}
                            onChange={(e) => updateDesign('overlayGradientEndPos', parseInt(e.target.value))}
                            className="w-full h-1 bg-stone-200 rounded appearance-none cursor-pointer accent-[#A67B5B]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

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
      )}
    </div>
  );
}
