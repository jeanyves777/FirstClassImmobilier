import { z } from 'zod'

/**
 * Weekly availability — a small list of day-of-week windows shared
 * across all staff. Good enough for the FCI use-case; a per-agent
 * version can replace this later.
 */

const HHMM_RE = /^([01]?\d|2[0-3]):[0-5]\d$/

export const availabilityWindowSchema = z.object({
  day: z.coerce.number().int().min(0).max(6), // 0 = Sunday
  start: z.string().regex(HHMM_RE),
  end: z.string().regex(HHMM_RE),
})

export const availabilitySchema = z.array(availabilityWindowSchema)
export type AvailabilityWindow = z.infer<typeof availabilityWindowSchema>
export type Availability = AvailabilityWindow[]

export function parseAvailability(raw: string | null | undefined): Availability {
  if (!raw) return []
  try {
    const parsed = availabilitySchema.parse(JSON.parse(raw))
    return parsed
  } catch {
    return []
  }
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Next N open slots, starting from `from`, that don't collide with existing bookings. */
export function getNextSlots({
  availability,
  durationMin,
  from,
  daysAhead = 14,
  take = 8,
  bookings,
}: {
  availability: Availability
  durationMin: number
  from: Date
  daysAhead?: number
  take?: number
  bookings: Date[]
}): Date[] {
  if (availability.length === 0 || durationMin <= 0) return []

  // Group windows by day-of-week for fast lookup.
  const byDay: Map<number, AvailabilityWindow[]> = new Map()
  for (const w of availability) {
    if (!byDay.has(w.day)) byDay.set(w.day, [])
    byDay.get(w.day)!.push(w)
  }

  const bookedMs = new Set(bookings.map((d) => d.getTime()))
  const result: Date[] = []

  for (let dayOffset = 0; dayOffset < daysAhead && result.length < take; dayOffset++) {
    const date = new Date(from)
    date.setDate(date.getDate() + dayOffset)
    const dow = date.getDay()
    const windows = byDay.get(dow) ?? []
    for (const w of windows) {
      if (result.length >= take) break
      const startMin = toMinutes(w.start)
      const endMin = toMinutes(w.end)
      for (let minute = startMin; minute + durationMin <= endMin; minute += durationMin) {
        if (result.length >= take) break
        const slot = new Date(date)
        slot.setHours(Math.floor(minute / 60), minute % 60, 0, 0)
        if (slot.getTime() <= from.getTime()) continue
        if (bookedMs.has(slot.getTime())) continue
        result.push(slot)
      }
    }
  }

  // Sort chronologically (windows may be declared out of order).
  result.sort((a, b) => a.getTime() - b.getTime())
  return result.slice(0, take)
}
