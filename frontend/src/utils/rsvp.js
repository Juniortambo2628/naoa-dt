/** One definition of RSVP statuses for badges, charts and filters. */
export const RSVP_STATUSES = {
  confirmed: { label: 'Confirmed', color: '#6B8E5A', badge: 'bg-green-100 text-green-800 border-green-200' },
  pending: { label: 'Pending', color: '#D4935A', badge: 'bg-orange-100 text-orange-800 border-orange-200' },
  declined: { label: 'Declined', color: '#C0756B', badge: 'bg-red-100 text-red-800 border-red-200' },
};

export const RSVP_ORDER = ['confirmed', 'pending', 'declined'];

export const rsvpStatus = (status) => RSVP_STATUSES[status] || RSVP_STATUSES.pending;

/** Invitation statuses that mean the invite has gone out. */
export const SENT_INVITE_STATUSES = ['sent', 'opened', 'responded'];

export const isInviteSent = (guest) => SENT_INVITE_STATUSES.includes(guest?.invitation?.status);

export const percent = (part, whole) => (whole ? `${Math.round((part / whole) * 100)}%` : '0%');

/** Link to the guest list with filters applied (read by AdminGuests). */
export const guestListLink = (params = {}) => {
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const qs = query.toString();
  return `/admin/dashboard/guests${qs ? `?${qs}` : ''}`;
};
