import { Heading, Section, Text } from '@react-email/components'
import { InfoRow, Layout } from './Layout'

type Props = {
  name: string
  email: string
  phone?: string | null
  context?: string | null
  locale: string
}

/**
 * Admin-facing email triggered when a visitor clicks "Talk to an agent"
 * inside the FCI assistant chat widget and submits the lead form.
 */
export function AssistantLead({ name, email, phone, context, locale }: Props) {
  return (
    <Layout preview={`[Assistant] Nouveau contact : ${name}`}>
      <Text className="m-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C8102E]">
        Assistant — nouveau contact
      </Text>
      <Heading className="m-0 mt-2 font-serif text-2xl font-semibold text-[#0b1324]">
        {name}
      </Heading>
      <Text className="mt-4 text-sm leading-relaxed text-[#334155]">
        Un visiteur a demandé à être recontacté depuis l\u2019assistant du site. Voici ses coordonnées et les derniers échanges du chat.
      </Text>

      <Section className="mt-6">
        <InfoRow label="E-mail" value={email} />
        {phone && <InfoRow label="Téléphone" value={phone} />}
        <InfoRow label="Langue du site" value={locale.toUpperCase()} />
      </Section>

      {context && (
        <Section className="mt-6 rounded-xl bg-[#f4f2ec] p-4">
          <Text className="m-0 text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
            Contexte de la conversation (10 derniers tours)
          </Text>
          <Text className="m-0 mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#0b1324]">
            {context}
          </Text>
        </Section>
      )}
    </Layout>
  )
}
