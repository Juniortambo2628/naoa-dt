/**
 * The cards the designer makes, and the setting each one is saved under.
 * The thank-you card is shown (and downloadable) on every guest's page once
 * the wedding is over.
 */
export const DESIGN_TYPES = [
  { value: 'invitation', label: 'Invitation', key: 'invitation_theme' },
  { value: 'save_the_date', label: 'Save the Date', key: 'save_the_date_theme' },
  { value: 'thank_you', label: 'Thank-you card', key: 'thank_you_theme' },
];

export const themeKeyFor = (designType) => (DESIGN_TYPES.find((t) => t.value === designType) || DESIGN_TYPES[0]).key;

const IVORY = '#FBF3EA';

/**
 * A starting thank-you card: the bride's Africa, "Thank you" set inside it,
 * then the guest's own note ({{message}}, from Guests → Personal message)
 * and the couple's names.
 */
export function thankYouStarter({ coupleNames = 'Dinah & Tze Ren', dateText = '14 · 11 · 2026' } = {}) {
  const words = {
    title: 'Thank you',
    message: 'Your presence made this moment even more beautiful and meaningful.',
    ty_date: dateText,
    ty_note: 'Dear {{name}},<br/>{{message}}',
    ty_names: coupleNames,
  };
  return {
    backgroundColor: '#FBF8F3',
    accentColor: '#B4532A',
    orientation: 'portrait',
    content: { en: words, zh: words, ms: words, luo: words },
    items: [
      { id: 'ty_map', type: 'image', src: '/illustrations/africa-map.png', x: 75, y: 26, width: 350, height: 376, zIndex: 5 },
      { id: 'ty_date', type: 'text', textKey: 'ty_date', x: 141, y: 94, width: 190, height: 20, fontStyle: 'serif', fontSize: 12, letterSpacing: 3, color: IVORY, zIndex: 50 },
      { id: 'title_1', type: 'text', textKey: 'title', x: 141, y: 114, width: 190, height: 56, fontStyle: 'cursive', fontSize: 44, color: IVORY, zIndex: 50 },
      { id: 'message_1', type: 'text', textKey: 'message', x: 218, y: 182, width: 140, height: 52, fontStyle: 'sans', fontSize: 9.5, color: IVORY, zIndex: 50 },
      { id: 'ty_note', type: 'text', textKey: 'ty_note', x: 50, y: 420, width: 400, height: 120, fontStyle: 'serif', fontSize: 16, color: '#4A3F35', zIndex: 40 },
      { id: 'ty_names', type: 'text', textKey: 'ty_names', x: 50, y: 545, width: 400, height: 56, fontStyle: 'cursive', fontSize: 38, color: '#A67B5B', zIndex: 40 },
    ],
  };
}
