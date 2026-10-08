import { describe, it, expect } from 'vitest';
import { renderWhatsAppMessage, DEFAULT_WHATSAPP_TEMPLATE } from './whatsappMessage';

describe('renderWhatsAppMessage', () => {
  const values = { name: 'Peres', invite_link: 'https://x/invitation/ABC', code: 'ABC', couple: 'D & T' };

  it('fills placeholders in a custom template', () => {
    expect(renderWhatsAppMessage('Hi {name}, code {code}: {invite_link} — {couple}', values))
      .toBe('Hi Peres, code ABC: https://x/invitation/ABC — D & T');
  });

  it('drops {pdf_link} lines when there is no PDF link', () => {
    const msg = renderWhatsAppMessage(DEFAULT_WHATSAPP_TEMPLATE, values);
    expect(msg).not.toContain('PDF');
    expect(msg).not.toMatch(/\n{3,}/);
    expect(msg).toContain('https://x/invitation/ABC');
  });

  it('keeps the PDF line when a link is given', () => {
    expect(renderWhatsAppMessage(DEFAULT_WHATSAPP_TEMPLATE, { ...values, pdf_link: 'https://x/a.pdf' }))
      .toContain('Your invitation card (PDF): https://x/a.pdf');
  });

  it('falls back to the default for an empty template', () => {
    expect(renderWhatsAppMessage('  ', values)).toContain('Hi *Peres*!');
  });
});
