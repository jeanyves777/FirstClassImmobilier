# FirstClass Immobilier — Website

Bilingual (FR / EN) SSR platform for **FirstClass Immobilier** (Abidjan, CI). Next.js 16 · Prisma 7 · Tailwind v4.

## Stack

- **Next.js 16** (App Router, RSC, Turbopack)
- **React 19**
- **Tailwind CSS v4** with brand tokens + `class`-based dark mode (`next-themes`)
- **next-intl v4** — locale-prefixed routes `/fr`, `/en`
- **Prisma 7** with SQLite in dev, Postgres in prod (driver adapters)
- **NextAuth v5** (auth arrives in P3)
- **Nodemailer** + FCI's SMTP for all transactional mail
- `@react-email/components`, `framer-motion`, `react-hook-form`, `zod`

## Getting started

```bash
pnpm install
cp .env.example .env     # fill in SMTP_* and social URLs
pnpm db:migrate          # runs prisma migrate dev + generates client
pnpm db:seed             # seeds SiteStats + sample programs
pnpm dev                 # opens http://localhost:3000/fr
```

## Project layout

```
src/
  app/
    [locale]/
      (public)/          # marketing site — 7 onglets from client brief
      (portal)/          # client portal (P3)
      (admin)/           # FCI back-office CMS (P2)
    api/
      track/             # page-view beacon -> VisitorSession
  components/fci/        # brand components (Logo, StatCounter, ...)
  i18n/                  # next-intl routing + request config
  lib/                   # db, mail, utils, zod/localized, site config
  proxy.ts               # Next 16 rename of middleware - wires next-intl
messages/                # fr.json, en.json
prisma/
  schema.prisma          # single schema; SQLite in dev, Postgres in prod
  seed.ts
public/brand/            # logos supplied by FCI
```

## Phasing

| Phase | Scope | Status |
| --- | --- | --- |
| **P1 Marketing MVP** | 7 public onglets + FR/EN + light/dark + forms to SMTP + tracking | shipping |
| P2 Admin CMS | Programs/Lots/Activities/Team CRUD, Lead/Application inbox | planned |
| P3 Client portal | Buyer/prospect/applicant dashboards, Reservation -> Sale flow | planned |
| P4 Chat + scheduler | In-app chat (SSE), appointment booking | planned |
| P5 Analytics | Visitor map (MaxMind GeoLite2 + Leaflet) + funnel | planned |
