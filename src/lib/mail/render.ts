import { render } from '@react-email/render'
import type { ReactElement } from 'react'

/**
 * Renders a React Email template to both HTML and plain-text, matching the
 * shape `sendMail()` expects.
 */
export async function renderEmail(
  element: ReactElement,
): Promise<{ html: string; text: string }> {
  const [html, text] = await Promise.all([
    render(element, { pretty: false }),
    render(element, { plainText: true }),
  ])
  return { html, text }
}
