import { useState } from 'react';
import { Shirt } from 'lucide-react';
import { WEDDING_PALETTE, PALETTE_COMBINATIONS, colorVariations } from '../utils/weddingPalette';

// Guest-facing dress code: the wedding colours, lighter/darker variations of
// each, and outfit combinations that work well together.
export default function DressCodePalette() {
  const [selectedId, setSelectedId] = useState(WEDDING_PALETTE[0].id);
  const selected = WEDDING_PALETTE.find(c => c.id === selectedId);

  return (
    <section className="rounded-2xl border border-palette-light-brown/50 bg-white shadow-sm overflow-hidden">
      <div className="p-5 pb-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-palette-cream text-palette-cinnamon flex items-center justify-center shrink-0">
          <Shirt className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-serif text-xl text-palette-cinnamon!">Dress Code Palette</h3>
          <p className="text-sm text-stone-500">We'd love you to dress in our wedding colours. Tap a colour to see lighter and darker shades.</p>
        </div>
      </div>

      <div className="px-5 grid grid-cols-4 sm:grid-cols-7 gap-3">
        {WEDDING_PALETTE.map(color => (
          <button
            key={color.id}
            type="button"
            onClick={() => setSelectedId(color.id)}
            aria-pressed={selectedId === color.id}
            className="flex flex-col items-center gap-1.5 group"
          >
            <span
              className={`w-11 h-11 rounded-full border border-black/10 transition-transform group-hover:scale-110 ${selectedId === color.id ? 'ring-2 ring-offset-2 ring-palette-forest' : ''}`}
              style={{ backgroundColor: color.hex }}
            />
            <span className="text-[10px] leading-tight text-center text-stone-600">{color.name}</span>
          </button>
        ))}
      </div>

      <div className="mx-5 mt-4 p-3 rounded-xl bg-stone-50">
        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">{selected.name} shades</p>
        <div className="grid grid-cols-8 gap-1">
          {colorVariations(selected.hex).map(v => (
            <span
              key={v.step}
              title={v.hex}
              className={`h-8 rounded-md border border-black/5 ${v.step === 500 ? 'ring-2 ring-palette-forest ring-offset-1' : ''}`}
              style={{ backgroundColor: v.hex }}
            />
          ))}
        </div>
      </div>

      <div className="p-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">Combinations we love</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PALETTE_COMBINATIONS.map(combo => (
            <div key={combo.id} className="flex items-center gap-2 p-2 rounded-xl border border-stone-100" title={combo.description}>
              <span className="flex -space-x-2 shrink-0">
                {[combo.background, combo.accent, combo.text].filter((c, i, a) => a.indexOf(c) === i).map(c => (
                  <span key={c} className="w-6 h-6 rounded-full border-2 border-white" style={{ backgroundColor: c }} />
                ))}
              </span>
              <span className="text-xs font-medium text-stone-700 leading-tight">{combo.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
