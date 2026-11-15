# Hackathon log

- **Project:** Dweller
- **Event:** The Consumer Mobile Hackathon
- **What it does:** AI-native rental platform for independent landlords and renters, where a renter can turn a listing they found on Instagram, TikTok or Craigslist into a structured listing card by sharing a screenshot or a link.
- **Live app:** not deployed
- **Repo:** https://github.com/miacordova01/dweller
- **Frontend:** not deployed
- **Convex deployment:** https://accurate-bobcat-168.convex.cloud
- **Components:** @convex-dev/auth, @convex-dev/rate-limiter
- **Convex features:** schema, tables, indexes, queries, mutations, internal mutations, actions, file storage, typed component env
- **Auth:** Convex Auth
- **AI models:** gpt-6-luna
- **Started:** 2026-11-15T18:45:39Z
- **Last updated:** 2026-11-15T23:30:00Z

## Log

### 2026-11-15 - c3354e3
Created the repository and defined the product: an AI-native rental platform for
independent landlords and renters. No app or Convex code yet (`README.md`).

### 2026-11-15 - 2caf969
Scaffolded an Expo app with Expo Router and TypeScript at the repo root and made
it Convex-ready. Added a `listings` table with an index on neighborhood, a
`list` query, an `add` mutation, and an internal `seed` mutation that inserts
three San Francisco listings only when the table is empty. Convex features:
schema, tables, indexes, query, mutation, internal mutation
(`convex/schema.ts`, `convex/listings.ts`). The iOS build was installed on a
cloud iPhone and a listing was added through the form, with `listings:list`
confirming the row on the deployment.

### 2026-11-15 - ffa8e45
Implemented the full data model behind the four planned agent capabilities:
`profiles`, `listings`, `savedListings`, `inquiries`, `availability`, `tours`,
`applications`, `leases`, `leaseClauses`, `payments`, `maintenanceTickets`,
`vendors`, `ticketBookings`, `conversations`, `messages`, `agentActions` and
`notifications`, with indexes on the access paths each one is read by. All money
is stored as integer cents and rows rely on the built-in `_creationTime` rather
than a `createdAt` field. `conversations` and `messages` are shared by every
capability so the assistant keeps one history instead of four, and `agentActions`
is the audit log and approval queue: anything financial or binding is written
with `requiresApproval` and executes only after a human decides.

Convex Auth 2.x no longer exports `authTables`, so its auth component is
registered in a new `convex/convex.config.ts` and the app owns an empty `users`
table that the other tables reference. Sign-in methods are not wired yet.
Existing rows on the dev deployment were migrated to the new shape in place
before schema validation was re-enabled. Convex features: schema, tables,
indexes, components (`convex/schema.ts`, `convex/convex.config.ts`).

### 2026-11-15 - b838122
Added the signature opening experience: a tappable door that hinges open on a
perspective transform, a welcome screen, and three onboarding steps, with the
completion flag persisted so returning users land straight on the feed. Verified
on a Revyl cloud iPhone. No Convex changes.

### 2026-11-15 - 07000e1
Added the rental discovery agent, the first of the four capabilities to be
built for real. `convex/discovery.ts` holds two actions in the default Convex
runtime. `importFromScreenshot` reads an uploaded image out of Convex file
storage, verifies its type from its first bytes, and sends it to the OpenAI
Responses API as an `input_image` with strict JSON-schema structured output.
`importFromUrl` fetches a listing page server-side, reduces it to title, meta
tags, JSON-LD and visible text, and extracts from that; Instagram and TikTok
URLs are refused before any fetch, and again after redirects, because they are
JavaScript-rendered. Each import writes a `listings` row in one transaction with
`source`, `sourceUrl`, `importedBy` and a `missingFields` array naming every
field the model could not determine, plus an `agentActions` row recording the
tool, its arguments and its result. Failures write a `failed` action row. The
model key is read from the component env declared in `convex.config.ts` and
never reaches the app bundle. Convex features: actions, file storage, mutations,
typed component env (`convex/discovery.ts`, `convex/convex.config.ts`).

