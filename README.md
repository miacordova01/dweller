# Dweller

**Dwell well.** Your next place, and everything after.

Dweller is an AI-native rental platform for independent landlords and renters —
someone renting out a spare room, leasing an ADU, or managing two or three
properties. Not institutional real estate.

Built at The Consumer Mobile Hackathon, 15 November 2026, on Capy, Convex and
Revyl.

## What it does

**Discover.** A feed of independently owned San Francisco rentals. Filters for
price, bedrooms and neighbourhood, seeded from what you say during onboarding,
so a renter who wants a one-bedroom under $3,000 in the Mission lands on exactly
those.

**Bring in what you found elsewhere.** Rentals get shared as Instagram posts and
Craigslist links, not listings. Share a screenshot and the discovery agent reads
the rent, address, neighbourhood, beds and baths straight off the image and
turns it into a listing card, flagging what it could not determine so you can
fill it in. Paste a link and it extracts the same fields from the page.
Instagram and TikTok links are refused on purpose — they are JavaScript rendered
and cannot be fetched server-side, so the app asks for a screenshot instead.

**One assistant, four capabilities.** Ask Dweller anything and it can search
listings, book a tour against the landlord's real availability, open a
maintenance ticket with a triaged category and urgency, or answer a question
about your lease by citing the clause it relied on.

**The human decides.** Anything binding is a proposal, not an action. The agent
books a tour as `proposed` and writes a row to an approvals queue; the landlord
approves, and only then does the tour become `confirmed` and the renter's screen
update. Same for a repair quote. Payments, applicant decisions and lease changes
are never automatic.

## Stack

- **Expo** SDK 58, Expo Router, TypeScript — `src/app/`
- **Convex** — `convex/`, deployment `accurate-bobcat-168`
- **OpenAI** `gpt-6-luna` through the Responses API, called only from Convex
  actions so the key never reaches the app bundle
- **Revyl** — iOS builds and cloud iPhones for every check in this repo
- Convex components: `@convex-dev/auth`, `@convex-dev/rate-limiter`

## Layout

```
convex/
  schema.ts       17 tables: listings, inquiries, tours, applications,
                  leases, leaseClauses, payments, maintenanceTickets,
                  vendors, ticketBookings, conversations, messages,
                  agentActions, and more
  assistant.ts    the assistant and its four tools
  discovery.ts    screenshot and link import
  landlord.ts     the approvals queue; approve/decline execute the proposal
  listings.ts     discover / myFinds / filtering
  tours.ts  maintenance.ts  saved.ts  people.ts  seed.ts

src/
  app/            screens, Expo Router
  components/     DwellerUI design system, cards, chips, timeline
  theme/          colour tokens and the type scale

design/
  reference*.png      the visual references
  UI-DIRECTIVE.md     the implementation spec
DESIGN.md             the design system
hackathon.md          build log
```

## Develop

```bash
npm install
npm run dev          # convex dev: syncs the deployment, writes .env.local
npx expo start
```

The app reads `EXPO_PUBLIC_CONVEX_URL` from `.env.local`.

The assistant and the discovery agent need `OPENAI_API_KEY` set on the Convex
deployment, not in the app:

```bash
npx convex env set OPENAI_API_KEY "sk-..."
```

Seed the demo world — 18 San Francisco rentals, a landlord, a tenant with a
lease, and a few pending approvals:

```bash
npx convex run seed:seedListings
npx convex run seed:seedAgentDemo
```

## Status

Built in a day, so some of it is honest scaffolding. Sign-in is not wired —
Convex Auth is mounted and the app resolves a demo renter and landlord. Rent is
displayed, never charged. Landlord property detail and AI-drafted inbox replies
are not built.

Everything described under "What it does" works against the live deployment and
has been run on a cloud iPhone.
