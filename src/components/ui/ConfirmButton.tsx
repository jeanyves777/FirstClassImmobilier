'use client'

import { useState, useRef } from 'react'
import { Button } from './Button'
import { Dialog, DialogFooter, DialogHeader, useDialogId } from './Dialog'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'

/**
 * Button that gates a server-action form submission behind a confirm dialog.
 *
 * Example:
 *   <ConfirmButton
 *     action={deleteProgram}
 *     hiddenFields={{ id: program.id, locale }}
 *     title="Delete program?"
 *     description="Removes all lots and media. Irreversible."
 *   >
 *     Delete program
 *   </ConfirmButton>
 */
export function ConfirmButton({
  action,
  hiddenFields,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'danger',
  children,
  size = 'md',
  fullWidth,
}: {
  action: (formData: FormData) => Promise<void> | void
  hiddenFields?: Record<string, string | number | undefined | null>
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: Variant
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const formRef = useRef<HTMLFormElement | null>(null)
  const labelId = useDialogId()

  const submit = () => {
    setPending(true)
    // Server action handles redirect / revalidate
    formRef.current?.requestSubmit()
  }

  return (
    <>
      <Button variant={variant} size={size} fullWidth={fullWidth} onClick={() => setOpen(true)} type="button">
        {children}
      </Button>

      <Dialog open={open} onOpenChange={(v) => !pending && setOpen(v)} labelledBy={labelId} size="sm">
        <DialogHeader id={labelId} title={title} description={description} />
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button variant={variant} loading={pending} onClick={submit}>
            {confirmLabel ?? children}
          </Button>
        </DialogFooter>

        <form ref={formRef} action={action} className="hidden">
          {Object.entries(hiddenFields ?? {}).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v == null ? '' : String(v)} />
          ))}
        </form>
      </Dialog>
    </>
  )
}
