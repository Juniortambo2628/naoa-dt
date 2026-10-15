import { Trash2 } from 'lucide-react';
import Button from '../Button';

/**
 * DeleteButton — the icon-only delete action for admin list rows and cards.
 *
 * @param {function} onClick    - Click handler
 * @param {boolean}  processing - Whether this item is currently being processed
 * @param {string}   [title]    - Tooltip text
 */
export default function DeleteButton({ onClick, processing, title = 'Delete' }) {
  return (
    <Button
      variant="danger"
      size="icon"
      icon={Trash2}
      loading={processing}
      onClick={onClick}
      edit
      title={title}
      aria-label={title}
    />
  );
}
