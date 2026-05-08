import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'
import type { ReactNode } from 'react'

/**
 * Shared FCI email layout — brand navy header, white content card, grey footer.
 *
 * Accepts a `preview` string that becomes the preheader (the text shown in
 * inbox clients next to the subject). Callers pass their body via `children`.
 */
export function Layout({
  preview,
  children,
  footerNote,
}: {
  preview: string
  children: ReactNode
  footerNote?: string
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-[#f4f2ec] font-sans text-[#0b1324]">
          <Container className="mx-auto my-6 max-w-[600px]">
            {/* Brand header */}
            <Section className="rounded-t-2xl bg-[#1B2C4D] px-8 py-6">
              <table cellPadding={0} cellSpacing={0} className="w-full">
                <tr>
                  <td className="align-middle">
                    <Text className="m-0 text-[11px] font-bold uppercase tracking-[0.28em] text-[#C8102E]">
                      FirstClass Immobilier
                    </Text>
                    <Text className="m-0 mt-1 text-xs font-medium text-white/80">
                      Promoteur Immobilier Agréé · Abidjan
                    </Text>
                  </td>
                </tr>
              </table>
            </Section>

            {/* Content card */}
            <Section className="rounded-b-2xl bg-white px-8 py-8">
              {children}
            </Section>

            {/* Footer */}
            <Section className="mt-4 px-2">
              <Hr className="my-4 border-[#e7e3d8]" />
              <Text className="m-0 text-center text-[11px] leading-relaxed text-[#6b7280]">
                {footerNote ??
                  'Cet e-mail vous est adressé automatiquement. / This is an automated message.'}
              </Text>
              <Text className="m-0 mt-1 text-center text-[11px] text-[#6b7280]">
                © {new Date().getFullYear()} FirstClass Immobilier · Abidjan,
                Côte d\u2019Ivoire
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

/**
 * Reusable CTA button for emails — inline-styled (Tailwind classes aren't
 * guaranteed in every mail client, so the key colors are inline).
 */
export function CtaButton({
  href,
  children,
  tone = 'red',
}: {
  href: string
  children: ReactNode
  tone?: 'red' | 'navy'
}) {
  const bg = tone === 'red' ? '#C8102E' : '#1B2C4D'
  return (
    <a
      href={href}
      style={{
        display: 'inline-block',
        backgroundColor: bg,
        color: '#ffffff',
        padding: '12px 24px',
        borderRadius: '999px',
        fontSize: '14px',
        fontWeight: 600,
        textDecoration: 'none',
      }}
    >
      {children}
    </a>
  )
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <table cellPadding={0} cellSpacing={0} className="w-full border-collapse">
      <tr>
        <td className="border-b border-[#e7e3d8] py-2 align-top">
          <Text className="m-0 text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
            {label}
          </Text>
        </td>
        <td className="border-b border-[#e7e3d8] py-2 text-right align-top">
          <Text className="m-0 text-sm text-[#0b1324]">{value}</Text>
        </td>
      </tr>
    </table>
  )
}
