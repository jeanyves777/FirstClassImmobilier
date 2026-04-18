import { prisma } from '@/lib/db'

/**
 * Canonical document checklist a buyer must provide before handover.
 * Items are created with status="required"; admin flips them as docs come in.
 */
export const DEFAULT_DOCUMENT_PACKET = [
  { kind: 'id', fr: 'Pièce d\u2019identité', en: 'Government-issued ID' },
  { kind: 'proof-address', fr: 'Justificatif de domicile', en: 'Proof of address' },
  { kind: 'reservation-contract', fr: 'Contrat de réservation', en: 'Reservation contract' },
  { kind: 'down-payment-receipt', fr: 'Reçu d\u2019acompte', en: 'Down payment receipt' },
  { kind: 'sales-deed', fr: 'Acte de vente', en: 'Sales deed' },
  { kind: 'acd', fr: 'ACD — Attestation de Concession Définitive', en: 'ACD (land title)' },
  { kind: 'final-handover', fr: 'Procès-verbal de remise des clés', en: 'Handover minutes' },
] as const

/** Default construction milestones — applied in order. */
export const DEFAULT_MILESTONES = [
  { fr: 'Réservation confirmée', en: 'Reservation confirmed' },
  { fr: 'Acte signé', en: 'Deed signed' },
  { fr: 'Acompte versé', en: 'Down payment received' },
  { fr: 'Travaux démarrés', en: 'Construction started' },
  { fr: 'Gros œuvre', en: 'Structural work' },
  { fr: 'Second œuvre', en: 'Finishing work' },
  { fr: 'Réception / Remise des clés', en: 'Handover' },
  { fr: 'ACD délivré', en: 'ACD delivered' },
] as const

export async function seedSaleArtifacts(saleId: string) {
  const [requirements, milestones] = await Promise.all([
    prisma.documentRequirement.createMany({
      data: DEFAULT_DOCUMENT_PACKET.map((d) => ({
        saleId,
        kind: d.kind,
        label: JSON.stringify({ fr: d.fr, en: d.en }),
        status: 'required',
      })),
    }),
    prisma.milestone.createMany({
      data: DEFAULT_MILESTONES.map((m) => ({
        saleId,
        label: JSON.stringify({ fr: m.fr, en: m.en }),
      })),
    }),
  ])
  return { requirements: requirements.count, milestones: milestones.count }
}

export const SALE_STAGES = [
  'draft',
  'contract-sent',
  'signed',
  'in-progress',
  'acd-pending',
  'completed',
  'cancelled',
] as const

export type SaleStage = (typeof SALE_STAGES)[number]

/** Approximate overall completion % driven by stage + construction + docs approved. */
export function saleProgress({
  stage,
  constructionProgress,
  docsApproved,
  docsTotal,
}: {
  stage: string
  constructionProgress: number
  docsApproved: number
  docsTotal: number
}): number {
  const stageWeight: Record<string, number> = {
    draft: 0,
    'contract-sent': 10,
    signed: 25,
    'in-progress': 40,
    'acd-pending': 75,
    completed: 100,
    cancelled: 0,
  }
  const base = stageWeight[stage] ?? 0
  if (stage === 'completed') return 100
  if (stage === 'cancelled') return 0
  const docsPct = docsTotal > 0 ? (docsApproved / docsTotal) * 15 : 0
  const buildPct = (constructionProgress / 100) * 35
  return Math.min(100, Math.round(base * 0.5 + docsPct + buildPct))
}
