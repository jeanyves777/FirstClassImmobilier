'use client'

import { useState } from 'react'
import { PortalSidebar } from './PortalSidebar'
import { AppTopBar } from './AppTopBar'

type Role = 'BUYER' | 'PROSPECT' | 'APPLICANT' | 'VISITOR' | 'STAFF' | 'ADMIN'

export function PortalShell({
  user,
  onSignOut,
  badges,
  viewSiteLabel,
  children,
}: {
  user: { name?: string | null; email?: string | null; role: Role }
  onSignOut: () => Promise<void>
  badges?: { messages?: number }
  viewSiteLabel: string
  children: React.ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex min-h-dvh flex-col bg-background lg:flex-row">
      <PortalSidebar
        user={user}
        badges={badges}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopBar
          variant="portal"
          user={user}
          viewSiteLabel={viewSiteLabel}
          onToggleMenu={() => setMenuOpen((v) => !v)}
          onSignOut={onSignOut}
        />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-8 sm:py-12">
          {children}
        </main>
      </div>
    </div>
  )
}
