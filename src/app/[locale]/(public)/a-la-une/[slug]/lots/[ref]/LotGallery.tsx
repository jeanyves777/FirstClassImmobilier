'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type Photo = { url: string; alt: string }

export function LotGallery({ photos }: { photos: Photo[] }) {
  const [index, setIndex] = useState(0)
  if (photos.length === 0) return null
  const active = photos[index]

  return (
    <div className="grid gap-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-[color:var(--border)] bg-surface-muted">
        <Image
          src={active.url}
          alt={active.alt}
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover"
        />
      </div>
      {photos.length > 1 && (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
          {photos.map((p, i) => (
            <button
              key={p.url}
              type="button"
              onClick={() => setIndex(i)}
              aria-pressed={i === index}
              className={cn(
                'relative aspect-square overflow-hidden rounded-xl border transition',
                i === index
                  ? 'border-[color:var(--brand-red)] ring-2 ring-[color:var(--brand-red)]/30'
                  : 'border-[color:var(--border)] opacity-80 hover:opacity-100',
              )}
            >
              <Image src={p.url} alt={p.alt} fill sizes="15vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
