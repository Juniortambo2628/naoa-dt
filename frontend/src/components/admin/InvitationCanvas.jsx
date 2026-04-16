import { useState, useRef, useEffect, useMemo } from 'react';
import Moveable from 'react-moveable';
import { getAssetUrl } from '../../services/api';

export default function InvitationCanvas({ 
  design, 
  onUpdateDesign, 
  selectedId, 
  onSelectExclusively, 
  mode = 'edit', 
  guest = null, 
  showGrid = false, 
  snapToGrid = false,
  isExport = false,
  weddingSettings = null
}) {
  const containerRef = useRef(null);
  const [target, setTarget] = useState(null);

  const isLandscape = design.orientation === 'landscape';
  const CANVAS_WIDTH = isLandscape ? 625 : 500;
  const CANVAS_HEIGHT = isLandscape ? 500 : 625;

  // Update target when selectedId changes
  useEffect(() => {
        if (!selectedId) {
            setTarget(null);
            return;
        }
        // Small timeout to allow DOM to update if item was just added
        setTimeout(() => {
            const el = document.getElementById(`item-${selectedId}`);
            setTarget(el);
        }, 0);
  }, [selectedId, design.items]);

  const containerStyle = {
    backgroundColor: design.backgroundColor || '#ffffff',
    position: 'relative',
    overflow: 'hidden',
  };

  const fonts = {
      cursive: "'Great Vibes', cursive",
      serif: "'Cormorant Garamond', serif",
      sans: "'Montserrat', sans-serif"
  };

  const resolveText = (text) => {
    if (!text) return { __html: '' };
    if (mode === 'edit') return { __html: text };
    if (!guest) return { __html: text }; 
    
    try {
        const resolved = text
          .replace(/\{\{name\}\}/g, `<strong style="font-weight: 800;">${guest.name || 'Guest'}</strong>`)
          .replace(/\{\{code\}\}/g, guest.unique_code || '')
          .replace(/\{\{table\}\}/g, guest.table?.name || 'Table');
        return { __html: resolved };
    } catch (e) {
        console.error("Text resolution failed", e);
        return { __html: text };
    }
  };

  const currentLangCode = design.editorLang || 'en';
  const content = design.content?.[currentLangCode] || {};
  
  // Collect all element refs for snapping guidelines
  const elementGuidelines = useMemo(() => {
      return design.items.map(i => document.querySelector(`#item-${i.id}`)).filter(Boolean);
  }, [design.items]);

  const renderItemContent = (item) => {
      if (item.type === 'image') {
        return (
          <img 
              src={getAssetUrl(item.src)} 
              alt="" 
              className="w-full h-full object-cover pointer-events-none" 
              crossOrigin="anonymous" 
              onError={(e) => { e.target.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; }}
          />
        );
      } else if (item.type === 'rsvp_code') {
          return (
              <div 
                className="w-full h-full flex flex-col items-center justify-center p-2 border-2 border-dashed border-stone-300 bg-white/80 backdrop-blur-sm gap-1"
                style={{ color: item.color || '#78716c' }}
              >
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'inherit', lineHeight: 1, whiteSpace: 'nowrap' }}>RSVP Code</span>
                  <span className="sans-font" style={{ fontFamily: fonts.sans, fontSize: `${(item.fontSize || 18)}px`, fontWeight: 'bold', letterSpacing: '0.2em', lineHeight: 1, marginTop: '4px', textTransform: 'uppercase', whiteSpace: 'nowrap', color: 'inherit' }}>{guest?.unique_code || 'LOVE2026'}</span>
              </div>
          );
      } else if (item.type === 'calendar_link') {
          // Robust date handling to avoid timezone shifts
          let weddingDate = weddingSettings?.wedding_date || '2026-11-14';
          const dateObj = new Date(weddingDate);
          
          // If we have a YYYY-MM-DD string, let's use it directly to avoid UTC issues
          const formattedDate = dateObj.toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric',
              timeZone: 'UTC' // Forces UTC interpretation if the string was YYYY-MM-DD
          });

          return (
              <div className="w-full h-full px-4 py-2 text-center overflow-hidden flex flex-col justify-center">
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: item.color || '#A67B5B', fontWeight: 'bold', whiteSpace: 'nowrap', display: 'block', margin: '2px 0', lineHeight: 1 }}>Save the Date</span>
                  <span style={{ fontSize: `${(item.fontSize || 11)}px`, fontFamily: 'serif', fontWeight: 'bold', color: '#292524', whiteSpace: 'nowrap', display: 'block', margin: '4px 0', lineHeight: 1.2 }}>{formattedDate}</span>
                  <span style={{ fontSize: '10px', color: '#737373', textTransform: 'uppercase', letterSpacing: '0.1em', borderTop: '1px solid #e7e5e4', display: 'block', margin: '4px 8px 0 8px', paddingTop: '6px', whiteSpace: 'nowrap', lineHeight: 1 }}>Add to Calendar</span>
              </div>
          );
      } else if (item.type === 'text') {
          const textValue = content[item.textKey] || (item.textKey === 'title' ? 'Wedding Invitation' : 'Please join us');
          const isCursive = item.fontStyle === 'cursive' || (!item.fontStyle && item.textKey === 'title');
          const verticalAlignMap = { top: 'flex-start', middle: 'center', bottom: 'flex-end' };

          return (
              <div 
                  className={isCursive ? 'cursive-font' : (item.fontStyle === 'sans' ? 'sans-font' : 'serif-font')}
                  style={{ 
                      fontFamily: fonts[item.fontStyle || (isCursive ? 'cursive' : 'serif')],
                      fontSize: `${item.fontSize || 16}px`,
                      letterSpacing: `${item.letterSpacing || 0}px`,
                      color: item.color || (item.textKey === 'title' ? design.accentColor : '#4b5563'),
                      lineHeight: 1.1,
                      wordBreak: 'break-word',
                      width: '100%',
                      height: '100%',
                      textAlign: item.textAlign || 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: verticalAlignMap[item.verticalAlign || 'middle'] || 'center',
                      padding: 0,
                      paddingLeft: `${item.paddingLeft || 0}px`,
                  }}
                  dangerouslySetInnerHTML={resolveText(textValue)}
              />
          );
      } else if (item.type === 'frame') {
          return (
              <div 
                  className="w-full h-full"
                  style={{ 
                      border: `${item.thickness || 1}px solid ${item.color || design.accentColor}`,
                      pointerEvents: 'none',
                      opacity: (item.opacity ?? 100) / 100
                  }} 
              />
          );
      }
      return null;
  };

  const frame = design.frame || { visible: design.showBorder, color: design.accentColor, thickness: 1, padding: 20 };

  const [scale, setScale] = useState(1);
  const outerRef = useRef(null);

  // Auto-scale canvas to fit available space
  useEffect(() => {
    if (isExport || !outerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const scaleX = width / CANVAS_WIDTH;
        const scaleY = height / CANVAS_HEIGHT;
        const newScale = Math.min(scaleX, scaleY, 1.2); // Cap at 1.2x to avoid over-scaling
        setScale(Math.max(newScale, 0.3));
      }
    });
    resizeObserver.observe(outerRef.current);
    return () => resizeObserver.disconnect();
  }, [isExport, CANVAS_WIDTH, CANVAS_HEIGHT]);

  return (
    <div 
        ref={outerRef}
        className={isExport ? `w-[${CANVAS_WIDTH}px] h-[${CANVAS_HEIGHT}px]` : 'w-full h-full flex items-center justify-center'} 
        style={{ padding: '0', display: isExport ? 'block' : 'flex' }}
    >
        <div 
            ref={containerRef}
            className={isExport ? `w-[${CANVAS_WIDTH}px] h-[${CANVAS_HEIGHT}px]` : `shadow-2xl ring-8 ring-stone-200/50 rounded-lg`}
            style={{
                ...containerStyle,
                width: `${CANVAS_WIDTH}px`,
                height: `${CANVAS_HEIGHT}px`,
                flexShrink: 0, 
                transform: isExport ? 'none' : `scale(${scale})`, 
                transformOrigin: 'center center',
                margin: 0,
                padding: 0
            }}
            onClick={(e) => {
               if (e.target === containerRef.current || e.target.classList.contains('absolute-bg')) {
                 if (mode === 'edit') onSelectExclusively?.(null);
               }
            }}
        >
            {/* Background Image Layer */}
            {design.bgImage && (
                <img 
                    src={getAssetUrl(design.bgImage)} 
                    alt="" 
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none absolute-bg" 
                    crossOrigin="anonymous"
                    onError={(e) => { e.target.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; }}
                />
            )}
            
            {/* Grid Overlay */}
            {showGrid && mode === 'edit' && (
                <div className="absolute inset-0 z-50 pointer-events-none opacity-20">
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-red-500" />
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500" />
                    <svg className="w-full h-full" width="100%" height="100%">
                        <defs>
                            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="black" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                </div>
            )}
            
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-white pointer-events-none" style={{ opacity: (design.overlayOpacity || 10) / 100, zIndex: 5 }} />

            {/* Elements */}
            <div className="absolute inset-0 z-10">
                {design.items?.map(item => (
                    <div
                        key={item.id}
                        id={`item-${item.id}`}
                        className={`absolute ${selectedId === item.id ? 'z-[999]' : ''}`}
                        style={{
                            width: item.width,
                            height: item.height,
                            transform: `translate(${item.x}px, ${item.y}px) rotate(${item.rotate || 0}deg)`,
                            zIndex: selectedId === item.id ? 999 : (item.zIndex || 10),
                            cursor: mode === 'edit' ? 'pointer' : 'default',
                            opacity: (item.type !== 'frame' ? (item.opacity ?? 100) / 100 : 1), // Frame has internal opacity
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (mode === 'edit') onSelectExclusively(item.id);
                        }}
                    >
                        {mode === 'edit' && selectedId === item.id && (
                            <div className="element-active-ring" style={{ '--accent-color': design.accentColor || '#A67B5B' }} />
                        )}
                        {renderItemContent(item)}
                    </div>
                ))}
            </div>

            {/* React Moveable Control - Only in Edit Mode */}
            {mode === 'edit' && target && (
                <Moveable
                    target={target}
                    container={containerRef.current}
                    draggable={true}
                    resizable={true}
                    rotatable={true}
                    snappable={true}
                    bounds={{ left: 0, top: 0, right: CANVAS_WIDTH, bottom: CANVAS_HEIGHT }}
                    snapDirections={{ top: true, left: true, bottom: true, right: true, center: true, middle: true }}
                    elementGuidelines={elementGuidelines}
                    snapGap={false}
                    isDisplaySnapDigit={true}
                    isDisplayInnerSnapDigit={true}
                    snapThreshold={10}
                    verticalGuidelines={[0, CANVAS_WIDTH / 2, CANVAS_WIDTH]}
                    horizontalGuidelines={[0, CANVAS_HEIGHT / 2, CANVAS_HEIGHT]}
                    
                    className="moveable-control-box"
                    
                    onDragStart={e => { e.target.style.cursor = 'grabbing'; }}
                    onDrag={e => { e.target.style.transform = e.transform; }}
                    onDragEnd={e => {
                         e.target.style.cursor = 'pointer';
                         const transform = e.target.style.transform;
                         const translateMatch = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(transform);
                         if (translateMatch) {
                             const x = parseFloat(translateMatch[1]);
                             const y = parseFloat(translateMatch[2]);
                             onUpdateDesign('update_item', { id: selectedId, x, y });
                         }
                    }}
                    
                    onResize={e => {
                        e.target.style.width = `${e.width}px`;
                        e.target.style.height = `${e.height}px`;
                        e.target.style.transform = e.drag.transform;
                    }}
                    onResizeEnd={e => {
                         const transform = e.target.style.transform;
                         const translateMatch = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(transform);
                         let updates = { width: e.lastEvent.width, height: e.lastEvent.height };
                         if (translateMatch) {
                             updates.x = parseFloat(translateMatch[1]);
                             updates.y = parseFloat(translateMatch[2]);
                         }
                         onUpdateDesign('update_item', { id: selectedId, ...updates });
                    }}
                    
                    onRotate={e => { e.target.style.transform = e.drag.transform; }}
                    onRotateEnd={e => {
                         const transform = e.target.style.transform;
                         const rotateMatch = /rotate\(([-\d.]+)deg\)/.exec(transform);
                         if (rotateMatch) {
                             onUpdateDesign('update_item', { id: selectedId, rotate: parseFloat(rotateMatch[1]) });
                         }
                    }}
                />
            )}

            {/* Frame & Decorations Layer */}
            <div className="absolute inset-0 z-40 pointer-events-none">
                {design.showIllustrations && (
                        <div className="absolute flex justify-center gap-6 py-2 opacity-80 z-20" style={{ top: isLandscape ? '210px' : '272px', left: '50%', transform: 'translateX(-50%)' }}>
                            <img src="/illustrations/male-icon.png" className="w-12 h-12 object-contain" style={{ filter: `drop-shadow(0 4px 6px ${design.accentColor}40)` }} crossOrigin="anonymous" />
                            <img src="/illustrations/female-icon.png" className="w-12 h-12 object-contain" style={{ filter: `drop-shadow(0 4px 6px ${design.accentColor}40)` }} crossOrigin="anonymous" />
                        </div>
                )}
                


                {/* Outer Outline (requested in screenshot 2) */}
                {design.showOuterOutline && (
                    <div 
                        className="absolute inset-[2px] pointer-events-none border-2" 
                        style={{ borderColor: design.accentColor || '#A67B5B' }}
                    />
                )}
            </div>
        </div>
    </div>
  );
}
