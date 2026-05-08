'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

function whatsappLinkFor(number: string, message?: string): string {
  const digits = number.replace(/\D/g, '')
  const base = `https://wa.me/${digits}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

type Action =
  | { kind: 'open-link'; href: string; label: string }
  | { kind: 'open-whatsapp'; label: string }
  | { kind: 'open-lead-form'; label: string }
  | { kind: 'suggest'; text: string }

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  actions?: Action[]
  pending?: boolean
}

type Mode = 'chat' | 'lead-form'

function id() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function FciAssistant({ locale, whatsapp }: { locale: string; whatsapp: string }) {
  const t = useTranslations('assistant')
  const router = useRouter()
  const { push } = useToast()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('chat')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const hasGreeted = useRef(false)
  const waNumber = whatsapp || ''

  // Seed the greeting the first time the panel opens.
  useEffect(() => {
    if (!open || hasGreeted.current) return
    hasGreeted.current = true
    void send(null, { greeting: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Auto-scroll on new messages.
  useEffect(() => {
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, sending, mode])

  async function send(userText: string | null, opts?: { greeting?: boolean }) {
      if (sending) return
      const history = [...messages]
      let userMsg: Message | null = null
      if (userText) {
        userMsg = { id: id(), role: 'user', content: userText }
        history.push(userMsg)
        setMessages((m) => [...m, userMsg!])
      }

      // Typing bubble — simulated "thinking" time scales with response length.
      const pendingId = id()
      setMessages((m) => [...m, { id: pendingId, role: 'assistant', content: '', pending: true }])
      setSending(true)

      const effectiveMessages = opts?.greeting
        ? [{ role: 'user' as const, content: locale === 'fr' ? 'bonjour' : 'hello' }]
        : history.map((m) => ({ role: m.role, content: m.content }))

      const minDelay = 600 + Math.random() * 700
      const start = Date.now()

      let reply: { reply: string; actions: Action[]; intent: string } | null = null
      try {
        const res = await fetch('/api/assistant/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ locale, messages: effectiveMessages }),
        })
        if (res.ok) reply = await res.json()
      } catch {
        // network error, handled below
      }

      const elapsed = Date.now() - start
      if (elapsed < minDelay) await new Promise((r) => setTimeout(r, minDelay - elapsed))

      setMessages((m) =>
        m.map((msg) =>
          msg.id === pendingId
            ? {
                ...msg,
                pending: false,
                content:
                  reply?.reply ??
                  (locale === 'fr'
                    ? 'Désolé, je rencontre un souci technique. Essayez WhatsApp ou laissez-moi vos coordonnées.'
                    : "Sorry, I'm having a technical hiccup. Try WhatsApp or leave your details."),
                actions: reply?.actions ?? [
                  { kind: 'open-whatsapp', label: 'WhatsApp' },
                  { kind: 'open-lead-form', label: locale === 'fr' ? 'Parler à un agent' : 'Talk to an agent' },
                ],
              }
            : msg,
        ),
      )
      setSending(false)
  }

  function handleAction(action: Action) {
      if (action.kind === 'open-link') {
        router.push(action.href)
        setOpen(false)
        return
      }
      if (action.kind === 'open-whatsapp') {
        window.open(whatsappLinkFor(waNumber), '_blank', 'noopener,noreferrer')
        return
      }
      if (action.kind === 'open-lead-form') {
        setMode('lead-form')
        return
      }
      if (action.kind === 'suggest') {
        setInput(action.text)
        setTimeout(() => void send(action.text), 40)
      }
  }

  async function submitLead(payload: { name: string; email: string; phone?: string }) {
      const context = messages
        .filter((m) => !m.pending)
        .slice(-10)
        .map((m) => `${m.role === 'user' ? 'User' : 'Bot'}: ${m.content}`)
        .join('\n')
      const res = await fetch('/api/assistant/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ locale, ...payload, context }),
      })
      if (!res.ok) throw new Error('lead_failed')
      push({
        title: t('leadSuccessTitle'),
        description: t('leadSuccessBody'),
        variant: 'success',
      })
      setMode('chat')
      setMessages((m) => [
        ...m,
        {
          id: id(),
          role: 'assistant',
          content: t('leadConfirmed'),
          actions: [{ kind: 'open-whatsapp', label: 'WhatsApp' }],
        },
      ])
  }

  return (
    <>
      {/* Floating trigger */}
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('open')}
        aria-expanded={open}
        initial={false}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--brand-navy)] text-white shadow-[0_18px_40px_-12px_rgba(15,23,42,.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-navy)] sm:bottom-8 sm:right-8"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.svg
              key="close"
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              aria-hidden
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </motion.svg>
          ) : (
            <motion.svg
              key="chat"
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              aria-hidden
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <circle cx="9" cy="10" r=".6" fill="currentColor" />
              <circle cx="12" cy="10" r=".6" fill="currentColor" />
              <circle cx="15" cy="10" r=".6" fill="currentColor" />
            </motion.svg>
          )}
        </AnimatePresence>
        {/* Online pulse dot */}
        {!open && (
          <span className="absolute right-1 top-1 inline-flex">
            <span className="relative inline-flex h-3 w-3">
              <span className="absolute inset-0 animate-ping rounded-full bg-[color:var(--brand-red)] opacity-70" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-[color:var(--brand-red)] ring-2 ring-[color:var(--brand-navy)]" />
            </span>
          </span>
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={t('title')}
            initial={{ y: 20, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="fixed inset-x-4 bottom-24 z-40 mx-auto flex max-h-[78vh] w-[min(100%,24rem)] flex-col overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface shadow-[0_40px_90px_-40px_rgba(15,23,42,.55)] sm:right-8 sm:bottom-28 sm:left-auto sm:mx-0"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[color:var(--border)] bg-[color:var(--brand-navy)] px-4 py-3 text-white">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[color:var(--brand-navy)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{t('title')}</p>
                <p className="truncate text-[11px] text-white/70">{t('subtitle')}</p>
              </div>
              {waNumber && (
                <a
                  href={whatsappLinkFor(waNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white transition-transform hover:scale-105"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                    <path d="M20.52 3.48A11.84 11.84 0 0 0 12.04 0C5.5 0 .22 5.27.22 11.76a11.6 11.6 0 0 0 1.66 6.02L0 24l6.41-1.67a11.83 11.83 0 0 0 5.63 1.43h.01c6.54 0 11.82-5.28 11.82-11.77a11.68 11.68 0 0 0-3.35-8.51zM12.04 21.5h-.01a9.76 9.76 0 0 1-4.98-1.36l-.36-.22-3.8.99 1.01-3.71-.23-.38a9.67 9.67 0 0 1-1.47-5.1c0-5.36 4.38-9.72 9.76-9.72 2.6 0 5.05 1.01 6.89 2.85a9.66 9.66 0 0 1 2.85 6.87c0 5.36-4.38 9.78-9.76 9.78zm5.62-7.29c-.31-.16-1.84-.91-2.13-1.01-.29-.11-.5-.16-.71.16-.21.31-.82 1.01-1 1.22-.19.21-.37.24-.68.08-.31-.16-1.31-.48-2.5-1.54a9.44 9.44 0 0 1-1.73-2.15c-.18-.31-.02-.48.14-.64.14-.14.31-.37.47-.56.16-.18.21-.31.31-.52.11-.21.05-.39-.03-.55-.08-.16-.71-1.71-.98-2.34-.26-.62-.52-.53-.71-.54-.18-.01-.39-.01-.61-.01-.21 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.29 3.26.16.21 2.22 3.39 5.39 4.75.75.32 1.34.51 1.8.66.76.24 1.45.21 2 .13.61-.09 1.84-.75 2.1-1.48.26-.72.26-1.34.18-1.48-.08-.14-.29-.21-.6-.37z" />
                  </svg>
                </a>
              )}
            </div>

            {/* Body */}
            {mode === 'chat' ? (
              <>
                <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-surface-muted/40 to-transparent px-4 py-4">
                  {messages.map((m) => (
                    <Bubble key={m.id} msg={m} onAction={handleAction} />
                  ))}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const text = input.trim()
                    if (!text) return
                    setInput('')
                    void send(text)
                  }}
                  className="flex items-center gap-2 border-t border-[color:var(--border)] bg-surface-muted/60 p-3"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t('placeholder')}
                    aria-label={t('placeholder')}
                    className="flex-1 rounded-full border border-[color:var(--border)] bg-background px-4 py-2 text-sm text-foreground focus:border-[color:var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]/40"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    aria-label={t('send')}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-navy)] text-white transition-colors hover:bg-[color:var(--brand-navy-700)] disabled:opacity-40"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M22 2 11 13" />
                      <path d="M22 2 15 22l-4-9-9-4 20-7z" />
                    </svg>
                  </button>
                </form>
              </>
            ) : (
              <LeadForm
                locale={locale}
                onCancel={() => setMode('chat')}
                onSubmit={submitLead}
              />
            )}
            <div className="border-t border-[color:var(--border)] bg-surface-muted/40 px-4 py-2 text-[10px] text-muted">
              {t('footnote')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function Bubble({ msg, onAction }: { msg: Message; onAction: (a: Action) => void }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-navy)] text-white shadow-sm"
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
      )}
      <div className={`min-w-0 max-w-[85%] space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-[13.5px] shadow-sm ${
            isUser
              ? 'rounded-br-md bg-[color:var(--brand-navy)] text-white'
              : 'rounded-bl-md border border-[color:var(--border)] bg-surface text-foreground'
          }`}
        >
          {msg.pending ? <TypingDots /> : <BubbleBody content={msg.content} isUser={isUser} />}
        </div>
        {!msg.pending && msg.actions && msg.actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {msg.actions.map((a, i) => (
              <ActionChip key={i} action={a} onAction={onAction} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/** Render the assistant's reply with light formatting: paragraphs, dash-bullets, numbered steps. */
function BubbleBody({ content, isUser }: { content: string; isUser: boolean }) {
  const muted = isUser ? 'text-white/75' : 'text-muted'
  // Split on blank lines to create paragraphs.
  const paragraphs = content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  return (
    <div className="space-y-2 leading-[1.55]">
      {paragraphs.map((para, idx) => {
        const lines = para.split('\n').map((l) => l.trim())
        const allDash = lines.length > 1 && lines.every((l) => /^(—|-)\s+/.test(l))
        const allNumbered = lines.length > 1 && lines.every((l) => /^\d+\.\s+/.test(l))
        if (allDash) {
          return (
            <ul key={idx} className="space-y-1">
              {lines.map((l, i) => (
                <li key={i} className="flex gap-2">
                  <span className={`mt-[2px] inline-block h-1.5 w-1.5 shrink-0 rounded-full ${isUser ? 'bg-white/60' : 'bg-[color:var(--brand-red)]'}`} aria-hidden />
                  <span>{l.replace(/^(—|-)\s+/, '')}</span>
                </li>
              ))}
            </ul>
          )
        }
        if (allNumbered) {
          return (
            <ol key={idx} className="space-y-1">
              {lines.map((l, i) => {
                const m = l.match(/^(\d+)\.\s+(.*)$/)
                return (
                  <li key={i} className="flex gap-2">
                    <span className={`mt-[1px] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${isUser ? 'bg-white/15 text-white' : 'bg-[color:var(--brand-red)]/10 text-[color:var(--brand-red)]'}`}>
                      {m ? m[1] : i + 1}
                    </span>
                    <span>{m ? m[2] : l}</span>
                  </li>
                )
              })}
            </ol>
          )
        }
        // Plain paragraph with inline newlines preserved as soft breaks
        return (
          <p key={idx} className="whitespace-pre-wrap">
            {para}
          </p>
        )
      })}
      {/* subtle metadata line for assistant bubbles */}
      {!isUser && (
        <p className={`pt-0.5 text-[10px] uppercase tracking-[0.12em] ${muted}`}>Assistant FCI</p>
      )}
    </div>
  )
}

function ActionChip({ action, onAction }: { action: Action; onAction: (a: Action) => void }) {
  const primary = action.kind === 'open-lead-form' || action.kind === 'open-whatsapp'
  const label = action.kind === 'suggest' ? action.text : action.label
  return (
    <button
      type="button"
      onClick={() => onAction(action)}
      className={
        primary
          ? 'inline-flex items-center gap-1.5 rounded-full bg-[color:var(--brand-red)] px-3 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[color:var(--brand-red-600)]'
          : 'inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-surface px-3 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-surface-muted'
      }
    >
      {action.kind === 'open-link' && <span aria-hidden>↗</span>}
      {label}
    </button>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-0.5" aria-label="typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block h-1.5 w-1.5 rounded-full bg-muted"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

function LeadForm({
  locale,
  onCancel,
  onSubmit,
}: {
  locale: string
  onCancel: () => void
  onSubmit: (p: { name: string; email: string; phone?: string }) => Promise<void>
}) {
  const t = useTranslations('assistant.lead')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setError(null)
        setSubmitting(true)
        try {
          await onSubmit({ name: name.trim(), email: email.trim(), phone: phone.trim() })
        } catch {
          setError(locale === 'fr' ? "Échec de l'envoi. Réessayez." : 'Submission failed. Try again.')
        } finally {
          setSubmitting(false)
        }
      }}
      className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
    >
      <p className="text-sm text-foreground">{t('intro')}</p>
      <Field label={t('name')} value={name} onChange={setName} required autoFocus />
      <Field label={t('email')} type="email" value={email} onChange={setEmail} required />
      <Field label={t('phone')} value={phone} onChange={setPhone} hint={t('phoneHint')} />
      {error && (
        <p className="rounded-lg bg-[color:var(--brand-red)]/10 px-3 py-2 text-xs text-[color:var(--brand-red)]">
          {error}
        </p>
      )}
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-[color:var(--border)] bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface-muted"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={submitting || !name.trim() || !email.trim()}
          className="rounded-full bg-[color:var(--brand-red)] px-4 py-2 text-xs font-semibold text-white hover:bg-[color:var(--brand-red-600)] disabled:opacity-60"
        >
          {submitting ? t('submitting') : t('submit')}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  autoFocus,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  autoFocus?: boolean
  hint?: string
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoFocus={autoFocus}
        className="w-full rounded-xl border border-[color:var(--border)] bg-background px-3 py-2 text-sm text-foreground focus:border-[color:var(--brand-navy)] focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]/40"
      />
      {hint && <span className="block text-[10px] text-muted">{hint}</span>}
    </label>
  )
}
