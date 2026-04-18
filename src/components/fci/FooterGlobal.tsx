import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { getSiteConfig } from '@/lib/site'
import { Logo } from './Logo'

type SocialKey = 'facebook' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok'
type Social = { key: SocialKey; label: string; icon: React.ReactNode }

const FB = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.5-3.9 3.79-3.9 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.25 0-1.63.78-1.63 1.57V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12z" />
  </svg>
)
const IG = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
    <path d="M12 2.2c3.2 0 3.58.01 4.85.07 1.17.06 1.8.24 2.22.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.17.43.35 1.06.4 2.23.07 1.27.08 1.65.08 4.85s-.01 3.58-.07 4.85c-.06 1.17-.24 1.8-.41 2.22-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.17-1.06.35-2.23.4-1.27.07-1.65.08-4.85.08s-3.58-.01-4.85-.07c-1.17-.06-1.8-.24-2.22-.41a3.73 3.73 0 0 1-1.38-.9 3.73 3.73 0 0 1-.9-1.38c-.17-.43-.35-1.06-.4-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.06-1.17.24-1.8.41-2.22.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.17 1.06-.35 2.23-.4C8.42 2.21 8.8 2.2 12 2.2zm0 1.8c-3.15 0-3.52.01-4.76.07-1.08.05-1.66.23-2.05.38-.52.2-.89.44-1.28.83-.39.39-.63.76-.83 1.28-.15.39-.33.97-.38 2.05C2.65 8.48 2.64 8.85 2.64 12s.01 3.52.07 4.76c.05 1.08.23 1.66.38 2.05.2.52.44.89.83 1.28.39.39.76.63 1.28.83.39.15.97.33 2.05.38 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c1.08-.05 1.66-.23 2.05-.38.52-.2.89-.44 1.28-.83.39-.39.63-.76.83-1.28.15-.39.33-.97.38-2.05.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.05-1.08-.23-1.66-.38-2.05-.2-.52-.44-.89-.83-1.28a3.44 3.44 0 0 0-1.28-.83c-.39-.15-.97-.33-2.05-.38C15.52 4.01 15.15 4 12 4zm0 3.07A4.93 4.93 0 1 1 12 16.93 4.93 4.93 0 0 1 12 7.07zm0 1.8a3.13 3.13 0 1 0 0 6.26 3.13 3.13 0 0 0 0-6.26zm5.15-2.14a1.15 1.15 0 1 1-2.3 0 1.15 1.15 0 0 1 2.3 0z" />
  </svg>
)
const LI = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
    <path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1-.02-5zm.02 6.75H3V20h2v-9.75zM9 10.25h1.91v1.33h.03c.27-.5.93-1.33 2.41-1.33 2.58 0 3.05 1.7 3.05 3.9V20h-2v-4.9c0-1.17-.02-2.67-1.63-2.67-1.63 0-1.88 1.27-1.88 2.58V20H9v-9.75z" />
  </svg>
)
const YT = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
    <path d="M23.5 6.5a3 3 0 0 0-2.12-2.12C19.5 4 12 4 12 4s-7.5 0-9.38.38A3 3 0 0 0 .5 6.5 31 31 0 0 0 .12 12c0 1.84.13 3.66.38 5.5a3 3 0 0 0 2.12 2.12C4.5 20 12 20 12 20s7.5 0 9.38-.38a3 3 0 0 0 2.12-2.12c.25-1.84.38-3.66.38-5.5a31 31 0 0 0-.38-5.5zM9.75 15.5v-7L15.5 12 9.75 15.5z" />
  </svg>
)
const TT = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
    <path d="M20.5 7.5a6.5 6.5 0 0 1-4.5-1.8V16a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1v2.5a3 3 0 1 0 2.1 2.9V2h2.4a4 4 0 0 0 4.6 3.7v1.8z" />
  </svg>
)

const SOCIAL: Social[] = [
  { key: 'facebook', label: 'Facebook', icon: FB },
  { key: 'instagram', label: 'Instagram', icon: IG },
  { key: 'linkedin', label: 'LinkedIn', icon: LI },
  { key: 'youtube', label: 'YouTube', icon: YT },
  { key: 'tiktok', label: 'TikTok', icon: TT },
]

export async function FooterGlobal() {
  const [t, tContact, tNav, cfg] = await Promise.all([
    getTranslations('footer'),
    getTranslations('contact'),
    getTranslations('nav'),
    getSiteConfig(),
  ])
  const year = new Date().getFullYear()

  return (
    <footer className="mt-24 border-t border-[color:var(--border)] bg-surface-muted">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="space-y-4 lg:col-span-2">
          <Link href="/" className="inline-flex">
            <Logo />
          </Link>
          <p className="max-w-md text-sm italic text-muted">{t('tagline')}</p>
        </div>

        <div className="space-y-3 text-sm">
          <h3 className="font-display text-base font-semibold text-foreground">{tNav('contact')}</h3>
          <address className="not-italic text-muted">
            <span className="block">{cfg.address}</span>
            <span className="mt-2 block">
              <span className="font-medium text-foreground">{tContact('phone')}:</span>{' '}
              <a href={`tel:${cfg.phone.replace(/\s/g, '')}`}>{cfg.phone}</a>
            </span>
            <span className="block">
              <span className="font-medium text-foreground">{tContact('mobile')}:</span>{' '}
              <a href={`tel:${cfg.mobile.replace(/\s/g, '')}`}>{cfg.mobile}</a>
            </span>
            <span className="block">
              <span className="font-medium text-foreground">{tContact('email')}:</span>{' '}
              <a href={`mailto:${cfg.email}`}>{cfg.email}</a>
            </span>
          </address>
        </div>

        <div className="space-y-3 text-sm">
          <h3 className="font-display text-base font-semibold text-foreground">{t('followUs')}</h3>
          <ul className="flex flex-wrap gap-2">
            {SOCIAL.map(({ key, label, icon }) => {
              const url = cfg.social[key]
              if (!url) return null
              return (
                <li key={key}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] bg-surface text-foreground transition-colors hover:bg-[color:var(--brand-navy)] hover:text-white"
                  >
                    {icon}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <div className="border-t border-[color:var(--border)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-2 px-4 py-4 text-xs text-muted sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p>{t('copyright', { year })}</p>
          <p>
            <a href={`mailto:${cfg.email}`}>{cfg.email}</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
