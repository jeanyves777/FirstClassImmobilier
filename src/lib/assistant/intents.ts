/**
 * Rule-based intent engine for the FCI public assistant.
 *
 * Strictly deterministic: regex patterns match the latest user message
 * against known intents, then a response template is rendered from live
 * facts (programs, stats, contact info). A simple session context keeps
 * track of the last program discussed so follow-ups feel natural.
 */
import type { AssistantFacts, ProgramFact } from './facts'

export type ChatTurn = { role: 'user' | 'assistant'; content: string }

export type AssistantAction =
  | { kind: 'open-link'; href: string; label: string }
  | { kind: 'open-whatsapp'; label: string }
  | { kind: 'open-lead-form'; label: string }
  | { kind: 'suggest'; text: string }

export type AssistantReply = {
  reply: string
  actions: AssistantAction[]
  intent: string
}

/** Normalize accented FR text + lowercase, so a single regex catches both. */
function norm(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatFCFAShort(v: bigint, locale: string): string {
  const n = Number(v)
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(n % 1_000_000_000 === 0 ? 0 : 1)} Md FCFA`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)} M FCFA`
  return `${n.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US')} FCFA`
}

/** Look for a program name (or obvious alias) inside the message. */
function findProgram(message: string, programs: ProgramFact[]): ProgramFact | null {
  const m = norm(message)
  // First pass: full name inclusion.
  for (const p of programs) {
    const name = norm(p.name)
    if (name.length >= 3 && m.includes(name)) return p
  }
  // Second pass: each meaningful word of the program name.
  for (const p of programs) {
    const tokens = norm(p.name).split(' ').filter((t) => t.length >= 4)
    if (tokens.some((t) => m.includes(t))) return p
  }
  // Third pass: slug match.
  for (const p of programs) {
    if (m.includes(p.slug.toLowerCase().replace(/-/g, ' '))) return p
  }
  return null
}

/** Scan the full message history for the last program reference. */
function contextProgram(history: ChatTurn[], programs: ProgramFact[]): ProgramFact | null {
  for (let i = history.length - 1; i >= 0; i--) {
    const hit = findProgram(history[i].content, programs)
    if (hit) return hit
  }
  return null
}

// ──────────────────────────────────────────────────────────────────────────
//  Intent matchers — order matters. First match wins.
// ──────────────────────────────────────────────────────────────────────────

