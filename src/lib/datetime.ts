/**
 * Convert a local date+time string to a UTC ISO string.
 * Use this when storing a user-picked slot (e.g. "2026-06-04" + "10:00")
 * so the value is preserved across timezones.
 *
 * Example (user in UTC+7 picks 10:00):
 *   slotToISO('2026-06-04', '10:00') → '2026-06-04T03:00:00.000Z'
 *
 * When read back and formatted with toLocaleTimeString in the same
 * timezone, displays "10:00" again.
 */
export function slotToISO(dateStr: string, timeStr: string): string {
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

/**
 * Format a booking slot (UTC ISO) back to HH:mm in user's local timezone.
 */
export function formatSlotTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Format a booking slot to a friendly date+time.
 */
export function formatSlotDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
