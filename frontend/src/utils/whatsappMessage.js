/**
 * WhatsApp invitation message, configurable in Admin → Settings
 * (setting key `whatsapp_message_template`).
 *
 * Placeholders: {name} {invite_link} {pdf_link} {code} {couple}
 * Lines containing {pdf_link} are dropped when no PDF link is available
 * (e.g. when the PDF is attached by hand instead of linked).
 */
export const WHATSAPP_PLACEHOLDERS = [
  { key: '{name}', label: "Guest's name" },
  { key: '{invite_link}', label: 'Personal invitation & RSVP link' },
  { key: '{pdf_link}', label: 'Link to their PDF card (when available)' },
  { key: '{code}', label: 'RSVP code' },
  { key: '{couple}', label: 'Couple names' },
];

export const DEFAULT_WHATSAPP_TEMPLATE = `Hi *{name}*! 💌

We are so excited to invite you to our wedding!

Your invitation card (PDF): {pdf_link}

You can view your personalized digital invitation and RSVP here:
{invite_link}

We can't wait to celebrate with you!
— {couple}`;

export function renderWhatsAppMessage(template, values = {}) {
  const tpl = template && template.trim() ? template : DEFAULT_WHATSAPP_TEMPLATE;
  const lines = values.pdf_link ? tpl.split('\n') : tpl.split('\n').filter(l => !l.includes('{pdf_link}'));

  return lines
    .join('\n')
    .replace(/\{(name|invite_link|pdf_link|code|couple)\}/g, (_, k) => values[k] ?? '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
