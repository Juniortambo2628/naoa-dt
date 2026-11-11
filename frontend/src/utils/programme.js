/** Helpers for the wedding programme (schedule items from Admin → Schedule). */

/** "13:20" / "13:20:00" → "1:20 PM". */
export const formatProgrammeTime = (value) => {
  const m = String(value || '').match(/^(\d{1,2}):(\d{2})/);
  if (!m) return value || '';
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`;
};

export const formatRange = (item) => (item.end_time
  ? `${formatProgrammeTime(item.start_time)} – ${formatProgrammeTime(item.end_time)}`
  : formatProgrammeTime(item.start_time));

/** Bridal party names from Settings (one per line, or comma separated). */
export const parseNames = (value) => String(value || '').split(/[\n,]+/).map((n) => n.trim()).filter(Boolean);

