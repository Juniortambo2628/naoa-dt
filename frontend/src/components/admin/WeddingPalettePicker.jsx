import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { WEDDING_PALETTE, PALETTE_COMBINATIONS, colorVariations } from '../../utils/weddingPalette';

// Wedding palette for the Invitation Designer: pick a palette colour, expand it
// into tints/shades, or apply a suggested background + accent combination.
export default function WeddingPalettePicker({ accentColor, backgroundColor, onAccentChange, onApplyCombination }) {
  const [expandedId, setExpandedId] = useState(null);
  const expanded = WEDDING_PALETTE.find(c => c.id === expandedId);
  const current = (accentColor || '').toUpperCase();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {WEDDING_PALETTE.map(color => {
            const isOpen = expandedId === color.id;
            return (
              <button
                key={color.id}
                type="button"
                title={`${color.name} ${color.hex} — click to use, click again for variations`}
                onClick={() => {
                  if (current === color.hex) setExpandedId(isOpen ? null : color.id);
                  else { onAccentChange(color.hex); setExpandedId(color.id); }
                }}
                className={`relative w-9 h-9 rounded-full border transition-all hover:scale-110 ${current === color.hex ? 'ring-2 ring-offset-2 ring-stone-700' : 'border-stone-200'}`}
                style={{ backgroundColor: color.hex }}
              >
                {isOpen && <ChevronDown className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-3 h-3 text-stone-500" />}
              </button>
            );
          })}
        </div>

        {expanded && (
          <div className="p-2 rounded-xl bg-stone-50 border border-stone-100">
            <p className="text-[10px] font-bold text-stone-500 mb-1.5">{expanded.name} variations</p>
            <div className="grid grid-cols-8 gap-1">
              {colorVariations(expanded.hex).map(v => (
                <button
                  key={v.step}
                  type="button"
                  title={v.hex}
                  onClick={() => onAccentChange(v.hex)}
                  className={`h-7 rounded-md border transition-transform hover:scale-110 ${current === v.hex ? 'ring-2 ring-stone-700' : 'border-black/5'} ${v.step === 500 ? 'outline outline-1 outline-offset-1 outline-stone-400' : ''}`}
                  style={{ backgroundColor: v.hex }}
                />
              ))}
            </div>
            <p className="text-[10px] font-mono text-stone-500 mt-1.5">{current}</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="text-[10px] uppercase font-bold text-stone-400 tracking-[0.2em]">Suggested combinations</h4>
        <div className="grid grid-cols-2 gap-2">
          {PALETTE_COMBINATIONS.map(combo => {
            const active = (backgroundColor || '').toUpperCase() === combo.background && current === combo.accent;
            return (
              <button
                key={combo.id}
                type="button"
                title={combo.description}
                onClick={() => onApplyCombination(combo)}
                className={`text-left rounded-xl overflow-hidden border transition-all hover:shadow-md ${active ? 'ring-2 ring-stone-700' : 'border-stone-200'}`}
              >
                <div className="h-12 p-2 flex items-end justify-between" style={{ backgroundColor: combo.background }}>
                  <span className="font-serif text-sm leading-none" style={{ color: combo.text }}>Aa</span>
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: combo.accent }} />
                </div>
                <p className="px-2 py-1 text-[10px] font-semibold text-stone-600 bg-white truncate">{combo.name}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
