import Link from 'next/link'

export default function RootNotFound() {
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
          <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
            <p style={{ color: '#C8102E', fontSize: '0.75rem', letterSpacing: '0.2em', fontWeight: 600 }}>
              FIRSTCLASS IMMOBILIER
            </p>
            <h1 style={{ fontSize: '3rem', margin: '0.75rem 0', fontWeight: 600 }}>404</h1>
            <p style={{ color: '#6b7280', lineHeight: 1.5, marginBottom: '2rem' }}>
              Page introuvable. / Page not found.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/fr"
                style={{
                  background: '#1B2C4D',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '999px',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                Accueil (FR)
              </Link>
              <Link
                href="/en"
                style={{
                  background: 'transparent',
                  color: '#1B2C4D',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '999px',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  border: '1px solid #e7e3d8',
                }}
              >
                Home (EN)
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
