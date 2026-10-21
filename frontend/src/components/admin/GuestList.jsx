import { useState, useRef, useEffect } from 'react';
import useRole from '../../hooks/useRole';
import EditableFieldset from './EditableFieldset';
import {
  Users, Send, Edit, Trash2, RotateCcw, MessageCircle, Mail, CopyCheck, ArrowUp, ArrowDown, ArrowUpDown, Check, AlertCircle, Loader2,
} from 'lucide-react';
import AdminListPanel from './AdminListPanel';
import AdminPagination from './AdminPagination';
import EmptyState from './EmptyState';
import Button from '../Button';
import { confirmAction } from '../../utils/feedback';
import { RSVP_STATUSES, RSVP_ORDER, rsvpStatus, isInviteSent } from '../../utils/rsvp';

const RESET_RSVP = { rsvp_status: 'pending', rsvp_message: null, dietary_notes: null };

// Lets admins record RSVPs received verbally (call, in person, etc.).
function RsvpStatusSelect({ guest, onUpdateGuest }) {
  const status = guest.rsvp_status || 'pending';
  const handleChange = async (e) => {
    const next = e.target.value;
    if (next === status) return;
    if (!await confirmAction(`Mark ${guest.name} as ${RSVP_STATUSES[next].label.toLowerCase()}?`)) return;
    onUpdateGuest(guest, next === 'pending' ? RESET_RSVP : { rsvp_status: next });
  };
  const { canEdit } = useRole();
  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={!canEdit}
      title="Set RSVP status manually"
      aria-label={`RSVP status for ${guest.name}`}
      className={`px-2 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider cursor-pointer disabled:cursor-default disabled:appearance-none focus:outline-none focus:ring-2 focus:ring-[#A67B5B] ${rsvpStatus(status).badge}`}
    >
      {RSVP_ORDER.map((id) => <option key={id} value={id}>{RSVP_STATUSES[id].label}</option>)}
    </select>
  );
}

/** Invite / edit / reset / delete — shared by the table rows and mobile cards. */
function GuestActions({ guest, onInviteRequest, onEdit, onUpdateGuest, onDelete }) {
  const resetRsvp = async () => {
    if (await confirmAction(`Reset RSVP status for ${guest.name}?`)) onUpdateGuest(guest, RESET_RSVP);
  };
  return (
    <div className="flex justify-end gap-1">
      <Button edit size="icon-sm" icon={Send} onClick={() => onInviteRequest(guest)} title={isInviteSent(guest) ? 'Invitation sent — manage' : 'Send invitation'} aria-label={`Invitation for ${guest.name}`} />
      {onEdit && (
        <Button edit size="icon-sm" icon={Edit} onClick={() => onEdit(guest)} title="Edit" aria-label={`Edit ${guest.name}`} />
      )}
      <Button edit size="icon-sm" icon={RotateCcw} onClick={resetRsvp} title="Reset RSVP" aria-label={`Reset RSVP for ${guest.name}`} />
      {onDelete && (
        <Button edit size="icon-sm" variant="danger" icon={Trash2} onClick={() => onDelete(guest.id)} title="Delete" aria-label={`Delete ${guest.name}`} />
      )}
    </div>
  );
}

function DuplicateBadge({ guest, onReview, compact = false }) {
  return (
    <button
      type="button"
      onClick={() => onReview?.(guest)}
      className={compact
        ? 'p-0.5 rounded text-amber-700 bg-amber-100 hover:bg-amber-200'
        : 'inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] uppercase font-bold rounded whitespace-nowrap hover:bg-amber-200'}
      title="This guest may be listed more than once — review & merge"
      aria-label={`Review possible duplicate of ${guest.name}`}
    >
      <CopyCheck className={compact ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
      {!compact && 'Duplicate?'}
    </button>
  );
}

function ContactLines({ guest }) {
  if (!guest.email && !guest.phone) return <span className="text-xs text-stone-500 italic">No contact info</span>;
  return (
    <div className="space-y-1 text-xs">
      {guest.email && <div className="flex items-center gap-1.5 text-stone-600"><Mail className="w-3 h-3 text-stone-400" aria-hidden="true" />{guest.email}</div>}
      {guest.phone && <div className="flex items-center gap-1.5 text-stone-700 font-medium"><MessageCircle className="w-3 h-3 text-green-600" aria-hidden="true" />{guest.phone}</div>}
    </div>
  );
}

/** Column header that sorts the list (aria-sort for screen readers). */
function SortHeader({ label, sortKey, sort, onSort, className = '' }) {
  if (!sortKey || !onSort) return <th scope="col" className={className}>{label}</th>;
  const active = sort?.key === sortKey;
  const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th scope="col" className={className} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => onSort(sortKey)} className={`inline-flex items-center gap-1 uppercase tracking-wider hover:text-[#A67B5B] ${active ? 'text-[#8B5E3C]' : ''}`}>
        {label}
        <Icon className={`w-3 h-3 ${active ? '' : 'opacity-40'}`} aria-hidden="true" />
      </button>
    </th>
  );
}

