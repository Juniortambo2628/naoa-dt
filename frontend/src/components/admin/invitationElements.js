import { Move, Calendar, MapPin, AlignLeft, SquareDashedMousePointer } from 'lucide-react';

/** Elements that can be added to an invitation page (sidebar, toolbar, right-click menu). */
export const ELEMENT_KINDS = [
  { id: 'text_line', label: 'Text Line', icon: AlignLeft },
  { id: 'rsvp_code', label: 'RSVP Code', icon: Move },
  { id: 'calendar_link', label: 'Save the Date', icon: Calendar },
  { id: 'venue_location', label: 'Location', icon: MapPin },
  { id: 'frame', label: 'Interactive Frame', icon: SquareDashedMousePointer },
];

/**
 * Item to insert for an element kind, plus the default text for text lines.
 * @returns {{ type: string, extra: object, text?: string }}
 */
export function elementPreset(kind, design) {
  const landscape = design.orientation === 'landscape';
  switch (kind) {
    case 'text_line': {
      const id = `final_${Date.now()}`;
      return {
        type: 'text',
        extra: { id, textKey: id, width: 300, height: 40, fontStyle: 'serif', fontSize: 16, x: 100, y: 450, italic: true },
        text: 'invite to follow',
      };
    }
    case 'rsvp_code':
      return { type: 'rsvp_code', extra: { width: 120, height: 60 } };
    case 'calendar_link':
      return { type: 'calendar_link', extra: { width: 140, height: 70 } };
    case 'venue_location':
      return { type: 'venue_location', extra: { width: 220, height: 72, x: 140, y: 250 } };
    case 'frame':
      return {
        type: 'frame',
        extra: {
          width: landscape ? 585 : 460,
          height: landscape ? 460 : 585,
          x: 20,
          y: 20,
          color: design.accentColor,
          thickness: 2,
        },
      };
    default:
      return null;
  }
}
