import { Heading, Section, Text } from '@react-email/components'
import { InfoRow, Layout } from './Layout'

type Props = {
  /** Displayed in the eyebrow, e.g. "Vos Avis", "Formulaire site", "Assistant". */
  channel: string
  fullName: string
  email: string
  phone?: string | null
  message: string
}

/**
 * Admin-facing notification email for any form submission that creates a Lead.
 * Deliberately generic so we can re-use it for the Contacts > Vos Avis form,
 * the home-page newsletter, etc.
 */
export function LeadNotification({ channel, fullName, email, phone, message }: Props) {
  return (
    <Layout preview={`[${channel}] ${fullName}`}>
      <Text className="m-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C8102E]">
        Nouveau message — {channel}
      </Text>
      <Heading className="m-0 mt-2 font-serif text-2xl font-semibold text-[#0b1324]">
        {fullName}
      </Heading>

      <Section className="mt-6">
        <InfoRow label="E-mail" value={email} />
        {phone && <InfoRow label="Téléphone" value={phone} />}
      </Section>

      <Section className="mt-6 rounded-xl bg-[#f4f2ec] p-4">
        <Text className="m-0 text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
          Message
        </Text>
        <Text className="m-0 mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#0b1324]">
          {message}
        </Text>
      </Section>
    </Layout>
  )
}
