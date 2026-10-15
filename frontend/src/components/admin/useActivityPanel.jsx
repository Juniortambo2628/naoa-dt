import { Activity, History } from 'lucide-react';
import ActivityPanel from './ActivityPanel';
import { CollaboratorAvatar } from './CollaboratorAvatars';
import { useCollaboration } from '../../context/CollaborationContext';

/**
 * The side panel for pages that have no switcher or tools of their own: who
 * else is on the page, its latest changes and the share / history shortcuts.
 * Starts collapsed to a rail (showing who's here), so lists keep their width.
 */
export default function useActivityPanel() {
  const { othersHere, openHistory } = useCollaboration();
  return {
    id: 'activity',
    title: 'Activity',
    icon: Activity,
    subtitle: 'Who’s here and what changed',
    defaultCollapsed: true,
    mobile: false,
    content: <ActivityPanel />,
    rail: (
      <>
        {othersHere.slice(0, 3).map((person) => <CollaboratorAvatar key={person.id} person={person} size="xs" />)}
        <button type="button" onClick={openHistory} aria-label="Version history" title="Version history"
          className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-[#A67B5B]">
          <History className="w-4 h-4" />
        </button>
      </>
    ),
  };
}
