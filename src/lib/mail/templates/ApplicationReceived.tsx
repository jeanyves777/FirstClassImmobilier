import { Heading, Section, Text } from '@react-email/components'
import { InfoRow, Layout } from './Layout'

type Props = {
  locale: 'fr' | 'en'
  applicantName: string
  applicantEmail: string
  applicantPhone: string
  message: string
  /** Optional — for the admin-facing copy. */
  audience: 'applicant' | 'admin'
}

export function ApplicationReceived({
  locale,
  applicantName,
  applicantEmail,
  applicantPhone,
  message,
  audience,
}: Props) {
  const fr = locale === 'fr'

  if (audience === 'admin') {
    return (
      <Layout preview={`[FCI] Nouvelle candidature : ${applicantName}`}>
        <Text className="m-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C8102E]">
          Nouvelle candidature
        </Text>
        <Heading className="m-0 mt-2 font-serif text-2xl font-semibold text-[#0b1324]">
          {applicantName}
        </Heading>
        <Section className="mt-6">
          <InfoRow label="E-mail" value={applicantEmail} />
          <InfoRow label="Téléphone" value={applicantPhone} />
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

  return (
    <Layout
      preview={
        fr
          ? `Nous avons bien reçu votre candidature, ${applicantName}`
          : `We received your application, ${applicantName}`
      }
    >
      <Text className="m-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C8102E]">
        {fr ? 'Candidature reçue' : 'Application received'}
      </Text>
      <Heading className="m-0 mt-2 font-serif text-2xl font-semibold text-[#0b1324]">
        {fr ? `Merci ${applicantName} !` : `Thanks ${applicantName}!`}
      </Heading>
      <Text className="mt-4 text-sm leading-relaxed text-[#334155]">
        {fr
          ? 'Votre candidature est bien enregistrée. Notre équipe RH l\u2019étudie et revient vers vous sous 5 jours ouvrés avec un retour — qu\u2019il soit positif ou non, nous vous tenons au courant.'
          : 'Your application is safely on file. Our HR team reviews it and gets back to you within 5 working days — positive or not, we\u2019ll let you know.'}
      </Text>
      <Section className="mt-6 rounded-xl bg-[#f4f2ec] p-4">
        <Text className="m-0 text-[11px] font-semibold uppercase tracking-wider text-[#6b7280]">
          {fr ? 'Votre message' : 'Your message'}
        </Text>
        <Text className="m-0 mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#0b1324]">
          {message}
        </Text>
      </Section>
    </Layout>
  )
}
