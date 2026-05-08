'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#F7F5F0',
            color: '#0B1324',
            padding: '2rem',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '32rem' }}>
            <p style={{ color: '#C8102E', fontSize: '0.75rem', letterSpacing: '0.2em', fontWeight: 600 }}>
              FIRSTCLASS IMMOBILIER
            </p>
            <h1 style={{ fontSize: '2rem', margin: '0.75rem 0', fontWeight: 600 }}>
              Erreur critique / Critical error
            </h1>
            <p style={{ color: '#6b7280', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Une erreur inattendue est survenue. / An unexpected error occurred.
            </p>
            {error.digest && (
              <p
                style={{
                  display: 'inline-block',
                  background: '#f1eee7',
                  borderRadius: '999px',
                  padding: '0.35rem 0.8rem',
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  marginBottom: '1.5rem',
                }}
              >
                Ref: {error.digest}
              </p>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => reset()}
                style={{
                  background: '#1B2C4D',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '999px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                Réessayer / Retry
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/fr'
                }}
                style={{
                  background: 'transparent',
                  color: '#1B2C4D',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '999px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  border: '1px solid #e7e3d8',
                  cursor: 'pointer',
                }}
              >
                Accueil / Home
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