/** Per-cell save state for the spreadsheet: saving → saved ✓ / error !. */
function useCellStatus(onInlineSave) {
  const [status, setStatus] = useState({});
  const timers = useRef({});
  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  const save = async (guest, field, value) => {
    const key = `${guest.id}:${field}`;
    setStatus((s) => ({ ...s, [key]: 'saving' }));
    try {
      const result = await onInlineSave(guest, field, value);
      setStatus((s) => ({ ...s, [key]: result === 'unchanged' ? undefined : 'saved' }));
      clearTimeout(timers.current[key]);
      timers.current[key] = setTimeout(() => setStatus((s) => ({ ...s, [key]: undefined })), 1800);
    } catch {
      setStatus((s) => ({ ...s, [key]: 'error' }));
    }
  };
  return [status, save];
}

function CellStatus({ state }) {
  if (!state) return null;
  const map = {
    saving: { Icon: Loader2, className: 'text-stone-400 animate-spin', label: 'Saving' },
    saved: { Icon: Check, className: 'text-green-600', label: 'Saved' },
    error: { Icon: AlertCircle, className: 'text-red-600', label: 'Not saved — edit again to retry' },
  }[state];
  return (
    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" title={map.label} role="status" aria-label={map.label}>
      <map.Icon className={`w-3.5 h-3.5 ${map.className}`} />
    </span>
  );
}

const cellInput = 'w-full h-10 px-3 pr-6 bg-transparent outline-none focus:bg-white focus:ring-inset focus:ring-2 focus:ring-[#A67B5B]/50 transition-all text-stone-700';

/** Spreadsheet columns — headers, rows and quick-add rows all come from this. */
const SHEET_COLUMNS = [
  { key: 'name', label: 'Name', input: 'text', quickAdd: true, className: 'font-medium text-stone-800' },
  { key: 'email', label: 'Email', input: 'email', quickAdd: true },
  { key: 'phone', label: 'Phone', input: 'text', quickAdd: true },
  { key: 'group', label: 'Group', input: 'text' },
  { key: 'invitation_via', label: 'Invitation Via', input: 'select', options: [['whatsapp', 'WhatsApp'], ['email', 'Email']], fallback: 'whatsapp' },
  { key: 'plus_ones_allowed', label: 'Extra Plus Ones', input: 'number', fallback: 0, className: 'font-mono' },
  { key: 'unique_code', label: 'RSVP Code', render: (g) => <span className="font-mono text-xs text-stone-600">{g.unique_code || '—'}</span> },
  { key: 'invite', label: 'Invite', render: (g, p) => <GuestActions guest={g} onInviteRequest={p.onInviteRequest} onUpdateGuest={p.onUpdateGuest} /> },
  { key: 'rsvp_status', label: 'RSVP Status', render: (g, p) => <RsvpStatusSelect guest={g} onUpdateGuest={p.onUpdateGuest} /> },
  { key: 'rsvp_message', label: 'Message', input: 'text' },
  { key: 'dietary_notes', label: 'Dietary', input: 'text' },
];

const columnLetter = (i) => String.fromCharCode(65 + i);

