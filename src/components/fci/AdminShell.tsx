'use client'

import { useState } from 'react'
import { AdminSidebar } from './AdminSidebar'
import { AppTopBar } from './AppTopBar'

export function AdminShell({
  user,
  onSignOut,
  badges,
  viewSiteLabel,
  children,
}: {
  user: { name?: string | null; email?: string | null; role?: string }
  onSignOut: () => Promise<void>
  badges?: { chat?: number }
  viewSiteLabel: string
  children: React.ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex min-h-dvh flex-col bg-background lg:flex-row">
      <AdminSidebar
        user={user}
        badges={badges}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopBar
          variant="admin"
          user={user}
          viewSiteLabel={viewSiteLabel}
          onToggleMenu={() => setMenuOpen((v) => !v)}
          onSignOut={onSignOut}
        />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8 sm:py-12">
          {children}
        </main>
      </div>
    </div>
  )
}
