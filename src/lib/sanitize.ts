import sanitizeHtml from 'sanitize-html'

const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'em',
    'u',
    's',
    'blockquote',
    'code',
    'pre',
    'a',
    'ul',
    'ol',
    'li',
    'h2',
    'h3',
    'h4',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        target: '_blank',
        rel: 'noopener noreferrer nofollow',
      },
    }),
  },
}

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html ?? '', RICH_TEXT_OPTIONS).trim()
}

export function sanitizeLocalizedRichText(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as { fr?: unknown; en?: unknown }
    return JSON.stringify({
      fr: sanitizeRichText(typeof parsed.fr === 'string' ? parsed.fr : ''),
      en: sanitizeRichText(typeof parsed.en === 'string' ? parsed.en : ''),
    })
  } catch {
    return JSON.stringify({ fr: '', en: '' })
  }
}