Proven on a Revyl cloud iPhone against two real posts: an Instagram screenshot
returned all nine fields, and a TikTok screenshot returned six of nine, with
rent correctly reported as not found because the caption said to ask for it.
The three unresolved fields stayed editable and the saved card showed its source
and a missing-field count.

### 2026-11-15 - 3baf60e
Seeded eighteen owner-posted San Francisco rentals across ten neighbourhoods —
spare rooms, in-law units, ADUs, studios and small flats — each with a real
street address, a rent banded to its unit type, a deposit, square footage,
amenities and matching photography. The mutation skips any address already
present so it can be run repeatedly. Convex features: internal mutation
(`convex/seed.ts`).


### 2026-11-15 - 03e003c
Made the assistant and the approvals queue real. `convex/assistant.ts` runs one
turn of a single Dweller assistant: it appends the message, calls `gpt-6-luna`
through the Responses API with four function tools, executes them, and appends
the reply. `findListings` searches the same query the feed uses, so the agent
and the UI can never disagree. `bookTour` resolves the landlord, reuses or
creates the inquiry, reads the landlord's `availability` and picks the first
free slot that does not overlap an existing tour, then inserts a `proposed`
tour and a `requiresApproval` row in `agentActions`. `createMaintenanceTicket`
runs a structured call to infer category, urgency, diagnosis and a cost
estimate, creates the ticket and proposes the landlord's cheapest matching
vendor. `answerLeaseQuestion` reads the tenant's lease and its `leaseClauses`
and answers from those rows only — the model returns section numbers and the
quoted text always comes from the stored clause, so a citation cannot be
invented.

Approvals stopped being decorative in the same change. `approve` and `decline`
switch on the proposed tool and perform it: approving a `bookTour` confirms the
tour and posts the confirmation into the renter's conversation; approving a
`contactVendor` confirms the booking and moves the ticket to `scheduled`. The
action records its `result` and becomes `executed`, or `failed` if the target
moved on. Convex features: actions, mutations, indexes, components
(`convex/assistant.ts`, `convex/landlord.ts`, `convex/tours.ts`,
`convex/maintenance.ts`, `convex/saved.ts`, `convex/people.ts`).

Proven on the dev deployment rather than asserted: the assistant booked a tour
for 10:00 because showing hours start then and an existing tour sat at 10:30;
approving it flipped the tour to `confirmed` and the action to `executed`; a
lease question returned "within the five-day grace period" citing Section 3.2.

### 2026-11-15 - abb055d
Rebuilt every screen on a shared design system and connected the demo path.
`Screen` owns the layout — a content region and then the tab bar — so no screen
can draw behind the bar. `listings.discover` gained real filter arguments and
onboarding answers now persist to `profiles.preferences`, so Discover opens
filtered to what the renter asked for, with an empty state that offers to clear.
Hearts call `saved.toggle`, Schedule tour calls `tours.propose`, the maintenance
form calls `maintenance.create`, and the AI composer calls `assistant.ask`. A
tour shows as awaiting approval and updates to confirmed in place when the
landlord approves, because `assistant.conversation` joins each message to its
agent action. Convex features: queries, mutations, indexes, schema
(`convex/listings.ts`, `convex/people.ts`, `convex/schema.ts`).

### 2026-11-15 - e2f5af4
The door now opens on every cold launch, so the opening is reachable in a demo.
Saved, Activity and Home read real data — hearted homes, tours from
`tours.mine`, repairs from `maintenance.mine`, and the lease from
`people.currentLease` — replacing hard-coded rows. Listings whose photo fails to
load show a deliberate panel rather than an empty block.

### 2026-11-15 - working tree
Remaining: landlord property detail, AI-drafted inbox replies, and sign-in.
Convex Auth is mounted as a component but no sign-in flow exists, so the app
resolves a seeded demo renter and landlord. Rent is displayed and never charged.
