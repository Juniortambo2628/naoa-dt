/**
 * Wedding colour palette, sampled from the couple's "Pallete" colour-scheme
 * board (median of each swatch). These are the secondary colours used across
 * the guest invitation and offered in the Invitation Designer.
 */
export const WEDDING_PALETTE = [
  { id: 'cinnamon', name: 'Cinnamon Stick Brown', hex: '#9B4621' },
  { id: 'forest', name: 'Forest Green', hex: '#304B3C' },
  { id: 'rust', name: 'Rust', hex: '#B6400E' },
  { id: 'olive', name: 'Olive Green', hex: '#788269' },
  { id: 'burnt-orange', name: 'Burnt Orange', hex: '#BB492E' },
  { id: 'light-brown', name: 'Light Brown', hex: '#DDBAA4' },
  { id: 'cream', name: 'Cream / Ivory', hex: '#FCEDDA' },
];

const toRgb = (hex) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
};
const toHex = (rgb) => '#' + rgb.map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const mix = (hex, target, amount) => {
  const a = toRgb(hex);
  const b = toRgb(target);
  return toHex(a.map((v, i) => v + (b[i] - v) * amount));
};

/**
 * Tints and shades of a colour, light to dark. The base colour sits in the
 * middle (step 500), so the original palette value is always one of the options.
 */
export function colorVariations(hex) {
  return [
    { step: 100, hex: mix(hex, '#FFFFFF', 0.8) },
    { step: 200, hex: mix(hex, '#FFFFFF', 0.6) },
    { step: 300, hex: mix(hex, '#FFFFFF', 0.4) },
    { step: 400, hex: mix(hex, '#FFFFFF', 0.2) },
    { step: 500, hex: hex.toUpperCase() },
    { step: 600, hex: mix(hex, '#000000', 0.15) },
    { step: 700, hex: mix(hex, '#000000', 0.3) },
    { step: 800, hex: mix(hex, '#000000', 0.45) },
  ];
}

/** WCAG relative-luminance contrast ratio between two hex colours. */
export function contrastRatio(a, b) {
  const lum = (hex) => {
    const [r, g, bl] = toRgb(hex).map(v => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const P = Object.fromEntries(WEDDING_PALETTE.map(c => [c.id, c.hex]));

/**
 * Suggested combinations. `background` is the card colour, `accent` drives the
 * design's accent colour (frames, highlights), and `text` is the readable body
 * colour on that background. Every pair is checked for legibility in tests.
 */
export const PALETTE_COMBINATIONS = [
  {
    id: 'harvest-classic',
    name: 'Harvest Classic',
    description: 'Warm cream card with cinnamon text and a forest green accent.',
    background: P.cream, accent: P.forest, text: P.cinnamon,
  },
  {
    id: 'forest-evening',
    name: 'Forest Evening',
    description: 'Deep forest green card with cream lettering and light brown details.',
    background: P.forest, accent: P['light-brown'], text: P.cream,
  },
  {
    id: 'autumn-glow',
    name: 'Autumn Glow',
    description: 'Cream card with rust highlights — bright and celebratory.',
    background: P.cream, accent: P.rust, text: P.forest,
  },
  {
    id: 'sage-garden',
    name: 'Sage Garden',
    description: 'Soft light-brown card, olive accents and forest green text.',
    background: P['light-brown'], accent: P.olive, text: P.forest,
  },
  {
    id: 'spice-market',
    name: 'Spice Market',
    description: 'Rich cinnamon card with cream text and burnt orange flourishes.',
    background: P.cinnamon, accent: P.cream, text: P.cream,
  },
  {
    id: 'terracotta-ivory',
    name: 'Terracotta & Ivory',
    description: 'Ivory card with burnt orange accents and forest green text.',
    background: P.cream, accent: P['burnt-orange'], text: P.forest,
  },
];
