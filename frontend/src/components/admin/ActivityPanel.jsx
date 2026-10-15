import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { History, Share2 } from 'lucide-react';
import Button from '../Button';
import { CollaboratorAvatar } from './CollaboratorAvatars';
import { useCollaboration } from '../../context/CollaborationContext';
import { collaborationService } from '../../services/api';

const ACTION_WORDS = { created: 'added', updated: 'edited', deleted: 'deleted', restored: 'restored' };

export default function ActivityPanel() {
  const { module, othersHere, openHistory, setShareOpen } = useCollaboration();
  const { data: recent = [], isLoading } = useQuery({
    queryKey: ['revisions', module, 'recent'],
    queryFn: async () => (await collaborationService.getRevisions({ module, per_page: 5 })).data?.data || [],
    enabled: !!module,
    staleTime: 15000,
  });

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-stone-500">On this page</h3>
        {othersHere.length ? (
          <ul className="space-y-1.5">
            {othersHere.map((person) => (
              <li key={person.id} className="flex items-center gap-2 text-sm text-stone-700">
                <CollaboratorAvatar person={person} size="xs" /> {person.name}
              </li>
            ))}
            <li className="text-xs text-amber-700">Save often — the last save wins if you edit the same thing.</li>
          </ul>
        ) : (
          <p className="text-xs text-stone-500">Only you right now.</p>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Recent changes</h3>
        {isLoading ? (
          <p className="text-xs text-stone-400">Loading…</p>
        ) : recent.length ? (
          <ul className="space-y-2">
            {recent.map((r) => (
              <li key={r.id} className="text-xs text-stone-600 leading-snug">
                <span className="font-medium text-stone-800">{r.user?.name || 'A guest'}</span>{' '}
                {ACTION_WORDS[r.action] || r.action} <span className="font-medium text-stone-800">{r.subject_label}</span>
                <span className="block text-[11px] text-stone-400">
                  {formatDistanceToNow(new Date(r.updated_at || r.created_at), { addSuffix: true })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-stone-500">No changes recorded here yet.</p>
        )}
        <Button size="sm" icon={History} fullWidth onClick={openHistory}>Version history</Button>
      </section>

      <Button size="sm" icon={Share2} fullWidth onClick={() => setShareOpen(true)}>Invite collaborators</Button>
    </div>
  );
}

