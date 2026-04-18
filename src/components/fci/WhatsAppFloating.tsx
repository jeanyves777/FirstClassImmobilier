import { site, whatsappLink } from '@/lib/site'

export function WhatsAppFloating({ label }: { label: string }) {
  if (!site.whatsapp) return null
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_-6px_rgba(37,211,102,.55)] transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] sm:bottom-8 sm:right-8"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
        <path d="M20.52 3.48A11.84 11.84 0 0 0 12.04 0C5.5 0 .22 5.27.22 11.76a11.6 11.6 0 0 0 1.66 6.02L0 24l6.41-1.67a11.83 11.83 0 0 0 5.63 1.43h.01c6.54 0 11.82-5.28 11.82-11.77a11.68 11.68 0 0 0-3.35-8.51zM12.04 21.5h-.01a9.76 9.76 0 0 1-4.98-1.36l-.36-.22-3.8.99 1.01-3.71-.23-.38a9.67 9.67 0 0 1-1.47-5.1c0-5.36 4.38-9.72 9.76-9.72 2.6 0 5.05 1.01 6.89 2.85a9.66 9.66 0 0 1 2.85 6.87c0 5.36-4.38 9.78-9.76 9.78zm5.62-7.29c-.31-.16-1.84-.91-2.13-1.01-.29-.11-.5-.16-.71.16-.21.31-.82 1.01-1 1.22-.19.21-.37.24-.68.08-.31-.16-1.31-.48-2.5-1.54a9.44 9.44 0 0 1-1.73-2.15c-.18-.31-.02-.48.14-.64.14-.14.31-.37.47-.56.16-.18.21-.31.31-.52.11-.21.05-.39-.03-.55-.08-.16-.71-1.71-.98-2.34-.26-.62-.52-.53-.71-.54-.18-.01-.39-.01-.61-.01-.21 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.29 3.26.16.21 2.22 3.39 5.39 4.75.75.32 1.34.51 1.8.66.76.24 1.45.21 2 .13.61-.09 1.84-.75 2.1-1.48.26-.72.26-1.34.18-1.48-.08-.14-.29-.21-.6-.37z" />
      </svg>
    </a>
  )
}
