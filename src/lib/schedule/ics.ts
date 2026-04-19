/**
 * Minimal RFC 5545 VCALENDAR generator — enough for inline "Add to
 * calendar" attachments on visit confirmation emails.
 *
 * Returned as a UTF-8 string; the caller attaches it as
 * `text/calendar; method=REQUEST`.
 */

type IcsEvent = {
  uid: string
  start: Date
  durationMin: number
  summary: string
  description?: string
  location?: string
  organizerName?: string
  organizerEmail?: string
  attendeeName?: string
  attendeeEmail?: string
}

function fmt(d: Date): string {
  // YYYYMMDDTHHMMSSZ (UTC)
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  )
}

function escapeText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

/** Fold lines to 75 octets per RFC 5545. */
function fold(line: string): string {
  const max = 74
  if (line.length <= max) return line
  const parts: string[] = []
  let i = 0
  while (i < line.length) {
    parts.push((parts.length === 0 ? '' : ' ') + line.slice(i, i + max))
    i += max
  }
  return parts.join('\r\n')
}

export function buildIcs(event: IcsEvent): string {
  const end = new Date(event.start.getTime() + event.durationMin * 60_000)
  const now = new Date()

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FirstClass Immobilier//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${fmt(now)}`,
    `DTSTART:${fmt(event.start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${escapeText(event.summary)}`,
  ]
  if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`)
  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`)
  if (event.organizerEmail) {
    const name = event.organizerName ? `;CN=${escapeText(event.organizerName)}` : ''
    lines.push(`ORGANIZER${name}:mailto:${event.organizerEmail}`)
  }
  if (event.attendeeEmail) {
    const name = event.attendeeName ? `;CN=${escapeText(event.attendeeName)}` : ''
    lines.push(
      `ATTENDEE${name};RSVP=TRUE;PARTSTAT=NEEDS-ACTION;ROLE=REQ-PARTICIPANT:mailto:${event.attendeeEmail}`,
    )
  }
  lines.push('STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR')

  return lines.map(fold).join('\r\n')
}
