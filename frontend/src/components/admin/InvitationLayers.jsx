import { useEffect, useState } from 'react';
import { Reorder } from 'framer-motion';
import { FileText, FileImage, SquareDashedMousePointer, MapPin, Calendar, Move, GripVertical, Lock, Unlock, X } from 'lucide-react';
import Button from '../Button';
import { byLayerTopFirst } from '../../utils/invitationItems';

const TYPE_ICONS = { text: FileText, image: FileImage, frame: SquareDashedMousePointer, venue_location: MapPin, calendar_link: Calendar };

function layerName(item, index) {
  if (item.type === 'text') return item.textKey === 'title' ? 'Main Title' : item.textKey === 'message' ? 'Message Text' : 'Custom Text';
  return {
    rsvp_code: 'RSVP Code', frame: 'Interactive Frame', calendar_link: 'Save the Date', venue_location: 'Venue Location',
  }[item.type] || `Image ${index + 1}`;
}

/**
 * Layers panel: top layer first. Drag to restack (one undo step per drop),
 * click to select (Shift adds), lock/unlock, delete.
 */
export default function InvitationLayers({ items, selectedIds, onSelect, onReorder, onToggleLock, onDelete }) {
  const sorted = byLayerTopFirst(items);
  const [order, setOrder] = useState(sorted.map((i) => i.id));
  const itemKey = sorted.map((i) => `${i.id}:${i.zIndex}`).join('|');

  // Follow outside changes (undo, add, delete) when not mid-drag.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- itemKey summarises `sorted`
  useEffect(() => setOrder(sorted.map((i) => i.id)), [itemKey]);

  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  return (
    <Reorder.Group axis="y" values={order} onReorder={setOrder} className="space-y-2 max-h-[500px] overflow-y-auto pr-1" aria-label="Layers, top first">
      {order.filter((id) => byId[id]).map((id, index) => {
        const item = byId[id];
        const Icon = TYPE_ICONS[item.type] || Move;
        const selected = selectedIds.includes(id);
        const name = layerName(item, index);
        return (
          <Reorder.Item
            key={id}
            value={id}
            onDragEnd={() => onReorder(order)}
            className={`group flex items-center gap-2 p-2 bg-white border rounded-xl transition-colors ${selected ? 'border-[#A67B5B] ring-1 ring-[#A67B5B] shadow-sm' : 'border-stone-100 hover:border-stone-200'}`}
          >
            <GripVertical className="w-4 h-4 text-stone-300 cursor-grab active:cursor-grabbing shrink-0" aria-hidden="true" />
            <button
              type="button"
              onClick={(e) => onSelect(id, { additive: e.shiftKey || e.metaKey || e.ctrlKey })}
              className="flex-1 min-w-0 flex items-center gap-2 text-left"
              aria-pressed={selected}
            >
              <span className="p-1.5 bg-stone-50 rounded-lg text-stone-500 group-hover:text-[#A67B5B]"><Icon className="w-4 h-4" /></span>
              <span className={`text-xs font-bold truncate ${item.locked ? 'text-stone-500' : 'text-stone-700'}`}>{name}</span>
            </button>
            <Button edit
              size="icon-sm"
              icon={item.locked ? Lock : Unlock}
              onClick={() => onToggleLock(item)}
              className={item.locked ? '' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'}
              aria-label={item.locked ? `Unlock ${name}` : `Lock ${name}`}
              title={item.locked ? 'Unlock' : 'Lock position'}
            />
            <Button edit
              size="icon-sm"
              variant="danger"
              icon={X}
              onClick={() => onDelete(id)}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label={`Delete ${name}`}
            />
          </Reorder.Item>
        );
      })}
    </Reorder.Group>
  );
}
