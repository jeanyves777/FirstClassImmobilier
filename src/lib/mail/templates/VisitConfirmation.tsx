import { Heading, Section, Text } from '@react-email/components'
import { CtaButton, InfoRow, Layout } from './Layout'
import type { Locale } from '@/i18n/routing'

type Props = {
  locale: Locale
  visitorName: string
  programName: string
  lotReference?: string | null
  scheduledAt: Date
  meetingPoint?: string | null
  agentName?: string | null
  agentEmail?: string | null
  programUrl?: string | null
}

export function VisitConfirmation({
  locale,
  visitorName,
  programName,
  lotReference,
  scheduledAt,
  meetingPoint,
  agentName,
  agentEmail,
  programUrl,
}: Props) {
  const fr = locale === 'fr'
  const when = scheduledAt.toLocaleString(fr ? 'fr-FR' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  return (
    <Layout
      preview={
        fr
          ? `Votre visite pour ${programName} est confirmée — ${when}`
          : `Your visit for ${programName} is confirmed — ${when}`
      }
    >
      <Text className="m-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C8102E]">
        {fr ? 'Visite confirmée' : 'Visit confirmed'}
      </Text>
      <Heading className="m-0 mt-2 font-serif text-2xl font-semibold text-[#0b1324]">
        {fr ? `Bonjour ${visitorName},` : `Hello ${visitorName},`}
      </Heading>
      <Text className="mt-4 text-sm leading-relaxed text-[#334155]">
        {fr
          ? `Votre visite sur le programme ${programName} est confirmée. Vous trouverez les détails ci-dessous ainsi qu\u2019un fichier .ics à ajouter à votre agenda (pièce jointe).`
          : `Your visit to ${programName} is confirmed. Details below — a .ics file is attached so you can add it to your calendar.`}
      </Text>

      <Section className="mt-6">
        <InfoRow label={fr ? 'Quand' : 'When'} value={when} />
        <InfoRow label={fr ? 'Programme' : 'Program'} value={programName} />
        {lotReference && (
          <InfoRow label={fr ? 'Lot' : 'Lot'} value={lotReference} />
        )}
        {meetingPoint && (
          <InfoRow
            label={fr ? 'Point de rendez-vous' : 'Meeting point'}
            value={meetingPoint}
          />
        )}
        {agentName && (
          <InfoRow
            label={fr ? 'Agent FCI' : 'FCI agent'}
            value={agentEmail ? `${agentName} · ${agentEmail}` : agentName}
          />
        )}
      </Section>

      {programUrl && (
        <Section className="mt-6 text-center">
          <CtaButton href={programUrl} tone="red">
            {fr ? 'Revoir le programme' : 'View the program'}
          </CtaButton>
        </Section>
      )}

      <Text className="mt-6 text-xs leading-relaxed text-[#6b7280]">
        {fr
          ? 'Un empêchement ? Répondez à cet e-mail ou écrivez-nous sur WhatsApp — nous replanifierons sans frais.'
          : 'Something came up? Reply to this email or ping us on WhatsApp — we\u2019ll reschedule at no cost.'}
      </Text>
    </Layout>
  )
}
