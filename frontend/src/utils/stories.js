/**
 * Shared story-playground constants and helpers for the Snapchat-style
 * viewer: the reaction set (kept in step with the API's allow-list), how long
 * each photo shows, and a small "which photos have I already watched" record.
 */

/** Matches PolaroidImageController::REACTIONS — the API rejects anything else. */
export const REACTIONS = ['❤️', '😂', '👏', '🔥', '😮', '😍', '🎉', '🥳'];

/** Milliseconds each photo is on screen before auto-advancing. */
export const STORY_DURATION_MS = 5000;

const SEEN_KEY = 'polaroidStoriesSeen';
const SEEN_CAP = 300;

/** Set of photo ids this device has already watched. */
export function getSeenIds() {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

/** Remember photos as watched (capped so storage never grows without limit). */
export function markSeen(ids) {
  if (!ids?.length) return;
  try {
    const seen = getSeenIds();
    ids.forEach((id) => seen.add(id));
    const list = [...seen];
    localStorage.setItem(SEEN_KEY, JSON.stringify(list.slice(-SEEN_CAP)));
  } catch {
    // Storage unavailable (private mode) — the ring just stays lit.
  }
}

/**
 * Build the reaction summary for a post after an optimistic tap, so the UI
 * reacts instantly and the server response replaces it a beat later.
 */
export function optimisticReaction(current, emoji, removing = false) {
  const summary = current || { count: 0, by_emoji: {}, mine: null };
  const byEmoji = { ...summary.by_emoji };
  let count = summary.count;
  let mine = summary.mine;

  if (removing) {
    if (mine) {
      byEmoji[mine] = (byEmoji[mine] || 1) - 1;
      if (byEmoji[mine] <= 0) delete byEmoji[mine];
      count = Math.max(0, count - 1);
    }
    mine = null;
  } else if (mine === emoji) {
    // Tapping the same emoji again removes it (handled by the caller).
    mine = null;
  } else {
    if (mine) {
      byEmoji[mine] = (byEmoji[mine] || 1) - 1;
      if (byEmoji[mine] <= 0) delete byEmoji[mine];
    } else {
      count += 1;
    }
    byEmoji[emoji] = (byEmoji[emoji] || 0) + 1;
    mine = emoji;
  }

  const sorted = Object.fromEntries(
    Object.entries(byEmoji).sort((a, b) => b[1] - a[1]),
  );

  return { count, by_emoji: sorted, mine };
}
