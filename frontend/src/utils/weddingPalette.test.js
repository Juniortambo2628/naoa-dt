import { describe, it, expect } from 'vitest';
import { WEDDING_PALETTE, colorVariations, contrastRatio, PALETTE_COMBINATIONS } from './weddingPalette';

describe('weddingPalette', () => {
  it('keeps the sampled palette codes exactly', () => {
    expect(WEDDING_PALETTE.map(c => c.hex)).toEqual([
      '#9B4621', '#304B3C', '#B6400E', '#788269', '#BB492E', '#DDBAA4', '#FCEDDA',
    ]);
  });

  it('includes the base colour in its variations, ordered light to dark', () => {
    const v = colorVariations('#304B3C');
    expect(v.find(x => x.step === 500).hex).toBe('#304B3C');
    expect(v).toHaveLength(8);
    expect(contrastRatio(v[0].hex, '#000000')).toBeGreaterThan(contrastRatio(v[7].hex, '#000000'));
  });

  it('gives every suggested combination readable text (WCAG AA, 4.5:1)', () => {
    for (const c of PALETTE_COMBINATIONS) {
      expect(contrastRatio(c.text, c.background), c.name).toBeGreaterThanOrEqual(4.5);
    }
  });
});