const INTENT_REGEX: Array<{ name: string; re: RegExp }> = [
  { name: 'greeting', re: /\b(bonjour|bonsoir|salut|hello|hi|hey|yo|coucou|bjr|good (morning|afternoon|evening))\b/ },
  { name: 'thanks', re: /\b(merci|thanks|thank you|thx|cool|parfait|super|top|great|nice)\b/ },
  { name: 'goodbye', re: /\b(au revoir|bye|goodbye|a bientot|a plus|see you|ciao)\b/ },
  { name: 'agent', re: /\b(agent|commercial|humain|human|representative|parler a|talk to|speak with|someone|call me|rappelez|contact me)\b/ },
  { name: 'whatsapp', re: /\b(whatsapp|whats'?app|wa|whatapp|whatsup)\b/ },
  { name: 'price', re: /\b(prix|cout|tarif|budget|combien|cost|how much|price|pricing|fcfa|cfa)\b/ },
  { name: 'visit', re: /\b(visite|visiter|visit|rendez[- ]?vous|appointment|book a visit|planifier|see in person|voir sur place)\b/ },
  { name: 'reserve', re: /\b(reserver|reservation|reserve|book a lot|acheter|buy|purchase|bloquer un lot)\b/ },
  { name: 'zone', re: /\b(zone|quartier|cocody|angre|abidjan|bingerville|riviera|grand[- ]?bassam|assinie|yopougon|port-bouet|treichville|ou se|where is|where are|location|emplacement|adresse)\b/ },
  { name: 'acd', re: /\b(acd|attestation|concession definitive|titre foncier|title deed|land title|ownership|propriete)\b/ },
  { name: 'process', re: /\b(etapes|processus|comment ca marche|how does it work|steps|demarche|procedure|comment proceder)\b/ },
  { name: 'payment', re: /\b(paiement|payment|echeancier|schedule|acompte|down ?payment|installments|mensualites)\b/ },
  { name: 'diaspora', re: /\b(diaspora|etranger|expatrie|from abroad|overseas|usa|canada|france|europe|remote|distance)\b/ },
  { name: 'contact-info', re: /\b(telephone|mobile|email|e-?mail|adresse|address|horaires|hours|ouverture|open)\b/ },
  { name: 'programs', re: /\b(programmes?|programs?|projets?|projects?|ce que vous (avez|offrez|proposez)|what do you (have|offer)|catalogue)\b/ },
]

function detectIntent(message: string, program: ProgramFact | null): string {
  const m = norm(message)
  if (program && /\b(prix|cost|combien|how much|fcfa|cfa)\b/.test(m)) return 'program-price'
  if (program && /\b(visite|visit|rendez|appointment)\b/.test(m)) return 'program-visit'
  if (program && /\b(reserver|reserve|acheter|buy)\b/.test(m)) return 'program-reserve'
  if (program) return 'program'
  for (const { name, re } of INTENT_REGEX) {
    if (re.test(m)) return name
  }
  return 'fallback'
}

// ──────────────────────────────────────────────────────────────────────────
//  Response templates — pick deterministically based on history length.
// ──────────────────────────────────────────────────────────────────────────

function pick<T>(options: T[], seed: number): T {
  return options[Math.abs(seed) % options.length]
}

function timeOfDay(facts: AssistantFacts): { fr: string; en: string } {
  const h = facts.hour
  if (h < 12) return { fr: 'Bonjour', en: 'Good morning' }
  if (h < 18) return { fr: 'Bon après-midi', en: 'Good afternoon' }
  return { fr: 'Bonsoir', en: 'Good evening' }
}

function greetingReply(facts: AssistantFacts, seed: number): AssistantReply {
  const tod = timeOfDay(facts)
  const count = facts.programs.length
  const fr = [
    `${tod.fr} ! 👋 Je suis l'assistant virtuel de FirstClass Immobilier — promoteur agréé avec ${facts.yearsExperience}+ ans d'expérience et plus de ${facts.acdDelivered} ACD délivrés. Nous avons ${count} programme${count > 1 ? 's' : ''} en commercialisation. Parlez-moi de votre projet : terrain, maison clé en main, ou juste en phase d'exploration ?`,
    `${tod.fr} ! Ravi de vous accueillir chez FCI. Notre équipe accompagne plus de ${facts.satisfiedClients} familles — de la diaspora comme d'Abidjan — de la réservation jusqu'à la remise des clés. Je peux répondre aux questions de prix, disponibilité, ACD, visites et démarches. Qu'est-ce qui vous amène ?`,
    `${tod.fr} et bienvenue ! Que vous cherchiez un terrain viabilisé, une villa clé en main ou simplement à comprendre comment fonctionne l'achat en Côte d'Ivoire, je suis là pour ça. Dites-moi ce qui vous intéresse en priorité.`,
  ]
  const en = [
    `${tod.en}! I'm the FirstClass Immobilier virtual assistant — a licensed developer with ${facts.yearsExperience}+ years of experience and ${facts.acdDelivered}+ ACD title deeds delivered. We have ${count} active program${count > 1 ? 's' : ''} right now. Tell me about your project — are you after land, a turn-key home, or just exploring?`,
    `${tod.en}! Welcome to FCI. Our team has helped over ${facts.satisfiedClients} families — from the diaspora and Abidjan — from reservation all the way to handover. I can answer questions on pricing, availability, ACD, visits and the buying process. What brings you here?`,
    `${tod.en} and welcome! Whether you're looking for a serviced plot, a turn-key villa, or just want to understand how buying real estate in Côte d'Ivoire works, I've got you covered. What would you like to know first?`,
  ]
  return {
    reply: pick(facts.locale === 'fr' ? fr : en, seed),
    actions: baseSuggestions(facts),
    intent: 'greeting',
  }
}

function thanksReply(facts: AssistantFacts, seed: number): AssistantReply {
  const fr = [
    `Avec plaisir — c'est exactement pour ça que je suis là. Je peux continuer sur un autre sujet (prix, ACD, visites, démarches) ou vous passer un agent humain si vous préférez.`,
    `De rien ! Autre question sur un programme en particulier, sur l'ACD, ou sur le processus de réservation ? Sinon un agent peut prendre le relais quand vous voulez.`,
    `Je vous en prie. Dites-moi si vous souhaitez approfondir un programme, planifier une visite, ou directement échanger avec un agent — tout est possible depuis ce chat.`,
  ]
  const en = [
    `My pleasure — that's exactly what I'm here for. I can keep going on any topic (pricing, ACD, visits, process) or hand you over to a human agent if you'd rather.`,
    `You're welcome! Any other question on a specific program, on the ACD, or on the reservation flow? Otherwise an agent can take over whenever you're ready.`,
    `Glad to help. Let me know if you want to dig into a program, book a visit, or talk to an agent — all of it's a click away inside this chat.`,
  ]
  return {
    reply: pick(facts.locale === 'fr' ? fr : en, seed),
    actions: [agentAction(facts), whatsappAction(facts)],
    intent: 'thanks',
  }
}

function goodbyeReply(facts: AssistantFacts, seed: number): AssistantReply {
  const fr = [
    `Au plaisir ! Notre équipe reste disponible ${facts.hours.toLowerCase()}. En attendant, vous pouvez aussi nous retrouver sur WhatsApp ou parcourir nos programmes quand vous voulez. Bonne suite de projet !`,
    `À bientôt ! Si une question surgit ce soir ou ce week-end, WhatsApp reste la voie la plus rapide. L'assistant sera ici aussi dès votre prochaine visite.`,
  ]
  const en = [
    `See you soon! Our team is available ${facts.hours.toLowerCase()}. Meanwhile you can always reach us on WhatsApp or browse our programs. All the best with your project!`,
    `Take care! If a question pops up tonight or this weekend, WhatsApp is the fastest channel. The assistant will also be here next time you visit.`,
  ]
  return {
    reply: pick(facts.locale === 'fr' ? fr : en, seed),
    actions: [whatsappAction(facts), agentAction(facts)],
    intent: 'goodbye',
  }
}

function agentReply(facts: AssistantFacts, seed: number): AssistantReply {
  const fr = [
    `Avec grand plaisir — c'est souvent plus efficace qu'un chatbot ! Deux options :\n\n1. Cliquez sur "Parler à un agent" ci-dessous, laissez-nous votre nom et votre e-mail, un commercial vous rappelle sous 24 h ouvrées.\n2. Cliquez sur l'icône WhatsApp en haut de ce chat pour échanger instantanément avec un humain.\n\nQuel canal préférez-vous ?`,
    `Bien sûr. Pour vous mettre en relation, on peut faire simple : laissez-moi votre nom et votre e-mail via le bouton ci-dessous — un agent dédié vous recontacte avec tous les éléments du programme qui vous intéresse. Si c'est urgent, WhatsApp est encore plus rapide.`,
    `Je transmets tout de suite. Une info utile : nos agents sont disponibles ${facts.hours.toLowerCase()}. Laissez vos coordonnées ci-dessous ou passez directement par WhatsApp — on s'adapte à votre rythme.`,
  ]
  const en = [
    `Glad to — it's often faster than a bot! Two options:\n\n1. Tap "Talk to an agent" below, leave your name and email, an advisor calls you back within 24 working hours.\n2. Tap the WhatsApp icon at the top of this chat for an instant human reply.\n\nWhich works better for you?`,
    `Sure thing. Simplest route: drop your name + email via the button below — a dedicated agent will get back with the full detail for the program you're interested in. If it's urgent, WhatsApp is even faster.`,
    `Passing you along. Useful context: our team is available ${facts.hours.toLowerCase()}. Leave your details below or ping us on WhatsApp — we adapt to your pace.`,
  ]
  return {
    reply: pick(facts.locale === 'fr' ? fr : en, seed),
    actions: [agentAction(facts), whatsappAction(facts)],
    intent: 'agent',
  }
}

function whatsappReply(facts: AssistantFacts): AssistantReply {
  return {
    reply:
      facts.locale === 'fr'
        ? `WhatsApp, excellente idée — c'est notre canal le plus réactif. Cliquez sur l'icône verte en haut de ce chat (ou sur le bouton ci-dessous) et vous êtes directement connecté à notre numéro officiel +${facts.whatsapp}. Précisez-nous le programme ou la zone qui vous intéresse, ça nous fait gagner du temps.`
        : `WhatsApp is a great call — it's our most reactive channel. Tap the green icon at the top of this chat (or the button below) and you'll be routed straight to our official number +${facts.whatsapp}. Tell us the program or zone you're eyeing so we can jump straight to the useful bit.`,
    actions: [whatsappAction(facts), agentAction(facts)],
    intent: 'whatsapp',
  }
}

function priceReply(facts: AssistantFacts, seed: number): AssistantReply {
  const priced = facts.programs.filter((p) => p.minPriceFCFA)
  if (!priced.length) {
    const fr = [
      `Les tarifs dépendent à la fois du programme, de la surface du lot, de la position (angle, vue, proximité des infrastructures) et du planning de paiement choisi. Plutôt qu'un chiffre approximatif, laissez-moi vous passer un agent qui vous enverra une grille de prix à jour avec les disponibilités réelles.`,
      `Pour être parfaitement transparent : je n'affiche que les prix des lots actuellement en commercialisation, et il n'y en a pas en ligne à cet instant. Un commercial peut vous envoyer la grille complète — y compris les futurs programmes qui arrivent — en moins d'une heure via WhatsApp.`,
    ]
    const en = [
      `Prices vary by program, plot size, position (corner, view, access to amenities) and payment plan. Rather than quote a rough figure, let me hand you to an agent who'll send the live price grid with real-time availability.`,
      `Being fully transparent: I only display prices for lots actively in sale, and none are listed right now. An advisor can send you the complete grid — including upcoming programs — in under an hour via WhatsApp.`,
    ]
    return {
      reply: pick(facts.locale === 'fr' ? fr : en, seed),
      actions: [agentAction(facts), whatsappAction(facts)],
      intent: 'price',
    }
  }
  const list = priced
    .slice(0, 4)
    .map((p) => {
      const range =
        p.minPriceFCFA && p.maxPriceFCFA && p.minPriceFCFA !== p.maxPriceFCFA
          ? `${formatFCFAShort(p.minPriceFCFA, facts.locale)} → ${formatFCFAShort(p.maxPriceFCFA, facts.locale)}`
          : formatFCFAShort(p.minPriceFCFA!, facts.locale)
      return `— ${p.name} (${p.zone}, ${p.availableLots}/${p.totalLots} lots dispo) : ${range}`
    })
    .join('\n')
  const fr = [
    `Voici les fourchettes actuelles, tirées en direct de nos lots en commercialisation :\n\n${list}\n\nCe sont des prix de départ hors frais de notaire et d'ACD. À savoir : un paiement comptant ouvre souvent droit à une remise, et certains programmes proposent un échéancier étalé sur la durée du chantier. Sur lequel vous voulez creuser ?`,
    `Ci-dessous la grille en temps réel :\n\n${list}\n\nDeux repères utiles : le prix varie selon la position du lot (angle, proximité d'un axe principal, vue), et FCI applique des paliers d'acompte pour sécuriser votre réservation. Je peux vous détailler un programme ou vous passer un agent pour un devis personnalisé.`,
    `Les prix publiés en ce moment :\n\n${list}\n\nPrécision importante : les montants couvrent l'acquisition du lot uniquement. La viabilisation, les frais notariés et la procédure ACD s'ajoutent selon un barème défini au contrat. Souhaitez-vous la fiche détaillée d'un programme ?`,
  ]
  const en = [
    `Here are the current ranges, pulled live from our on-sale lots:\n\n${list}\n\nThese are starting prices, excluding notary and ACD fees. Worth noting: a cash purchase usually unlocks a discount, and some programs offer a payment schedule spread over the construction phase. Which one should we dig into?`,
    `Live pricing snapshot:\n\n${list}\n\nTwo quick pointers: lot price varies with position (corner, main-road proximity, view), and FCI uses staged deposits to lock your reservation. I can zoom into a program or hand you to an agent for a personalized quote.`,
    `Current published pricing:\n\n${list}\n\nImportant note: amounts cover lot acquisition only. Site servicing, notary fees and the ACD process are added per the contract's fee schedule. Want the detailed spec sheet for a program?`,
  ]
  return {
    reply: pick(facts.locale === 'fr' ? fr : en, seed),
    actions: [
      ...priced.slice(0, 3).map((p) => ({
        kind: 'open-link' as const,
        href: `/a-la-une/${p.slug}`,
        label: p.name,
      })),
      agentAction(facts),
    ],
    intent: 'price',
  }
}

function programsReply(facts: AssistantFacts, seed: number): AssistantReply {
  if (!facts.programs.length) {
    const fr = [
      `Aucun programme n'est actuellement affiché côté public — mais cela ne veut pas dire que rien n'est disponible. Nous avons régulièrement des lots "off-market" (lots isolés, opportunités de dernière minute). Je vous passe un agent pour vérifier si quelque chose correspond à votre projet ?`,
      `Notre vitrine publique est en renouvellement. Plusieurs lancements sont prévus dans les prochaines semaines à Cocody, Bingerville et Grand-Bassam. Laissez vos coordonnées, un commercial vous inscrit en avant-première.`,
    ]
    const en = [
      `No program is currently listed on the public site — but that doesn't mean nothing's available. We regularly have "off-market" lots (orphan lots, last-minute openings). Want me to have an agent check if something matches your project?`,
      `Our public showroom is being refreshed. Several launches are planned over the coming weeks in Cocody, Bingerville and Grand-Bassam. Drop your details and an advisor will add you to the early-access list.`,
    ]
    return {
      reply: pick(facts.locale === 'fr' ? fr : en, seed),
      actions: [
        agentAction(facts),
        { kind: 'open-link', href: '/a-la-une', label: facts.locale === 'fr' ? 'Voir la page À la Une' : 'Open Featured' },
      ],
      intent: 'programs',
    }
  }
  const list = facts.programs
    .slice(0, 5)
    .map((p) => {
      const statusNote =
        p.availableLots === 0
          ? facts.locale === 'fr'
            ? ' (complet — liste d\'attente)'
            : ' (sold out — waiting list)'
          : p.availableLots <= 3
            ? facts.locale === 'fr'
              ? ` (plus que ${p.availableLots} lot${p.availableLots > 1 ? 's' : ''} !)`
              : ` (only ${p.availableLots} lot${p.availableLots > 1 ? 's' : ''} left!)`
            : ''
      return `— ${p.name} · ${p.type.toLowerCase()} · ${p.zone} · ${p.availableLots}/${p.totalLots} dispo${statusNote}`
    })
    .join('\n')
  const count = facts.programs.length
  const fr = [
    `Nous avons ${count} programme${count > 1 ? 's' : ''} actif${count > 1 ? 's' : ''} en ce moment :\n\n${list}\n\nChacun correspond à un profil différent — résidentiel premium, terrain d'investissement, maison familiale. Dites-moi ce qui compte le plus pour vous (budget, zone, délai de livraison) et je vous oriente vers le plus pertinent.`,
    `Voici la liste complète, triée par pertinence :\n\n${list}\n\nSi vous hésitez, les critères les plus déterminants sont généralement : 1) la zone (proximité travail/école), 2) le type de bien (terrain pour bâtir vs. maison livrée), 3) l'échéancier de paiement. Quel est votre critère n°1 ?`,
    `Notre catalogue en ligne :\n\n${list}\n\nPour info, tous nos programmes incluent la procédure ACD — c'est une spécificité FCI, encore rare chez les promoteurs locaux. Lequel je vous ouvre en premier ?`,
  ]
  const en = [
    `We currently have ${count} active program${count > 1 ? 's' : ''}:\n\n${list}\n\nEach fits a different profile — premium residential, investment land, family home. Tell me what matters most (budget, zone, delivery timing) and I'll point you to the best match.`,
    `Here's the full list, sorted by relevance:\n\n${list}\n\nIf you're torn, the deciding factors usually are: 1) zone (work/school proximity), 2) product type (land to build vs. turn-key home), 3) payment schedule. What's your top criterion?`,
    `Our online catalogue:\n\n${list}\n\nFYI every program we run includes the ACD procedure — that's an FCI hallmark, still rare among local developers. Which one should I open first?`,
  ]
  return {
    reply: pick(facts.locale === 'fr' ? fr : en, seed),
    actions: [
      ...facts.programs.slice(0, 3).map((p) => ({
        kind: 'open-link' as const,
        href: `/a-la-une/${p.slug}`,
        label: p.name,
      })),
      { kind: 'open-link' as const, href: '/a-la-une', label: facts.locale === 'fr' ? 'Tout voir' : 'See all' },
    ],
    intent: 'programs',
  }
}

function programReply(facts: AssistantFacts, program: ProgramFact, seed: number): AssistantReply {
  const priceLine = program.minPriceFCFA
    ? program.maxPriceFCFA && program.minPriceFCFA !== program.maxPriceFCFA
      ? `${formatFCFAShort(program.minPriceFCFA, facts.locale)} → ${formatFCFAShort(program.maxPriceFCFA, facts.locale)}`
      : formatFCFAShort(program.minPriceFCFA, facts.locale)
    : facts.locale === 'fr'
      ? 'sur demande auprès d\'un agent'
      : 'on request from an agent'
  const scarcity =
    program.availableLots === 0
      ? facts.locale === 'fr'
        ? ` Le programme est actuellement complet, mais une liste d'attente est ouverte en cas de désistement.`
        : ` The program is fully sold at the moment, but we keep a waiting list in case of cancellation.`
      : program.availableLots <= 3
        ? facts.locale === 'fr'
          ? ` Attention : il ne reste que ${program.availableLots} lot${program.availableLots > 1 ? 's' : ''} disponible${program.availableLots > 1 ? 's' : ''}.`
          : ` Heads up: only ${program.availableLots} lot${program.availableLots > 1 ? 's' : ''} left.`
        : ''
  const fr = [
    `${program.name} — ${program.type.toLowerCase()} situé ${program.zone}. ${program.tagline}\n\nFourchette : ${priceLine}. Disponibilité : ${program.availableLots}/${program.totalLots} lots.${scarcity}\n\nTrois chemins possibles depuis ici : voir la fiche détaillée (plans, photos, visite 360°), planifier une visite sur site, ou entrer en contact avec un agent. Lequel vous arrange ?`,
    `Bon choix. ${program.name} est l'un de nos ${program.type === 'LOTISSEMENT' ? 'lotissements' : program.type === 'MAISON' ? 'programmes résidentiels' : 'offres de terrain'} actifs à ${program.zone}.\n\nEn bref : ${program.tagline}\n\n— Prix : ${priceLine}\n— Dispo : ${program.availableLots}/${program.totalLots} lots${scarcity}\n\nJe peux vous ouvrir la fiche complète (photos, plans, visite virtuelle quand disponible), organiser une visite ou vous passer un agent.`,
    `${program.name}, ${program.zone}.\n\nC'est un ${program.type.toLowerCase()} avec ${program.totalLots} lot${program.totalLots > 1 ? 's' : ''} au total — ${program.availableLots} encore disponible${program.availableLots > 1 ? 's' : ''}.${scarcity} Prix à partir de ${priceLine}.\n\nLe plus efficace est souvent de réserver 15 min avec un agent : il vous envoie les plans, vous explique l'échéancier et le process ACD sur ce programme spécifique. Je le déclenche ?`,
  ]
  const en = [
    `${program.name} — ${program.type.toLowerCase()} located in ${program.zone}. ${program.tagline}\n\nRange: ${priceLine}. Availability: ${program.availableLots}/${program.totalLots} lots.${scarcity}\n\nThree paths from here: view the full spec (plans, photos, 360° tour), book a site visit, or talk to an agent. What works best?`,
    `Great pick. ${program.name} is one of our active ${program.type === 'LOTISSEMENT' ? 'subdivisions' : program.type === 'MAISON' ? 'residential programs' : 'land offers'} in ${program.zone}.\n\nIn short: ${program.tagline}\n\n— Price: ${priceLine}\n— Availability: ${program.availableLots}/${program.totalLots}${scarcity}\n\nI can open the full spec sheet (photos, plans, virtual tour when available), set up a visit, or put you in touch with an agent.`,
    `${program.name}, ${program.zone}.\n\nIt's a ${program.type.toLowerCase()} with ${program.totalLots} lot${program.totalLots > 1 ? 's' : ''} total — ${program.availableLots} still available.${scarcity} Pricing from ${priceLine}.\n\nThe most efficient path is usually a 15-min call with an agent: they'll send the plans, walk you through the payment schedule and the ACD process for this specific program. Shall I set it up?`,
  ]
  return {
    reply: pick(facts.locale === 'fr' ? fr : en, seed),
    actions: [
      { kind: 'open-link', href: `/a-la-une/${program.slug}`, label: facts.locale === 'fr' ? 'Voir le programme' : 'View program' },
      agentAction(facts),
      whatsappAction(facts),
    ],
    intent: 'program',
  }
}

function programPriceReply(facts: AssistantFacts, program: ProgramFact, seed: number): AssistantReply {
  const priceLine = program.minPriceFCFA
    ? program.maxPriceFCFA && program.minPriceFCFA !== program.maxPriceFCFA
      ? `${formatFCFAShort(program.minPriceFCFA, facts.locale)} à ${formatFCFAShort(program.maxPriceFCFA, facts.locale)}`
      : formatFCFAShort(program.minPriceFCFA, facts.locale)
    : facts.locale === 'fr'
      ? 'sur demande auprès d\'un agent'
      : 'on request from an agent'
  const fr = [
    `Pour ${program.name} (${program.zone}), les lots disponibles démarrent à ${priceLine}. C'est le prix du foncier seul — les frais notariés et la procédure ACD s'ajoutent selon un barème fixé au contrat. Je peux vous passer la fiche détaillée, ou mieux : demander à un agent de vous envoyer la grille exacte lot par lot.`,
    `Sur ${program.name} : à partir de ${priceLine}. Bon à savoir — les positions d'angle et les lots avec vue dégagée sont au haut de la fourchette, les lots intérieurs au bas. Un agent peut vous simuler un échéancier selon votre budget (acompte + paiements pendant le chantier).`,
  ]
  const en = [
    `For ${program.name} (${program.zone}), available lots start at ${priceLine}. That's the land value only — notary fees and the ACD procedure are added per the contract's schedule. I can open the spec sheet, or better: have an agent send the exact lot-by-lot grid.`,
    `On ${program.name}: from ${priceLine}. Good to know — corner lots and open-view lots sit at the top of the range, interior lots at the bottom. An agent can simulate a schedule against your budget (deposit + staged payments during construction).`,
  ]
  return {
    reply: pick(facts.locale === 'fr' ? fr : en, seed),
    actions: [
      { kind: 'open-link', href: `/a-la-une/${program.slug}`, label: facts.locale === 'fr' ? 'Voir le plan' : 'View plan' },
      agentAction(facts),
    ],
    intent: 'program-price',
  }
}

function programVisitReply(facts: AssistantFacts, program: ProgramFact, seed: number): AssistantReply {
  const fr = [
    `Excellente idée — voir le site en vrai change tout, surtout pour ${program.name}. Rendez-vous sur la page du programme, cliquez "Demander une visite", choisissez votre créneau : un agent confirme par e-mail avec un fichier .ics pour votre agenda. Les visites sont gratuites et se font avec un commercial qui connaît le terrain lot par lot.`,
    `Pour visiter ${program.name}, trois options :\n\n1. Visite physique sur site — réservez un créneau depuis la page du programme.\n2. Visite virtuelle (si disponible sur ce programme) — immersion 360° depuis chez vous.\n3. Visio-call avec un agent — idéal pour la diaspora, on balade la caméra sur le terrain.\n\nQu'est-ce qui vous arrangerait ?`,
  ]
  const en = [
    `Great idea — seeing the site in person changes everything, especially for ${program.name}. Head to the program page, tap "Request a visit", pick a slot: an agent confirms by email with an .ics calendar file. Visits are free and led by an advisor who knows the site plot by plot.`,
    `To visit ${program.name}, three options:\n\n1. Physical site visit — book a slot from the program page.\n2. Virtual tour (if available for this program) — 360° immersion from home.\n3. Live video call with an agent — perfect for the diaspora, we walk the site with a camera.\n\nWhat works best for you?`,
  ]
  return {
    reply: pick(facts.locale === 'fr' ? fr : en, seed),
    actions: [
      { kind: 'open-link', href: `/a-la-une/${program.slug}`, label: facts.locale === 'fr' ? 'Demander une visite' : 'Request a visit' },
      agentAction(facts),
    ],
    intent: 'program-visit',
  }
}

function programReserveReply(facts: AssistantFacts, program: ProgramFact, seed: number): AssistantReply {
  const fr = [
    `Pour réserver un lot sur ${program.name}, le parcours est rapide :\n\n1. Ouvrez la page du programme, parcourez les lots disponibles.\n2. Cliquez "Réserver ce lot" sur celui qui vous plaît.\n3. Un agent confirme sous 24 h et vous envoie le contrat de réservation.\n\nL'acompte de réservation bloque le lot en votre nom — vous êtes prioritaire tant que le dossier avance. Si vous voulez sécuriser un lot précis sans attendre, un agent peut le marquer "pré-réservé" le temps que vous décidiez.`,
    `Réserver sur ${program.name} = 15 minutes en ligne + 24 h de confirmation par un agent. Étapes :\n\n1. Choisir le lot sur la page du programme.\n2. Cliquer "Réserver", créer un compte (ou se connecter).\n3. Attendre la confirmation + le lien contrat.\n\nLa réservation devient ferme à la signature du contrat de réservation et au versement de l'acompte. Je vous mets en contact avec un agent pour qu'il vous guide ?`,
  ]
  const en = [
    `Reserving a lot in ${program.name} is a fast flow:\n\n1. Open the program page, browse available lots.\n2. Click "Reserve this lot" on the one you like.\n3. An agent confirms within 24 h and sends the reservation contract.\n\nThe reservation deposit locks the lot under your name — you stay priority as long as the file moves forward. If you want to lock a specific lot right now, an agent can tag it "pre-reserved" while you decide.`,
    `Reserving on ${program.name} = 15 online minutes + 24 h agent confirmation. Steps:\n\n1. Pick the lot on the program page.\n2. Click "Reserve", create an account (or sign in).\n3. Wait for confirmation + contract link.\n\nThe reservation becomes firm once the reservation contract is signed and the deposit is paid. Want me to put you in touch with an agent to walk you through it?`,
  ]
  return {
    reply: pick(facts.locale === 'fr' ? fr : en, seed),
    actions: [
      { kind: 'open-link', href: `/a-la-une/${program.slug}`, label: facts.locale === 'fr' ? 'Choisir un lot' : 'Pick a lot' },
      agentAction(facts),
    ],
    intent: 'program-reserve',
  }
}

function visitReply(facts: AssistantFacts, seed: number): AssistantReply {
  const fr = [
    `Les visites sont un pilier chez FCI — nous estimons que personne ne devrait acheter sans avoir mis les pieds sur le terrain (ou visité virtuellement). Pour planifier :\n\n1. Ouvrez la page "À la Une" et choisissez le programme qui vous intéresse.\n2. Cliquez "Demander une visite" et sélectionnez un créneau dans notre calendrier.\n3. Vous recevez un e-mail de confirmation avec un fichier .ics à ajouter à votre agenda.\n\nLes visites sont gratuites et toujours encadrées par un commercial qui connaît le terrain lot par lot. Pour la diaspora, une visite vidéo en direct est possible — même expérience, depuis chez vous.`,
    `Pour une visite, trois chemins existent :\n\n— Visite physique sur site (gratuite, avec un commercial, sur rendez-vous)\n— Visite virtuelle 360° (quand elle est disponible sur le programme)\n— Visio-call en direct pendant que nous marchons sur le terrain (idéal diaspora)\n\nPour réserver, allez sur la page du programme puis "Demander une visite", ou demandez-moi un agent qui planifiera directement avec vous.`,
  ]
  const en = [
    `Visits are a cornerstone at FCI — we believe no one should buy without setting foot on the land (or touring virtually). To book:\n\n1. Open the Featured page and pick the program.\n2. Click "Request a visit" and select a slot from our calendar.\n3. You get a confirmation email with an .ics file for your agenda.\n\nVisits are free and always led by an advisor who knows the land plot by plot. For the diaspora, a live video visit is possible — same experience, from home.`,
    `For a visit, three paths exist:\n\n— Physical site visit (free, with an advisor, by appointment)\n— 360° virtual tour (when available on the program)\n— Live video call while we walk the site (perfect for the diaspora)\n\nTo book, head to the program page then "Request a visit", or ask me for an agent who'll schedule it with you.`,
  ]
  return {
    reply: pick(facts.locale === 'fr' ? fr : en, seed),
    actions: [
      { kind: 'open-link', href: '/a-la-une', label: facts.locale === 'fr' ? 'Voir les programmes' : 'See programs' },
      agentAction(facts),
    ],
    intent: 'visit',
  }
}

function reserveReply(facts: AssistantFacts, seed: number): AssistantReply {
  const fr = [
    `Réserver chez FCI se fait en deux temps :\n\n1. Vous bloquez un lot en ligne : choisissez un programme sur "À la Une", ouvrez un lot disponible, cliquez "Réserver ce lot".\n2. Un agent confirme sous 24 h ouvrées et vous envoie le contrat de réservation + les instructions pour l'acompte.\n\nÀ partir de là, le lot est marqué à votre nom dans notre système et personne d'autre ne peut le réserver. Vous pouvez suivre l'avancée de votre dossier, les paiements, les documents et le chantier depuis votre espace client.`,
    `Le process de réservation en 4 étapes :\n\n1. Trouver un lot disponible sur "À la Une".\n2. Cliquer "Réserver" — on crée votre compte (2 minutes).\n3. Un agent confirme sous 24 h et vous guide sur l'acompte.\n4. Dès l'acompte reçu, le lot est ferme — contrat signé, chantier suivi, ACD en procédure.\n\nLa réservation est remboursable sous conditions avant la signature du contrat définitif — c'est précisé au contrat.`,
  ]
  const en = [
    `Reserving with FCI happens in two steps:\n\n1. You lock a lot online: pick a program on Featured, open an available lot, click "Reserve this lot".\n2. An agent confirms within 24 working hours and sends the reservation contract + deposit instructions.\n\nFrom then on, the lot is tagged under your name in our system and no one else can reserve it. You track the file status, payments, documents and construction from your client portal.`,
    `The reservation flow in 4 steps:\n\n1. Find an available lot on Featured.\n2. Click "Reserve" — we create your account (2 minutes).\n3. An agent confirms within 24 h and walks you through the deposit.\n4. As soon as the deposit clears, the lot is firm — contract signed, construction tracked, ACD underway.\n\nThe reservation is refundable under conditions before the final contract — all spelled out in the contract.`,
  ]
  return {
    reply: pick(facts.locale === 'fr' ? fr : en, seed),
    actions: [
      { kind: 'open-link', href: '/a-la-une', label: facts.locale === 'fr' ? 'Choisir un programme' : 'Pick a program' },
      agentAction(facts),
    ],
    intent: 'reserve',
  }
}

function zoneReply(facts: AssistantFacts, seed: number): AssistantReply {
  const zones = Array.from(new Set(facts.programs.map((p) => p.zone))).filter(Boolean)
  const list = zones.length ? zones.join(', ') : 'Abidjan et le Grand Abidjan'
  const fr = [
    `Nous opérons principalement sur ces zones : ${list}. Notre siège est à ${facts.address}. Chaque zone a sa personnalité — Cocody reste la valeur sûre résidentielle, Bingerville monte en puissance côté familles, le Grand Abidjan attire les investisseurs long terme.\n\nDites-moi la zone qui vous attire et je vous liste les programmes qui y sont.`,
    `Zones couvertes : ${list}. Quelques repères rapides :\n\n— Cocody / Angré : résidentiel établi, services matures, tickets plus élevés.\n— Bingerville : croissance soutenue, bon équilibre prix/potentiel.\n— Grand Abidjan / intérieur : terrains d'investissement, perspective long terme.\n\nQuelle zone vous parle le plus ?`,
  ]
  const en = [
    `We mainly operate in these zones: ${list}. Our head office is at ${facts.address}. Each zone has its personality — Cocody is the blue-chip residential, Bingerville is rising for families, Greater Abidjan attracts long-term investors.\n\nTell me which zone pulls you in and I'll list the programs there.`,
    `Zones covered: ${list}. Quick pointers:\n\n— Cocody / Angré: established residential, mature services, higher tickets.\n— Bingerville: strong growth, good price/potential balance.\n— Greater Abidjan / inland: investment land, long-term outlook.\n\nWhich zone speaks to you most?`,
  ]
  return {
    reply: pick(facts.locale === 'fr' ? fr : en, seed),
    actions: [
      { kind: 'open-link', href: '/a-la-une', label: facts.locale === 'fr' ? 'Tous les programmes' : 'All programs' },
      agentAction(facts),
    ],
    intent: 'zone',
  }
}

function acdReply(facts: AssistantFacts, seed: number): AssistantReply {
  const fr = [
    `L'ACD — Attestation de Concession Définitive — c'est LE document qui fait de vous le propriétaire légal et opposable du terrain. Sans ACD, vous avez un droit d'usage, pas la pleine propriété.\n\nChez FCI, c'est non-négociable : chaque vente aboutit à la délivrance de l'ACD. Plus de ${facts.acdDelivered} ACD remis à ce jour. Nous prenons en charge toute la procédure (cadastre, affichage public, enregistrement) jusqu'à remise du titre physique entre vos mains — ou envoi sécurisé par DHL pour la diaspora.\n\nDurée moyenne de la procédure : 6 à 18 mois selon la zone et le programme.`,
    `Question centrale — et vous avez raison de la poser.\n\nL'ACD est le titre officiel de propriété foncière en Côte d'Ivoire. Sans ACD, ce que vous achetez n'est pas protégé juridiquement contre les réclamations coutumières. FCI en a livré plus de ${facts.acdDelivered}, et chaque programme est vendu avec l'engagement contractuel de livrer l'ACD.\n\nLa procédure dure en général entre 6 et 18 mois, et nous l'assumons intégralement — dossier cadastral, publications légales, enregistrement, remise finale. Vous suivez l'avancée depuis votre espace client.`,
  ]
  const en = [
    `The ACD — Attestation de Concession Définitive — is THE document that makes you the legal, enforceable owner of the land. Without it, you hold a right of use, not full ownership.\n\nAt FCI, it's non-negotiable: every sale ends with ACD delivery. Over ${facts.acdDelivered} ACDs handed over to date. We handle the full procedure (land registry, public posting, recording) until physical hand-off — or secure DHL delivery for the diaspora.\n\nTypical procedure: 6 to 18 months depending on zone and program.`,
    `Key question — and you're right to raise it.\n\nThe ACD is the official land-title document in Côte d'Ivoire. Without it, what you bought isn't legally protected against customary claims. FCI has delivered over ${facts.acdDelivered}, and every program is sold with a contractual commitment to deliver the ACD.\n\nThe procedure usually runs 6–18 months and we carry it end-to-end — cadastral file, legal notices, recording, final handover. You track progress from your client portal.`,
  ]
  return {
    reply: pick(facts.locale === 'fr' ? fr : en, seed),
    actions: [agentAction(facts), whatsappAction(facts)],
    intent: 'acd',
  }
}

function processReply(facts: AssistantFacts, seed: number): AssistantReply {
  const fr = [
    `Voici les 6 étapes pour devenir propriétaire avec FCI :\n\n1. Choisissez un programme + un lot sur la page "À la Une".\n2. Cliquez "Réserver" — un agent confirme sous 24 h ouvrées et vous envoie le contrat de réservation.\n3. Acompte versé → contrat définitif signé chez le notaire.\n4. Chantier (pour les maisons) ou viabilisation (pour les terrains) — vous suivez les paiements et l'avancée depuis votre espace client.\n5. Procédure ACD lancée en parallèle.\n6. Remise des clés + remise de l'ACD physique entre vos mains.\n\nEn moyenne, de la réservation au titre définitif : 12 à 24 mois pour un terrain, 18 à 30 mois pour une maison.`,
    `Le parcours FCI, ligne par ligne :\n\n1. Exploration : vous visitez les programmes en ligne ou sur site, posez toutes vos questions (à un humain ou ici).\n2. Réservation : lot bloqué à votre nom, contrat de réservation signé, acompte versé.\n3. Contrat : signature du contrat définitif chez le notaire.\n4. Exécution : chantier ou viabilisation, avec espace client et suivi photo.\n5. ACD : nous portons la procédure administrative.\n6. Livraison : remise des clés + titre de propriété.\n\nTout est traçable depuis votre compte — échéanciers, documents signés, statut ACD, photos du chantier.`,
  ]
  const en = [
    `The 6 steps to become an FCI owner:\n\n1. Pick a program + lot on the Featured page.\n2. Click "Reserve" — an agent confirms within 24 working hours and sends the reservation contract.\n3. Deposit paid → final contract signed at the notary.\n4. Construction (for homes) or site servicing (for land) — track payments and progress from the client portal.\n5. ACD procedure started in parallel.\n6. Handover of keys + physical ACD delivered to you.\n\nOn average, from reservation to final title: 12–24 months for land, 18–30 months for a home.`,
    `The FCI journey, step by step:\n\n1. Explore: browse programs online or on site, ask all your questions (to a human or here).\n2. Reserve: lot locked under your name, reservation contract signed, deposit paid.\n3. Contract: final contract signed at the notary.\n4. Execution: construction or servicing, with client portal + photo updates.\n5. ACD: we carry the administrative procedure.\n6. Delivery: keys + property title.\n\nEverything traceable from your account — payment schedule, signed documents, ACD status, construction photos.`,
  ]
  return {
    reply: pick(facts.locale === 'fr' ? fr : en, seed),
    actions: [
      { kind: 'open-link', href: '/a-la-une', label: facts.locale === 'fr' ? 'Commencer' : 'Get started' },
      agentAction(facts),
    ],
    intent: 'process',
  }
}

function paymentReply(facts: AssistantFacts, seed: number): AssistantReply {
  const fr = [
    `Les modalités dépendent du produit :\n\n— Terrain : souvent comptant ou en 2 à 3 versements sur 3–6 mois.\n— Maison clé en main : acompte à la réservation (10–30 % selon le programme) puis paliers calés sur l'avancement du chantier (fondations, gros œuvre, second œuvre, livraison).\n— Lotissement avec construction : combinaison des deux.\n\nNous acceptons virement bancaire, chèque de banque, et de plus en plus Orange Money / MTN Mobile Money pour les petits paliers. Un agent peut vous simuler un plan selon votre budget — c'est la meilleure façon de se projeter.`,
    `FCI propose généralement :\n\n— Un acompte à la réservation (le montant varie par programme — typiquement 10 à 30 % du prix du lot).\n— Un solde échelonné sur la durée du chantier pour les maisons, ou en 1 à 3 fois pour un terrain.\n— Possibilité de remise pour paiement comptant sur certains programmes.\n\nPas de frais cachés côté FCI : le barème est au contrat. Les frais notariés et la procédure ACD restent à votre charge et sont détaillés à la signature.`,
  ]
  const en = [
    `Terms depend on the product:\n\n— Land: often lump-sum or 2–3 payments over 3–6 months.\n— Turn-key home: deposit at reservation (10–30 % depending on program) then stages matched to construction milestones (foundations, structural, finishing, handover).\n— Subdivision with construction: a mix of the two.\n\nWe accept bank transfer, bank check, and increasingly Orange Money / MTN Mobile Money for smaller stages. An agent can simulate a plan against your budget — the best way to picture it.`,
    `FCI typically offers:\n\n— A reservation deposit (varies by program — typically 10–30 % of the lot price).\n— A balance staged over the construction timeline for homes, or 1 to 3 payments for a plot.\n— Possible cash-payment discount on some programs.\n\nNo hidden FCI fees: the schedule is in the contract. Notary fees and the ACD procedure are on your side and detailed at signature.`,
  ]
  return {
    reply: pick(facts.locale === 'fr' ? fr : en, seed),
    actions: [agentAction(facts), whatsappAction(facts)],
    intent: 'payment',
  }
}

function diasporaReply(facts: AssistantFacts, seed: number): AssistantReply {
  const fr = [
    `La diaspora, c'est une grande part de nos clients — nous avons tout calibré pour l'achat à distance.\n\nComment ça se passe concrètement :\n\n1. Réservation 100 % en ligne depuis votre pays.\n2. Signature du contrat par procuration (un proche à Abidjan) ou par voie électronique quand le programme le permet.\n3. Visite virtuelle live avec un agent qui marche sur le terrain pendant que vous regardez.\n4. Paiements par virement bancaire international — nous vous envoyons les coordonnées IBAN/SWIFT.\n5. Suivi du chantier en photos / vidéos hebdomadaires depuis votre espace client.\n6. ACD livré en main propre à votre représentant à Abidjan ou expédié par DHL.\n\nNous avons des clients au Canada, aux USA, en France, en Italie et ailleurs qui ont acheté sans jamais mettre les pieds à Abidjan pendant le process.`,
    `Oui, la diaspora est un segment important pour nous. Tout le parcours est pensé pour vous :\n\n— Compte client et signatures à distance\n— Visio en direct depuis le terrain (un agent se déplace, vous filmez à votre rythme)\n— Paiements par virement international sécurisé\n— Suivi photo hebdo du chantier depuis votre espace\n— Représentant local ou DHL pour la remise physique de l'ACD\n\nLa plupart de nos clients diaspora ne font le déplacement qu'une seule fois — pour la remise des clés. Si vous me dites d'où vous êtes, un agent peut vous envoyer un dossier diaspora adapté à votre fuseau horaire.`,
  ]
  const en = [
    `The diaspora is a huge share of our clients — everything is set up for buying from abroad.\n\nIn practice:\n\n1. 100 % online reservation from your country.\n2. Contract signed by proxy (a relative in Abidjan) or electronically when the program allows.\n3. Live virtual site visit with an agent walking the land while you watch.\n4. Payments by international bank transfer — we send IBAN/SWIFT details.\n5. Weekly photo / video construction updates from your client portal.\n6. ACD handed over to your representative in Abidjan or shipped by DHL.\n\nWe have clients in Canada, the US, France, Italy and beyond who bought without setting foot in Abidjan during the process.`,
    `Yes, the diaspora is a core segment for us. The full journey is built for you:\n\n— Client account + remote signatures\n— Live video from the site (an agent walks it, you film at your pace)\n— Secure international transfer payments\n— Weekly photo updates of construction from your account\n— Local rep or DHL for physical ACD hand-off\n\nMost diaspora clients travel only once — for the handover. If you tell me where you're based, an agent can send a diaspora pack tuned to your time zone.`,
  ]
  return {
    reply: pick(facts.locale === 'fr' ? fr : en, seed),
    actions: [agentAction(facts), whatsappAction(facts)],
    intent: 'diaspora',
  }
}

function contactInfoReply(facts: AssistantFacts): AssistantReply {
  const fr = `Pour joindre FirstClass Immobilier :\n\n— Téléphone : ${facts.phone}\n— Mobile : ${facts.mobile}\n— WhatsApp : +${facts.whatsapp}\n— E-mail : ${facts.email}\n— Adresse : ${facts.address}\n— Horaires : ${facts.hours}\n\nLe plus réactif, c'est WhatsApp. Le plus tracé, c'est l'e-mail. Un agent vous répond en général sous 2 h ouvrées.`
  const en = `To reach FirstClass Immobilier:\n\n— Phone: ${facts.phone}\n— Mobile: ${facts.mobile}\n— WhatsApp: +${facts.whatsapp}\n— Email: ${facts.email}\n— Address: ${facts.address}\n— Hours: ${facts.hours}\n\nFastest channel: WhatsApp. Most traceable: email. An agent typically replies within 2 working hours.`
  return {
    reply: facts.locale === 'fr' ? fr : en,
    actions: [whatsappAction(facts), agentAction(facts)],
    intent: 'contact-info',
  }
}

function fallbackReply(facts: AssistantFacts, userMessage: string, seed: number): AssistantReply {
  const clip = userMessage.slice(0, 80) + (userMessage.length > 80 ? '…' : '')
  const fr = [
    `Bonne question. Honnêtement, je ne suis pas sûr d'avoir la bonne réponse à "${clip}" — je suis plus à l'aise sur les sujets FCI (programmes, prix, ACD, visites, réservations, diaspora).\n\nDeux options : reformulez votre question (par exemple "quel est le prix du programme X" ou "comment fonctionne l'ACD"), ou je vous passe un agent humain qui saura mieux vous aider.`,
    `Je préfère être franc : je ne trouve pas de réponse fiable à "${clip}" dans ma base. Je peux en revanche vous renseigner sur nos programmes, les prix, les zones, l'ACD, le process de réservation ou la prise en charge diaspora. Ou bien — encore plus simple — un agent peut vous rappeler.\n\nQuel chemin préférez-vous ?`,
  ]
  const en = [
    `Fair question. Honestly, I'm not sure I have a solid answer to "${clip}" — I'm strongest on FCI topics (programs, pricing, ACD, visits, reservations, diaspora).\n\nTwo options: rephrase (e.g. "what's the price of program X" or "how does the ACD work"), or I can hand you to a human agent who'll help better.`,
    `Being straight with you: I can't find a reliable answer to "${clip}" in my data. I can however help you on our programs, pricing, zones, the ACD, reservation process, or diaspora handling. Or — even simpler — an agent can call you back.\n\nWhich path works for you?`,
  ]
  return {
    reply: pick(facts.locale === 'fr' ? fr : en, seed),
    actions: baseSuggestions(facts),
    intent: 'fallback',
  }
}

// Shared action builders
function agentAction(facts: AssistantFacts): AssistantAction {
  return { kind: 'open-lead-form', label: facts.locale === 'fr' ? 'Parler à un agent' : 'Talk to an agent' }
}
function whatsappAction(facts: AssistantFacts): AssistantAction {
  return { kind: 'open-whatsapp', label: 'WhatsApp' }
}
function baseSuggestions(facts: AssistantFacts): AssistantAction[] {
  return [
    { kind: 'suggest', text: facts.locale === 'fr' ? 'Voir les programmes' : 'Browse programs' },
    { kind: 'suggest', text: facts.locale === 'fr' ? 'Quels sont les prix ?' : 'What are the prices?' },
    { kind: 'suggest', text: facts.locale === 'fr' ? 'Étapes de réservation' : 'Reservation steps' },
    agentAction(facts),
  ]
}

// ──────────────────────────────────────────────────────────────────────────
//  Public entry point
// ──────────────────────────────────────────────────────────────────────────

export function respondToMessage(
  facts: AssistantFacts,
  history: ChatTurn[],
  userMessage: string,
): AssistantReply {
  const seed = history.length
  const activeProgram = findProgram(userMessage, facts.programs) ?? contextProgram(history, facts.programs)
  const intent = detectIntent(userMessage, activeProgram)

  switch (intent) {
    case 'greeting':
      return greetingReply(facts, seed)
    case 'thanks':
      return thanksReply(facts, seed)
    case 'goodbye':
      return goodbyeReply(facts, seed)
    case 'agent':
      return agentReply(facts, seed)
    case 'whatsapp':
      return whatsappReply(facts)
    case 'price':
      return priceReply(facts, seed)
    case 'programs':
      return programsReply(facts, seed)
    case 'program':
      return programReply(facts, activeProgram!, seed)
    case 'program-price':
      return programPriceReply(facts, activeProgram!, seed)
    case 'program-visit':
      return programVisitReply(facts, activeProgram!, seed)
    case 'program-reserve':
      return programReserveReply(facts, activeProgram!, seed)
    case 'visit':
      return visitReply(facts, seed)
    case 'reserve':
      return reserveReply(facts, seed)
    case 'zone':
      return zoneReply(facts, seed)
    case 'acd':
      return acdReply(facts, seed)
    case 'process':
      return processReply(facts, seed)
    case 'payment':
      return paymentReply(facts, seed)
    case 'diaspora':
      return diasporaReply(facts, seed)
    case 'contact-info':
      return contactInfoReply(facts)
    default:
      return fallbackReply(facts, userMessage, seed)
  }
}
