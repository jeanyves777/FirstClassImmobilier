/**
 * Minimal Google Places API (New) client.
 *
 * Docs: https://developers.google.com/maps/documentation/places/web-service/overview
 *
 * Requires `GOOGLE_PLACES_API_KEY` in the environment. The key must have the
 * "Places API (New)" enabled in Google Cloud Console.
 *
 * Per Google's ToS, reviews fetched through this API may only be cached for
 * up to 30 days and must attribute Google (we surface the source URL in the
 * review card). When re-syncing, delete and re-insert rather than updating
 * individual rows so stale reviews are properly purged.
 */

export type GooglePlace = {
  id: string
  displayName?: { text: string; languageCode?: string }
  formattedAddress?: string
}

export type GoogleReview = {
  /** Stable per-review identifier, e.g. "places/<placeId>/reviews/<hash>" */
  name: string
  relativePublishTimeDescription?: string
  rating: number
  text?: { text: string; languageCode?: string }
  originalText?: { text: string; languageCode?: string }
  authorAttribution?: {
    displayName?: string
    uri?: string
    photoUri?: string
  }
  publishTime?: string
  googleMapsUri?: string
}

export type GooglePlaceDetails = {
  id: string
  displayName?: { text: string }
  rating?: number
  userRatingCount?: number
  reviews?: GoogleReview[]
}

const NEW_API_BASE = 'https://places.googleapis.com/v1'

function getKey(): string {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) throw new Error('missing_api_key')
  return key
}

/** Resolve a human-readable query (name + city) to a place_id. */
export async function findPlaceIdByText(query: string): Promise<string | null> {
  const res = await fetch(`${NEW_API_BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': getKey(),
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
    },
    body: JSON.stringify({ textQuery: query, pageSize: 1 }),
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`places_searchText_failed: ${res.status} ${body.slice(0, 300)}`)
  }
  const json = (await res.json()) as { places?: GooglePlace[] }
  return json.places?.[0]?.id ?? null
}

/** Fetch place details including up to 5 most relevant reviews. */
export async function getPlaceDetails(placeId: string): Promise<GooglePlaceDetails> {
  const res = await fetch(
    `${NEW_API_BASE}/places/${encodeURIComponent(placeId)}`,
    {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': getKey(),
        'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,reviews',
      },
      cache: 'no-store',
    },
  )
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`places_details_failed: ${res.status} ${body.slice(0, 300)}`)
  }
  return (await res.json()) as GooglePlaceDetails
}