function SheetCell({ column, guest, cellStatus, onSave, props }) {
  if (column.render) return <td className="px-3 py-2 border-r border-stone-200">{column.render(guest, props)}</td>;
  const state = cellStatus[`${guest.id}:${column.key}`];
  const value = guest[column.key] ?? column.fallback ?? '';
  const common = {
    'aria-label': `${column.label} for ${guest.name}`,
    className: `${cellInput} ${column.className || ''} ${state === 'error' ? 'ring-2 ring-inset ring-red-300' : ''}`,
  };
  return (
    <td className="p-0 border-r border-stone-200 relative">
      {column.input === 'select' ? (
        <select {...common} value={value} onChange={(e) => onSave(guest, column.key, e.target.value)} className={`${common.className} appearance-none`}>
          {column.options.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      ) : (
        <input
          {...common}
          type={column.input}
          min={column.input === 'number' ? 0 : undefined}
          defaultValue={value}
          placeholder={column.label}
          onBlur={(e) => onSave(guest, column.key, e.target.value)}
        />
      )}
      <CellStatus state={state} />
    </td>
  );
}

function SpreadsheetView({ props, cellStatus, saveCell }) {
  const { pagedGuests, selectedIds, onToggleSelect, onInlineCreate, duplicateIds, onReviewDuplicates } = props;
  const headCell = 'px-3 py-3 text-left font-mono font-semibold text-stone-600 uppercase tracking-wider border-r border-stone-200 bg-stone-100 whitespace-nowrap';
  return (
    <table className="w-full text-sm border-collapse">
      <thead className="sticky top-0 bg-stone-50 z-10 shadow-sm">
        <tr>
          <th scope="col" className="px-2 py-3 w-10 border-r border-stone-200 bg-stone-100"><span className="sr-only">Select</span></th>
          <th scope="col" className="px-2 py-3 w-12 text-center font-mono text-stone-500 border-r border-stone-200 bg-stone-100">#</th>
          {SHEET_COLUMNS.map((c, i) => <th key={c.key} scope="col" className={headCell}>{columnLetter(i)} - {c.label}</th>)}
        </tr>
      </thead>
      <tbody className="divide-y divide-stone-200">
        {pagedGuests.map((guest, index) => (
          <tr key={guest.id} className={`hover:bg-[#A67B5B]/5 ${selectedIds.includes(guest.id) ? 'bg-[#A67B5B]/10' : ''}`}>
            <td className="px-2 py-2 text-center border-r border-stone-200">
              <input type="checkbox" aria-label={`Select ${guest.name}`} className="w-3.5 h-3.5 rounded border-stone-300 text-[#A67B5B] focus:ring-[#A67B5B]" checked={selectedIds.includes(guest.id)} onChange={() => onToggleSelect(guest.id)} />
            </td>
            <td className="px-2 py-2 text-center text-stone-500 bg-stone-50 border-r border-stone-200 select-none relative">
              {index + 1}
              {duplicateIds?.has(guest.id) && <span className="absolute -right-1 top-1"><DuplicateBadge guest={guest} onReview={onReviewDuplicates} compact /></span>}
            </td>
            {SHEET_COLUMNS.map((c) => <SheetCell key={c.key} column={c} guest={guest} cellStatus={cellStatus} onSave={saveCell} props={props} />)}
          </tr>
        ))}

        {/* Empty rows for quick adding (not offered once the guest limit is reached) */}
        {onInlineCreate && [...Array(5)].map((_, index) => (
          <tr key={`empty-${index}`} className="hover:bg-green-50/30">
            <td className="border-r border-stone-200 bg-stone-50" />
            <td className="px-2 py-2 text-center text-stone-400 bg-stone-50 border-r border-stone-200 select-none text-xs italic">New</td>
            {SHEET_COLUMNS.map((c) => (c.quickAdd ? (
              <td key={c.key} className="p-0 border-r border-stone-200">
                <input
                  type={c.input}
                  aria-label={`New guest ${c.label.toLowerCase()}`}
                  onBlur={(e) => {
                    if (e.target.value.trim()) {
                      onInlineCreate(index, c.key, e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className={`${cellInput} placeholder-stone-400`}
                  placeholder={c.key === 'name' ? '+ Add name…' : `${c.label}…`}
                />
              </td>
            ) : <td key={c.key} className="border-r border-stone-200 bg-stone-50/50" />))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function GuestName({ guest, onReviewDuplicates, duplicate }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-stone-800">{guest.name}</span>
        {guest.parent_guest_id && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] uppercase font-bold rounded">Plus One</span>}
        {duplicate && <DuplicateBadge guest={guest} onReview={onReviewDuplicates} />}
      </div>
      <div className="text-[10px] font-mono text-stone-500 mt-0.5 uppercase tracking-wider">Code: {guest.unique_code || '—'}</div>
      {guest.parent_guest_id && guest.parent_guest && <div className="text-[10px] text-stone-500 italic">Guest of: {guest.parent_guest.name}</div>}
    </>
  );
}

const plusOnesText = (guest) => (guest.plus_ones?.length ? guest.plus_ones.map((po) => po.name).join(', ') : null);

function TableView({ props }) {
  const { filteredGuests, pagedGuests, selectedIds, onToggleSelect, onToggleSelectAll, duplicateIds, onReviewDuplicates, sort, onSort } = props;
  const th = 'px-4 py-3 text-left text-xs font-semibold text-stone-600 uppercase tracking-wider';
  return (
    <table className="w-full hidden md:table">
      <thead className="sticky top-0 z-10 bg-stone-50 shadow-[inset_0_-1px_0_rgb(245_245_244)]">
        <tr>
          <th scope="col" className="px-4 py-2.5 text-left">
            <input type="checkbox" aria-label="Select all guests in this list" className="w-4 h-4 rounded border-stone-300 text-[#A67B5B] focus:ring-[#A67B5B]" checked={selectedIds.length === filteredGuests.length && filteredGuests.length > 0} onChange={onToggleSelectAll} />
          </th>
          <SortHeader label="Name" sortKey="name" sort={sort} onSort={onSort} className={th} />
          <SortHeader label="Contact" className={th} />
          <SortHeader label="Group" sortKey="group" sort={sort} onSort={onSort} className={th} />
          <SortHeader label="Plus Ones" sortKey="plus_ones" sort={sort} onSort={onSort} className={th} />
          <SortHeader label="RSVP Status" sortKey="status" sort={sort} onSort={onSort} className={th} />
          <th scope="col" className={`${th} text-right`}>Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-stone-100">
        {pagedGuests.map((guest) => (
          <tr key={guest.id} className={`hover:bg-stone-50/50 ${selectedIds.includes(guest.id) ? 'bg-stone-50' : ''}`}>
            <td className="px-4 py-2.5">
              <input type="checkbox" aria-label={`Select ${guest.name}`} className="w-4 h-4 rounded border-stone-300 text-[#A67B5B] focus:ring-[#A67B5B]" checked={selectedIds.includes(guest.id)} onChange={() => onToggleSelect(guest.id)} />
            </td>
            <td className="px-4 py-2.5"><GuestName guest={guest} duplicate={duplicateIds?.has(guest.id)} onReviewDuplicates={onReviewDuplicates} /></td>
            <td className="px-4 py-2.5"><ContactLines guest={guest} /></td>
            <td className="px-4 py-2.5">
              {guest.group && <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700">{guest.group}</span>}
            </td>
            <td className="px-4 py-2.5">
              {plusOnesText(guest) ? (
                <div>
                  <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800">+{guest.plus_ones.length}</span>
                  <div className="text-xs text-stone-600 mt-1">{plusOnesText(guest)}</div>
                </div>
              ) : <span className="text-xs text-stone-500">None</span>}
            </td>
            <td className="px-4 py-2.5"><RsvpStatusSelect guest={guest} onUpdateGuest={props.onUpdateGuest} /></td>
            <td className="px-4 py-2.5"><GuestActions guest={guest} {...props} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Small screens: one card per guest instead of a sideways-scrolling table. */
function CardView({ props }) {
  const { pagedGuests, selectedIds, onToggleSelect, duplicateIds, onReviewDuplicates } = props;
  return (
    <ul className="md:hidden divide-y divide-stone-100">
      {pagedGuests.map((guest) => (
        <li key={guest.id} className={`p-4 ${selectedIds.includes(guest.id) ? 'bg-stone-50' : ''}`}>
          <div className="flex items-start gap-3">
            <input type="checkbox" aria-label={`Select ${guest.name}`} className="mt-1 w-4 h-4 rounded border-stone-300 text-[#A67B5B] focus:ring-[#A67B5B]" checked={selectedIds.includes(guest.id)} onChange={() => onToggleSelect(guest.id)} />
            <div className="flex-1 min-w-0 space-y-2">
              <GuestName guest={guest} duplicate={duplicateIds?.has(guest.id)} onReviewDuplicates={onReviewDuplicates} />
              <ContactLines guest={guest} />
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600">
                {guest.group && <span className="px-2 py-0.5 rounded-full bg-stone-100 font-semibold">{guest.group}</span>}
                {plusOnesText(guest) && <span>+{guest.plus_ones.length}: {plusOnesText(guest)}</span>}
              </div>
              <div className="flex items-center justify-between gap-2">
                <RsvpStatusSelect guest={guest} onUpdateGuest={props.onUpdateGuest} />
                <GuestActions guest={guest} {...props} />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function GuestList(props) {
  const { guestsLoading, filteredGuests, viewMode, searchQuery, currentPage, itemsPerPage, onSetItemsPerPage, onSetCurrentPage, onInlineSave } = props;
  const [cellStatus, saveCell] = useCellStatus(onInlineSave);

  return (
    <AdminListPanel
      bodyClassName={viewMode === 'spreadsheet' ? 'max-h-[70vh] overflow-y-auto fit:max-h-none' : ''}
      footer={!guestsLoading && filteredGuests.length > 0 && (
        <AdminPagination
          currentPage={currentPage}
          pageSize={itemsPerPage}
          totalItems={filteredGuests.length}
          onPageChange={onSetCurrentPage}
          pageSizeOptions={[15, 25, 50, 100]}
          onPageSizeChange={onSetItemsPerPage}
        />
      )}
    >
      {guestsLoading ? (
        <EmptyState loading rows={8} />
      ) : filteredGuests.length === 0 ? (
        <EmptyState icon={Users} message="No guests match these filters" searchQuery={searchQuery} action={props.onAdd && { label: 'Add a guest', onClick: props.onAdd }} />
      ) : viewMode === 'spreadsheet' ? (
        <EditableFieldset><SpreadsheetView props={props} cellStatus={cellStatus} saveCell={saveCell} /></EditableFieldset>
      ) : (
        <>
          <TableView props={props} />
          <CardView props={props} />
        </>
      )}
    </AdminListPanel>
  );
}
