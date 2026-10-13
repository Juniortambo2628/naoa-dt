import { useState, useRef, useEffect } from 'react';
import Moveable from 'react-moveable';
import { Lock } from 'lucide-react';
import { getAssetUrl } from '../../services/api';
import { getMapUrl, getCalendarUrl } from '../../utils/weddingInfo';
import { WEDDING_DEFAULTS } from '../../utils/weddingDefaults';

export default function InvitationCanvas({ 
  design, 
  onUpdateDesign, 
 selectedIds = [],
  onSelect, // (id | null, { additive }) — Shift-click adds to the selection
  zoom = 'fit', // 'fit' or a scale factor (edit mode)
  onFitScaleChange, 
  mode = 'edit', 
  guest = null, 
  showGrid = false, 
  _snapToGrid = false,
  isExport = false,
  weddingSettings = null,
  onItemContextMenu,
  onCanvasContextMenu,
}) {
  const containerRef = useRef(null);
  const [targets, setTargets] = useState([]);
  const [guidelines, setGuidelines] = useState([]);
  const isSelected = (id) => selectedIds.includes(id);
  const selectionKey = selectedIds.join(',');

  const isLandscape = design.orientation === 'landscape';
  const CANVAS_WIDTH = isLandscape ? 625 : 500;
  const CANVAS_HEIGHT = isLandscape ? 500 : 625;

  // Moveable targets: selected, unlocked elements. Snap guides: every other
  // element. Resolved after render so newly added elements exist in the DOM.
  useEffect(() => {
    const timer = setTimeout(() => {
      const element = (id) => document.getElementById(`item-${id}`);
      const locked = new Set(design.items.filter((i) => i.locked).map((i) => i.id));
      setTargets(selectedIds.filter((id) => !locked.has(id)).map(element).filter(Boolean));
      setGuidelines(design.items.filter((i) => !selectedIds.includes(i.id)).map((i) => element(i.id)).filter(Boolean));
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- selectionKey stands in for selectedIds
  }, [selectionKey, design.items]);

  // Read translate(x, y) back from an element's inline transform.
  const readTranslate = (el) => {
    const match = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(el.style.transform);
    return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : null;
  };
  const idOf = (el) => el.id.replace(/^item-/, '');

  const containerStyle = {
    backgroundColor: design.backgroundColor || 'transparent',
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
                className="w-full h-full flex flex-col items-center justify-center p-2 bg-transparent gap-1"
                style={{ color: item.color || '#78716c' }}
              >
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'inherit', lineHeight: 1, whiteSpace: 'nowrap' }}>RSVP Code</span>
                  <span className="sans-font" style={{ fontFamily: fonts.sans, fontSize: `${(item.fontSize || 18)}px`, fontWeight: 'bold', letterSpacing: '0.2em', lineHeight: 1, marginTop: '4px', textTransform: 'uppercase', whiteSpace: 'nowrap', color: 'inherit' }}>{guest?.unique_code || 'LOVE2026'}</span>
              </div>
          );
      } else if (item.type === 'calendar_link') {
          // Robust date handling to avoid timezone shifts. The configured value
          // may be a date ("YYYY-MM-DD") or datetime ("YYYY-MM-DDTHH:MM"); use
          // only the date part so UTC formatting never shifts the day.
          let weddingDate = (weddingSettings?.wedding_date || WEDDING_DEFAULTS.weddingDate).split('T')[0];
          const dateObj = new Date(weddingDate);
          
          // If we have a YYYY-MM-DD string, let's use it directly to avoid UTC issues
          const formattedDate = dateObj.toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric',
              timeZone: 'UTC' // Forces UTC interpretation if the string was YYYY-MM-DD
          });

          const calInner = (
              <div className="w-full h-full px-4 py-2 text-center overflow-hidden flex flex-col justify-center">
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: item.color || '#A67B5B', fontWeight: 'bold', whiteSpace: 'nowrap', display: 'block', margin: '2px 0', lineHeight: 1 }}>Save the Date</span>
                  <span style={{ fontSize: `${(item.fontSize || 11)}px`, fontFamily: 'serif', fontWeight: 'bold', color: '#292524', whiteSpace: 'nowrap', display: 'block', margin: '4px 0', lineHeight: 1.2 }}>{formattedDate}</span>
                  <span style={{ fontSize: '10px', color: '#737373', textTransform: 'uppercase', letterSpacing: '0.1em', borderTop: '1px solid #e7e5e4', display: 'block', margin: '4px 8px 0 8px', paddingTop: '6px', whiteSpace: 'nowrap', lineHeight: 1 }}>Add to Calendar</span>
              </div>
          );

          // In the public (view) mode the element is a real link that creates a
          // Google Calendar event from the shared config. In edit/preview it is
          // static (the PDF export adds a clickable link overlay separately).
          const calendarUrl = getCalendarUrl(weddingSettings || {}, { title: content.title || undefined });
          if (mode === 'view' && calendarUrl) {
              return (
                  <a href={calendarUrl} target="_blank" rel="noopener noreferrer" className="w-full h-full block no-underline" style={{ color: 'inherit', textDecoration: 'none' }}>
                      {calInner}
                  </a>
              );
          }
          return calInner;
      } else if (item.type === 'venue_location') {
          const venueName = weddingSettings?.venue_name || 'Our Venue';
          const venueAddress = weddingSettings?.venue_address || '';
          const mapUrl = getMapUrl(weddingSettings || {});
          const accent = item.color || design.accentColor || '#A67B5B';

          const inner = (
              <div className="w-full h-full px-3 py-2 text-center overflow-hidden flex flex-col items-center justify-center gap-0.5">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center', maxWidth: '100%' }}>
                      {/* Inline map-pin icon (reliable for html-to-image export) */}
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span style={{ fontSize: `${(item.fontSize || 15)}px`, fontFamily: 'serif', fontWeight: 'bold', color: '#292524', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{venueName}</span>
                  </div>
                  {venueAddress && (
                      <span style={{ fontSize: '10px', color: '#737373', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{venueAddress}</span>
                  )}
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.15em', color: accent, fontWeight: 'bold', marginTop: '2px', whiteSpace: 'nowrap' }}>View on Map</span>
              </div>
          );

          // In the public (view) mode the pin is a real link to the configured
          // coordinates. In edit/preview it is static (the PDF export adds a
          // clickable link overlay separately).
          if (mode === 'view' && mapUrl) {
              return (
                  <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="w-full h-full block no-underline" style={{ color: 'inherit', textDecoration: 'none' }}>
                      {inner}
                  </a>
              );
          }
          return inner;
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
        const newScale = Math.max(Math.min(scaleX, scaleY, 1.2), 0.3); // Cap at 1.2x to avoid over-scaling
        setScale(newScale);
        onFitScaleChange?.(newScale);
      }
    });
    resizeObserver.observe(outerRef.current);
    return () => resizeObserver.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- report-only callback
  }, [isExport, CANVAS_WIDTH, CANVAS_HEIGHT]);

  // Edit mode can zoom past "fit"; the canvas then scrolls inside its frame.
  const editing = mode === 'edit' && !isExport;
  const appliedScale = editing && zoom !== 'fit' ? zoom : scale;

  return (
    <div 
        ref={outerRef}
        className={isExport ? `w-[${CANVAS_WIDTH}px] h-[${CANVAS_HEIGHT}px]` : editing ? 'w-full h-full overflow-auto flex' : 'w-full h-full flex items-center justify-center'} 
        style={{ padding: '0', display: isExport ? 'block' : 'flex' }}
    >
      {/* In edit mode a sizer takes the scaled size so zoomed canvases scroll instead of clipping. */}
      <div style={editing ? { width: CANVAS_WIDTH * appliedScale, height: CANVAS_HEIGHT * appliedScale, margin: 'auto', flexShrink: 0 } : { display: 'contents' }}>
        <div 
            ref={containerRef}
            className={isExport ? `w-[${CANVAS_WIDTH}px] h-[${CANVAS_HEIGHT}px]` : `shadow-2xl ring-8 ring-stone-200/50 rounded-lg`}
            style={{
                ...containerStyle,
                width: `${CANVAS_WIDTH}px`,
                height: `${CANVAS_HEIGHT}px`,
                flexShrink: 0, 
                transform: isExport ? 'none' : `scale(${appliedScale})`, 
                transformOrigin: editing ? 'top left' : 'center center',
                margin: 0,
                padding: 0
            }}
            onClick={(e) => {
               if (e.target === containerRef.current || e.target.classList.contains('absolute-bg')) {
                 if (mode === 'edit') onSelect?.(null);
               }
            }}
            onContextMenu={(e) => {
               if (mode !== 'edit' || !onCanvasContextMenu) return;
               e.preventDefault();
               // The selection box (group drag area) sits above the elements:
               // a right-click on it is about the selection, not the page.
               const primary = design.items.find((i) => i.id === selectedIds[selectedIds.length - 1]);
               if (primary && onItemContextMenu && e.target.closest?.('.moveable-control-box')) {
                 onItemContextMenu(primary, { x: e.clientX, y: e.clientY });
                 return;
               }
               onSelect?.(null);
               onCanvasContextMenu({ x: e.clientX, y: e.clientY });
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
            <div 
                className="absolute inset-0 pointer-events-none" 
                style={{ 
                    opacity: (design.overlayOpacity ?? 10) / 100, 
                    zIndex: 5,
                    background: design.overlayGradient 
                        ? (() => {
                            const startColor = design.overlayGradientStartTransparent !== false ? 'transparent' : (design.overlayGradientStartColor || '#ffffff');
                            const endColor = design.overlayGradientEndTransparent ? 'transparent' : (design.overlayGradientEndColor || design.overlayColor || '#ffffff');
                            const direction = design.overlayGradientDirection || 'to bottom';
                            const startPos = design.overlayGradientStartPos ?? 0;
                            const endPos = design.overlayGradientEndPos ?? 100;
                            
                            if (direction.includes('circle')) {
                                return `radial-gradient(${direction}, ${startColor} ${startPos}%, ${endColor} ${endPos}%)`;
                            }
                            return `linear-gradient(${direction}, ${startColor} ${startPos}%, ${endColor} ${endPos}%)`;
                        })()
                        : (design.overlayColor || '#ffffff')
                }} 
            />

            {/* Elements */}
            <div className="absolute inset-0 z-10">
                {design.items?.map(item => (
                    <div
                        key={item.id}
                        id={`item-${item.id}`}
                        className={`absolute ${isSelected(item.id) ? 'z-[999]' : ''}`}
                        style={{
                            width: item.width,
                            height: item.height,
                            transform: `translate(${item.x}px, ${item.y}px) rotate(${item.rotate || 0}deg)`,
                            zIndex: isSelected(item.id) ? 999 : (item.zIndex || 10),
                            cursor: mode === 'edit' ? (item.locked ? 'not-allowed' : 'pointer') : 'default',
                            opacity: (item.type !== 'frame' ? (item.opacity ?? 100) / 100 : 1), // Frame has internal opacity
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (mode === 'edit') onSelect?.(item.id, { additive: e.shiftKey || e.metaKey || e.ctrlKey });
                        }}
                        onContextMenu={(e) => {
                            if (mode !== 'edit' || !onItemContextMenu) return;
                            e.preventDefault();
                            e.stopPropagation();
                            // Keep a multi-selection when right-clicking one of its members.
                            if (!isSelected(item.id)) onSelect?.(item.id);
                            onItemContextMenu(item, { x: e.clientX, y: e.clientY });
                        }}
                    >
                        {mode === 'edit' && isSelected(item.id) && (
                            <div className="element-active-ring" style={{ '--accent-color': design.accentColor || '#A67B5B' }} />
                        )}
                        {mode === 'edit' && item.locked && (
                            <span className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center" title="Locked — unlock from the right-click menu or Layers">
                                <Lock className="w-3 h-3 text-stone-600" aria-label="Locked" />
                            </span>
                        )}
                        {renderItemContent(item)}
                    </div>
                ))}
            </div>

            {/* React Moveable Control - Only in Edit Mode */}
            {mode === 'edit' && targets.length > 0 && (
                <Moveable
                    target={targets.length === 1 ? targets[0] : targets}
                    container={containerRef.current}
                    draggable={true}
                    resizable={targets.length === 1}
                    rotatable={targets.length === 1}
                    snappable={true}
                    bounds={{ left: 0, top: 0, right: CANVAS_WIDTH, bottom: CANVAS_HEIGHT }}
                    snapDirections={{ top: true, left: true, bottom: true, right: true, center: true, middle: true }}
                    elementGuidelines={guidelines}
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
                         const pos = readTranslate(e.target);
                         if (pos) onUpdateDesign('update_item', { id: idOf(e.target), ...pos });
                    }}
                    onDragGroup={e => { e.events.forEach(ev => { ev.target.style.transform = ev.transform; }); }}
                    onDragGroupEnd={e => {
                         const updates = e.targets.map(el => ({ id: idOf(el), ...readTranslate(el) })).filter(u => u.x !== undefined);
                         if (updates.length) onUpdateDesign('update_items', updates);
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
                         onUpdateDesign('update_item', { id: idOf(e.target), ...updates });
                    }}
                    
                    onRotate={e => { e.target.style.transform = e.drag.transform; }}
                    onRotateEnd={e => {
                         const transform = e.target.style.transform;
                         const rotateMatch = /rotate\(([-\d.]+)deg\)/.exec(transform);
                         if (rotateMatch) {
                             onUpdateDesign('update_item', { id: idOf(e.target), rotate: parseFloat(rotateMatch[1]) });
                         }
                    }}
                />
            )}

            {/* Frame & Decorations Layer */}
            <div className="absolute inset-0 z-40 pointer-events-none">
                {design.showIllustrations && (
                        <div className="absolute flex justify-center gap-6 py-2 opacity-80 z-20" style={{ top: isLandscape ? '210px' : '272px', left: '50%', transform: 'translateX(-50%)' }}>
                            <img src="/illustrations/male-icon.png" alt="" className="w-12 h-12 object-contain" style={{ filter: `drop-shadow(0 4px 6px ${design.accentColor}40)` }} crossOrigin="anonymous" />
                            <img src="/illustrations/female-icon.png" alt="" className="w-12 h-12 object-contain" style={{ filter: `drop-shadow(0 4px 6px ${design.accentColor}40)` }} crossOrigin="anonymous" />
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
    </div>
  );
}
