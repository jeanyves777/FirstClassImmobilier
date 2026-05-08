import { Heading, Section, Text } from '@react-email/components'
import { InfoRow, Layout } from './Layout'

type Props = {
  /** Locale the buyer reserved in — drives the email language. */
  locale: 'fr' | 'en'
  buyerName: string
  programName: string
  lotReference: string
  price: string
  /**
   * If `true`, renders the admin-facing copy (new reservation landed);
   * otherwise renders the buyer-facing confirmation copy.
   */
  audience: 'buyer' | 'admin'
}

export function ReservationReceived({
  locale,
  buyerName,
  programName,
  lotReference,
  price,
  audience,
}: Props) {
  const fr = locale === 'fr'
  const preview =
    audience === 'buyer'
      ? fr
        ? `Votre demande de réservation ${lotReference} est enregistrée`
        : `Your reservation request ${lotReference} is saved`
      : `[FCI] Nouvelle réservation : ${buyerName} · ${lotReference}`

  const eyebrow =
    audience === 'buyer'
      ? fr
        ? 'Demande enregistrée'
        : 'Request received'
      : 'Nouvelle réservation'

  const heading =
    audience === 'buyer'
      ? fr
        ? `Merci ${buyerName}, c\u2019est noté.`
        : `Thanks ${buyerName}, we\u2019ve got it.`
      : `Nouveau dossier — ${buyerName}`

  const body =
    audience === 'buyer'
      ? fr
        ? `Votre demande de réservation pour le lot ${lotReference} du programme ${programName} est enregistrée. Un agent FCI la confirme sous 24 heures ouvrées et vous envoie le contrat de réservation ainsi que les instructions pour l\u2019acompte.`
        : `Your reservation request for lot ${lotReference} in ${programName} is on file. An FCI agent confirms within 24 working hours and sends the reservation contract with deposit instructions.`
      : `Un nouveau lot vient d\u2019être pré-réservé. Ouvrez l\u2019espace admin pour confirmer la réservation et lancer la conversion en vente.`

  return (
    <Layout preview={preview}>
      <Text className="m-0 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C8102E]">
        {eyebrow}
      </Text>
      <Heading className="m-0 mt-2 font-serif text-2xl font-semibold text-[#0b1324]">
        {heading}
      </Heading>
      <Text className="mt-4 text-sm leading-relaxed text-[#334155]">{body}</Text>

      <Section className="mt-6">
        <InfoRow label={fr ? 'Programme' : 'Program'} value={programName} />
        <InfoRow label={fr ? 'Lot' : 'Lot'} value={lotReference} />
        <InfoRow label={fr ? 'Prix indicatif' : 'Indicative price'} value={price} />
        {audience === 'admin' && (
          <InfoRow label="Acquéreur" value={buyerName} />
        )}
      </Section>

      {audience === 'buyer' && (
        <Text className="mt-6 text-xs leading-relaxed text-[#6b7280]">
          {fr
            ? 'Bon à savoir : la réservation ne devient ferme qu\u2019à la signature du contrat et au versement de l\u2019acompte. Vous pouvez suivre son avancement depuis votre espace client.'
            : 'Good to know: a reservation only becomes firm once the contract is signed and the deposit paid. Track its status from your client portal.'}
        </Text>
      )}
    </Layout>
  )
}
