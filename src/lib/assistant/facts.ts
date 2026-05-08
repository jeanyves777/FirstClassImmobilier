import { prisma } from '@/lib/db'
import { getSiteConfig } from '@/lib/site'
import { tr } from '@/lib/zod/localized'
import type { Locale } from '@/i18n/routing'

export type ProgramFact = {
  id: string
  slug: string
  name: string
  tagline: string
  zone: string
  type: string
  availableLots: number
  totalLots: number
  minPriceFCFA: bigint | null
  maxPriceFCFA: bigint | null
}

export type AssistantFacts = {
  locale: Locale
  phone: string
  mobile: string
  whatsapp: string
  email: string
  address: string
  hours: string
  yearsExperience: number
  satisfiedClients: number
  acdDelivered: number
  housesBuilt: number
  landsSold: number
  programs: ProgramFact[]
  /** Local-hour on the server (Abidjan, UTC+0). Used for time-of-day greetings. */
  hour: number
}

export async function loadFacts(locale: Locale): Promise<AssistantFacts> {
  const [site, stats, programs] = await Promise.all([
    getSiteConfig(),
    prisma.siteStats.findUnique({ where: { id: 1 } }),
    prisma.program.findMany({
      where: { status: { in: ['ON_SALE', 'DELIVERED'] } },
      orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
      include: { lots: { select: { status: true, priceFCFA: true } } },
    }),
  ])

  const programFacts: ProgramFact[] = programs.map((p) => {
    const available = p.lots.filter((l) => l.status === 'available')
    const prices = available
      .map((l) => l.priceFCFA)
      .filter((v): v is bigint => typeof v === 'bigint')
    const min = prices.length ? prices.reduce((a, b) => (a < b ? a : b)) : null
    const max = prices.length ? prices.reduce((a, b) => (a > b ? a : b)) : null
    return {
      id: p.id,
      slug: p.slug,
      name: tr(p.name, locale),
      tagline: tr(p.tagline, locale),
      zone: p.zone,
      type: p.type,
      availableLots: available.length,
      totalLots: p.lots.length,
      minPriceFCFA: min,
      maxPriceFCFA: max,
    }
  })

  return {
    locale,
    hour: new Date().getUTCHours(),
    phone: site.phone,
    mobile: site.mobile,
    whatsapp: site.whatsapp,
    email: site.email,
    address: site.address,
    hours: site.hours[locale],
    yearsExperience: stats?.yearsExperience ?? 8,
    satisfiedClients: stats?.satisfiedClients ?? 350,
    acdDelivered: stats?.acdDelivered ?? 380,
    housesBuilt: stats?.housesBuilt ?? 57,
    landsSold: stats?.landsSold ?? 450,
    programs: programFacts,
  }
}
