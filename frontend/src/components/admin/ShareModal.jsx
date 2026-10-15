import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Copy, Link2, Send, Trash2, RefreshCw, Check } from 'lucide-react';
import AdminModal from './AdminModal';
import { AdminInput, AdminTextarea } from './AdminInput';
import Button from '../Button';
import Spinner from './Spinner';
import { CollaboratorAvatar } from './CollaboratorAvatars';
import { collaborationService, userService } from '../../services/api';
import { moduleByKey } from '../../utils/adminModules';
import { confirmAction, notifyError, notifySuccess } from '../../utils/feedback';

const EMPTY_FORM = { name: '', email: '', message: '' };

function CopyField({ value, label }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notifyError('Could not copy — select the link and copy it instead');
    }
  };
  return (
    <div className="flex gap-2">
      <input readOnly value={value} aria-label={label} onFocus={(e) => e.target.select()}
        className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 text-xs font-mono text-stone-600" />
      <Button size="sm" icon={copied ? Check : Copy} onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
    </div>
  );
}

function status(person) {
  if (person.is_you) return 'You';
  if (person.pending) return 'Invitation pending';
  if (person.online) {
    const where = moduleByKey(person.current_module)?.label;
    return where ? `Online · on ${where}` : 'Online';
  }
  return person.last_active_at
    ? `Active ${formatDistanceToNow(new Date(person.last_active_at), { addSuffix: true })}`
    : 'Not active yet';
}

/**
 * Share the dashboard: invite collaborators by email (they get a link to set
 * their password), and see / manage everyone who has access.
 */
export default function ShareModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [sending, setSending] = useState(false);
  const [lastInvite, setLastInvite] = useState(null);

  const { data: people = [], isLoading } = useQuery({
    queryKey: ['collaborators'],
    queryFn: async () => (await collaborationService.getCollaborators()).data || [],
    enabled: isOpen,
    staleTime: 10000,
  });

  const sendInvite = async (payload) => {
    setSending(true);
    try {
      const res = await collaborationService.invite(payload);
      setLastInvite({ email: payload.email, ...res.data });
      if (res.data?.emailed) notifySuccess(`Invitation sent to ${payload.email}`);
      queryClient.invalidateQueries({ queryKey: ['collaborators'] });
      return true;
    } catch (err) {
      notifyError(err, 'Could not send the invitation');
      return false;
    } finally {
      setSending(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (await sendInvite(form)) setForm(EMPTY_FORM);
  };

  const removeAccess = async (person) => {
    const ok = await confirmAction({
      title: `Remove ${person.name}?`,
      message: `${person.email} will be signed out and can no longer open the dashboard.`,
      confirmLabel: 'Remove access',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await userService.delete(person.id);
      notifySuccess(`${person.name} no longer has access`);
      queryClient.invalidateQueries({ queryKey: ['collaborators'] });
    } catch (err) {
      notifyError(err, 'Could not remove access');
    }
  };

  const close = () => {
    setLastInvite(null);
    onClose();
  };

  return (
    <AdminModal isOpen={isOpen} onClose={close} title="Share dashboard" size="lg">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto -mx-1 px-1">
        <form onSubmit={onSubmit} className="space-y-3">
          <p className="text-sm text-stone-600">
            Invite someone to plan with you. They get an email with a link to set their password, and can then edit everything you can.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <AdminInput label="Name" required value={form.name} placeholder="e.g. Aunt Mei"
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <AdminInput label="Email" type="email" required value={form.email} placeholder="name@example.com"
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <AdminTextarea label="Personal note (optional)" rows={2} value={form.message} maxLength={1000}
            onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <div className="flex justify-end">
            <Button type="submit" variant="secondary" icon={Send} loading={sending}>Send invite</Button>
          </div>
        </form>

        {lastInvite?.invite_link && (
          <div className={`p-3 rounded-xl border space-y-2 ${lastInvite.emailed ? 'bg-stone-50 border-stone-100' : 'bg-amber-50 border-amber-200'}`}>
            <p className="text-xs text-stone-700 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" />
              {lastInvite.emailed
                ? `Or share this link with ${lastInvite.email} directly (valid ${lastInvite.expires_in_days} days):`
                : `The email couldn't be sent — share this link with ${lastInvite.email} (valid ${lastInvite.expires_in_days} days):`}
            </p>
            <CopyField value={lastInvite.invite_link} label="Invitation link" />
          </div>
        )}

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">People with access</h3>
          {isLoading ? (
            <div className="py-6 flex justify-center"><Spinner /></div>
          ) : (
            <ul className="divide-y divide-stone-100 border border-stone-100 rounded-xl">
              {people.map((person) => (
                <li key={person.id} className="flex items-center gap-3 px-3 py-2">
                  <span className="relative">
                    <CollaboratorAvatar person={person} />
                    {person.online && !person.is_you && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-white" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-stone-800 truncate">{person.name}</span>
                    <span className="block text-xs text-stone-500 truncate">{person.email} · {status(person)}</span>
                  </span>
                  {person.pending && (
                    <Button size="icon-sm" icon={RefreshCw} aria-label={`Resend invitation to ${person.name}`} title="Resend invitation"
                      onClick={() => sendInvite({ name: person.name, email: person.email })} disabled={sending} />
                  )}
                  {!person.is_you && (
                    <Button size="icon-sm" variant="danger" icon={Trash2} aria-label={`Remove ${person.name}`} title="Remove access"
                      onClick={() => removeAccess(person)} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminModal>
  );
}
