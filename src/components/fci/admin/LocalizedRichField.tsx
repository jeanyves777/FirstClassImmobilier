'use client'

import { useEffect, useState } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { cn } from '@/lib/utils'

type LocalizedValue = { fr: string; en: string }

export function LocalizedRichField({
  name,
  label,
  defaultValue,
  required,
  errors,
  hint,
}: {
  name: string
  label: string
  defaultValue?: LocalizedValue | null
  required?: boolean
  errors?: string[]
  hint?: string
}) {
  const [tab, setTab] = useState<'fr' | 'en'>('fr')
  const [fr, setFr] = useState(defaultValue?.fr ?? '')
  const [en, setEn] = useState(defaultValue?.en ?? '')
  const json = JSON.stringify({ fr, en })

  // Single editor instance; content swaps when tab changes.
  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3, 4] },
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
          autolink: true,
        }),
      ],
      content: tab === 'fr' ? fr : en,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class:
            'rich-text min-h-[160px] w-full rounded-xl border border-[color:var(--border)] bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)]/40',
        },
      },
      onUpdate({ editor }) {
        const html = editor.getHTML()
        const clean = html === '<p></p>' ? '' : html
        if (tab === 'fr') setFr(clean)
        else setEn(clean)
      },
    },
    [tab],
  )

  useEffect(() => {
    if (!editor) return
    const next = tab === 'fr' ? fr : en
    if (editor.getHTML() !== (next || '<p></p>')) {
      editor.commands.setContent(next || '', false)
    }
  }, [tab, editor, fr, en])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-medium uppercase tracking-wider text-muted">
          {label} {required && <span className="text-[color:var(--brand-red)]">*</span>}
        </label>
        <div role="tablist" className="inline-flex rounded-full border border-[color:var(--border)] bg-surface p-0.5 text-[10px] font-semibold uppercase tracking-wider">
          {(['fr', 'en'] as const).map((l) => (
            <button
              key={l}
              type="button"
              role="tab"
              aria-selected={tab === l}
              onClick={() => setTab(l)}
              className={cn(
                'rounded-full px-2.5 py-1 transition-colors',
                tab === l ? 'bg-[color:var(--brand-navy)] text-white' : 'text-muted hover:text-foreground',
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <Toolbar editor={editor} />
      <EditorContent editor={editor} />

      <input type="hidden" name={name} value={json} />
      {hint && <p className="text-[11px] text-muted">{hint}</p>}
      {errors?.length ? <p className="text-xs text-[color:var(--brand-red)]">{errors[0]}</p> : null}
    </div>
  )
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null

  const btn = (opts: {
    active?: boolean
    onClick: () => void
    label: string
    disabled?: boolean
  }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={opts.onClick}
      disabled={opts.disabled}
      className={cn(
        'rounded-md px-2 py-1 text-xs font-semibold transition-colors',
        opts.active
          ? 'bg-[color:var(--brand-navy)] text-white'
          : 'text-foreground hover:bg-surface-muted',
        opts.disabled && 'opacity-40',
      )}
    >
      {opts.label}
    </button>
  )

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-xl border border-[color:var(--border)] bg-surface-muted/60 px-2 py-1.5">
      {btn({
        active: editor.isActive('bold'),
        onClick: () => editor.chain().focus().toggleBold().run(),
        label: 'B',
      })}
      {btn({
        active: editor.isActive('italic'),
        onClick: () => editor.chain().focus().toggleItalic().run(),
        label: 'I',
      })}
      {btn({
        active: editor.isActive('heading', { level: 2 }),
        onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        label: 'H2',
      })}
      {btn({
        active: editor.isActive('heading', { level: 3 }),
        onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        label: 'H3',
      })}
      <span className="mx-1 h-4 w-px bg-[color:var(--border)]" aria-hidden />
      {btn({
        active: editor.isActive('bulletList'),
        onClick: () => editor.chain().focus().toggleBulletList().run(),
        label: '• List',
      })}
      {btn({
        active: editor.isActive('orderedList'),
        onClick: () => editor.chain().focus().toggleOrderedList().run(),
        label: '1. List',
      })}
      {btn({
        active: editor.isActive('blockquote'),
        onClick: () => editor.chain().focus().toggleBlockquote().run(),
        label: '❝',
      })}
      <span className="mx-1 h-4 w-px bg-[color:var(--border)]" aria-hidden />
      {btn({
        active: editor.isActive('link'),
        onClick: () => {
          const prev = editor.getAttributes('link').href as string | undefined
          const url = window.prompt('URL (https://… or empty to remove)', prev ?? '')
          if (url === null) return
          if (url === '') {
            editor.chain().focus().unsetLink().run()
            return
          }
          editor.chain().focus().setLink({ href: url }).run()
        },
        label: 'Link',
      })}
      <span className="mx-1 h-4 w-px bg-[color:var(--border)]" aria-hidden />
      {btn({
        onClick: () => editor.chain().focus().undo().run(),
        label: '↶',
        disabled: !editor.can().undo(),
      })}
      {btn({
        onClick: () => editor.chain().focus().redo().run(),
        label: '↷',
        disabled: !editor.can().redo(),
      })}
    </div>
  )
}
