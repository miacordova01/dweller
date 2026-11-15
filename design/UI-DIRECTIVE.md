# DWELLER — MASTER UI IMPLEMENTATION DIRECTIVE

## Objective

You are building Dweller, a premium, mobile-first rental discovery and AI
property management application.

**CRITICAL: the three design panels in `design/` are the visual source of truth
for this project.**

- `design/reference.png` — brand and opening experience
- `design/reference-renter.png` — renter discovery experience
- `design/reference-renter-2.png` — tenant dashboard, AI, maintenance, payment

Previous implementations have not matched them closely enough.

Do not interpret these images loosely. Do not generate your own generic UI. Do
not replace their visual language with standard SaaS components.

Recreate the design system and individual screens as faithfully as possible,
while making every screen fully functional.

Treat this as a visual engineering task, not a creative redesign. The finished
app should look like the screenshots were converted directly into an
interactive mobile application.

---

# PART 1 — GLOBAL DESIGN SYSTEM

## 1.1 Color palette

| Token | Hex | Purpose |
|---|---|---|
| `ink` | `#0B1020` | Primary headings and icons |
| `purple` | `#7C3AED` | Brand accent, AI, active navigation |
| `purpleDark` | `#5B21B6` | Pressed states |
| `lavender` | `#F1EDFF` | AI cards and selected elements |
| `sky` | `#A7D8FF` | Soft background accents |
| `canvas` | `#FAFBFF` | Main app background |
| `white` | `#FFFFFF` | Cards and surfaces |
| `mint` | `#D9FBE9` | Successful actions |
| `blue` | `#477CF5` | Primary action buttons |
| `muted` | `#667085` | Secondary text |
| `border` | `#E7E5F2` | Borders and separators |

Do not introduce unrelated colors. White dominates. Lavender and sky appear
sparingly. Purple is the recognizable brand accent. The app should not look
overwhelmingly purple.

## 1.2 Typography — ARIAL

Use **Arial** throughout, with bold carrying the weight. This supersedes the
earlier Manrope direction; do not load Manrope and do not bundle a webfont.
Use the platform font: `Arial` resolves to ArialMT and `Arial-BoldMT` on iOS
and aliases to Roboto on Android.

| Element | Size | Weight | Line height |
|---|---|---|---|
| Welcome headline | 36 | Bold | 1.12 |
| Screen headline | 27 | Bold | 1.2 |
| Section heading | 19 | Bold | 1.3 |
| Card heading | 16 | Bold | 1.35 |
| Body | 14 | Regular | 1.5 |
| Secondary text | 12 | Regular | 1.45 |
| Button text | 14 | Bold | 1.2 |
| Bottom navigation | 10 | Regular | 1.2 |

Slightly negative letter spacing on large headings. Avoid oversized text
anywhere except the welcome headline.

## 1.3 Layout and spacing

Design for 390 x 844, then adapt responsively.

- Horizontal screen padding 20
- Section spacing 24
- Card internal padding 16
- Space between cards 12-16
- Large card radius 20, small card radius 14
- Input radius 14, button radius 13
- Bottom navigation about 72 plus safe area
- Minimum touch target 44 x 44

Respect iOS safe areas top and bottom. Subtle borders and shadows only; cards
sit slightly above the canvas, never floating dramatically.

## 1.4 Visual principles

Large carefully cropped residential photography, clean white surfaces, rounded
cards with soft borders, compact iconography, purple active states, lavender AI
surfaces, blue primary actions, mint success states, generous whitespace,
simple readable typography.

No random gradients, floating shapes, decorative illustrations or extra
dashboard widgets. Not every component is a card — use whitespace and type for
hierarchy.

---

# PART 2 — REFERENCE 1: BRAND AND OPENING

`design/reference.png`

## 2.1 Logo

A thin geometric capital D, a small purple circular doorknob inside it, and
lowercase "weller" in a clean sans, in deep ink. The D must resemble a door
without becoming a literal house illustration. Build it as an SVG component.
Never substitute a house icon or a plain D without the knob.

## 2.2 Splash

Full-screen very pale lavender-white. A large Dweller D centred. No navigation,
no cards, nothing else. The initial state is extremely minimal, and the door is
CLOSED — panel 1 is labelled "Logo appears", so frame zero is a flat clean mark,
not a door standing ajar.

## 2.3 Interactive door animation

Tap the D to begin.

1. The purple doorknob responds with a subtle scale.
2. The vertical portion of the D behaves as a hinge.
3. A 3D door panel rotates open.
4. A softly lit residential interior becomes visible.
5. The camera moves through the opening.
6. The scene expands into the welcome screen.

Perspective transforms, smooth easing, about 2-2.5s after the tap. It must feel
like a physical door opening, not a logo rotation. Include a reduced-motion
fallback.

## 2.4 Welcome screen

Match panel 4 of reference.png and panel 2 of reference-renter.png.

- Dweller logo centred, generous breathing room
- Headline in bold Arial, deep ink
- Supporting copy in muted gray: "Your next place, and everything after."
- A San Francisco residential photograph, ideally colourful Victorians,
  occupying the lower portion with a curved or softly shaped top boundary
- Primary "Get started" in Dweller purple, full width
- Secondary "I already have an account"
- Apple, Google and email as compact buttons in one row
- Do not crowd the bottom of the screen

---

# PART 3 — REFERENCE 2: RENTER DISCOVERY

`design/reference-renter.png`

## 3.1 Discovery screen (panel 3)

**Header** — Dweller wordmark top left, notification bell with a small purple
unread dot top right.

**Search** — a large rounded field below the header, pale lavender background,
leading search icon, placeholder "Search homes, neighborhoods...".

**Filter chips** — horizontally scrollable: Location, Filters, Property type,
Price, Move-in date. The location chip uses soft sky blue; the others are white
with subtle borders. Compact and rounded.

**Property feed** — large vertically stacked cards, each with a large
photograph, a favourite heart in a floating circular button, price, beds baths
and square footage, neighbourhood, and availability status. The image occupies
roughly 55-65% of the card height. Bright architectural photography, never
illustrated houses.

**Bottom navigation** — Discover, Saved, Activity, Home, Profile. Thin line
icons. Active: purple icon, purple label, soft lavender background highlight.
Inactive: deep ink icon, muted label. Fixed, with safe-area handling.

## 3.2 Property detail (panel 4)

**Hero** — a large edge-to-edge photograph across roughly the top 35-40%, with
back upper left, share and favourite upper right as white circular controls,
and gallery dots near its lower edge.

**Details sheet** — a white section with large rounded upper corners that
OVERLAPS the bottom of the photo, so the gallery runs underneath it. Inside:
price as the headline, then the meta line, then the neighbourhood.

Then a lavender "Ask Dweller AI" row with a small purple sparkle and a right
chevron. Then compact amenity chips.

**Description** — "About this home" with a short paragraph and expandable
details.

**Sticky actions** — "Schedule tour" secondary and "Apply now" primary in
electric blue, side by side, always visible while scrolling.

---

# PART 4 — REFERENCE 3: TENANT HOME DASHBOARD

`design/reference-renter-2.png`, panel 1.

Header with the wordmark and a bell with a purple dot. A large greeting
"Hi Alex," and "Here's what's happening at home.", with a subtle residential
photograph behind the greeting that never harms readability.

**Quick actions** — four equally sized rounded buttons: AI Assist, Discover,
Request Repair, Pay Rent. Line icon, short label, white or lavender surface,
subtle shadow. AI Assist carries the strongest purple accent.

**Upcoming** — a card with a small property thumbnail on the left, an event
badge, the title, the date and time, and a chevron.

**My Lease** — a mint Active badge, property address, unit, lease dates, next
rent amount and due date. Clean white card with thin dividers.

Navigation uses the same language as discovery.

---

# PART 5 — DWELLER AI SCREEN

`design/reference-renter-2.png`, panel 3.

Purple sparkle icon with the title "Dweller AI" on a very subtle lavender
accent. Large "Hi Alex," then "How can I help today?". Spacious.

Four stacked action cards: Schedule a tour, Report a maintenance issue, Ask
about my lease, Find new listings. Each with a small lavender icon container, a
purple line icon, a bold title, a short description, white background and a
thin lavender border. Avoid oversized cards.

Composer sticky above the safe area: rounded field "Ask Dweller anything...",
purple sparkle on the left, purple circular send button on the right.

**Agent activity** — when an agent acts, show structured progress cards with
clear states: Working, Awaiting approval, Completed, Failed. Show real tool
results, never fabricated confirmations. The AI must call real application
tools and update persistent records.

---

# PART 6 — MAINTENANCE SCREEN

`design/reference-renter-2.png`, panel 4.

Back arrow and the title "Maintenance Request". A large rounded photograph of
the issue at roughly 2:1, which the user can upload and replace. An "Issue"
label over an editable field.

**Status timeline** — Request submitted, Reviewing & scheduling, Repair in
progress, Completed. Purple for active and completed, gray for future, joined
by a thin vertical line.

**AI status card** — a soft lavender card at the bottom with a purple sparkle.
Never claim a vendor was contacted unless one actually was.

---

# PART 7 — RENT PAYMENT

`design/reference-renter-2.png`, panel 5.

Clean white background, a large mint rounded success icon with a green check, a
small restrained celebration. Headline "Rent paid!" and the supporting amount
line. Only show this after confirmed success.

Receipt card with address, date, amount and status, thin dividers, a mint Paid
badge. Primary "View receipt", secondary "Back to home".

---

# PART 8 — LANDLORD EXPERIENCE

No landlord screen exists in the references. Extend the same design system;
never borrow the look of enterprise property software. It is the same consumer
product with more operational functionality.

**Overview** — wordmark, bell, "Good morning, Alex." and "Here's how your
properties are doing." A portfolio card showing properties, occupied units,
monthly rent expected and payments received, on a restrained lavender or sky
background. No complicated charts.

**Needs attention** — the most important section. Maintenance approval
requested, tenant inquiry awaiting response, tour confirmation needed, upcoming
lease expiration, rent overdue. Each with a clear action: Review request,
Approve repair, View inquiry. Purple only for AI actions, blue for primary
operational actions.

**Properties preview and screen** — photography-first cards with thumbnail,
address, occupancy, monthly rent, status and open maintenance count. An "Add
property" action. Tapping opens a management detail with a large photo, address
and occupancy, and segmented Overview / Tenants / Lease / Maintenance.

**AI approvals inbox** — the standout. "Needs your approval", cards describing
what Dweller AI prepared, estimated cost, and Approve / Review details. After
approval the AI may proceed. Never auto-approve payments, leases, applicant
decisions or expensive repairs. Each approval updates the task and the
tenant-facing status.

**Messages** — a unified inbox of tenant conversations, inquiries, maintenance
threads and AI-prepared replies. Reply directly, edit an AI draft, approve an AI
response, view history.

**Navigation** — Overview, Properties, Inbox, Activity, Profile, with the same
icon style, spacing and active treatment as the renter bar.

---

# PART 9 — ANIMATION

| Interaction | Duration |
|---|---|
| Button press | 120-160ms |
| Card expansion | 220-280ms |
| Bottom sheet | 280-350ms |
| Screen transition | 220-320ms |
| Favorite | 180-250ms |
| Success | 450-700ms |
| Door opening | 2-2.5s |

Spring motion where appropriate. Do not animate continuously. Avoid excessive
bounce, parallax, glow or decorative motion.

Save fills the heart purple with a small scale. Opening a property expands the
card image into the detail hero. Schedule tour raises a bottom sheet. AI actions
show progress and update the record. Approving maintenance transitions the card
to a completed state. Paying rent shows processing, then success only on
success. Switching role transitions smoothly between workspaces.

---

# PART 10 — IMPLEMENTATION

## 10.1 Components

DwellerLogo, DwellerDoorAnimation, AppHeader, BottomNavigation, PropertyCard,
PropertyGallery, FilterChip, PrimaryButton, SecondaryButton, AIActionCard,
MaintenanceTimeline, RentSummaryCard, LeaseCard, ApprovalCard,
PropertyManagementCard, EmptyState, LoadingSkeleton, BottomSheet.

Consistent tokens throughout. Never restyle each screen independently.

## 10.2 Visual fidelity workflow

One screen at a time. For each:

1. Identify the corresponding reference image.
2. Recreate the layout and proportions.
3. Match typography, spacing and colors.
4. Match image cropping and aspect ratios.
5. Match borders, shadows and corner radii.
6. Implement the interactions.
7. Screenshot the implementation on a device.
8. Compare it side by side with the reference.
9. Correct the visible differences.
10. Only then move to the next screen.

Do not proceed until a screen is visually close to its reference. Use a
consistent viewport for comparison. Judge landlord screens against the
established renter system.

## 10.3 Functional requirements

Every visible control does something. No dead buttons, no placeholder
navigation, no fake AI confirmations. Real state and backend persistence for
saved properties, tours, applications, leases, maintenance tickets, rent
records, landlord approvals and agent activity. Simulated integrations must be
labelled as demo functionality.

## 10.4 Final checklist

The opening D is interactive. The door animation works on mobile. Welcome,
discovery, property detail, tenant dashboard, AI, maintenance and payment
screens each match their reference. The landlord workspace uses the same design
language. All navigation works. All buttons do something. Safe areas respected.
Nothing hidden behind the bottom bar. No horizontal overflow. All images load.
Typography consistent. AI actions update real records. Landlord approvals
enforced. No unsupported success states.

---

# FINAL INSTRUCTION

**Do not redesign Dweller. Recreate the supplied references as closely as
possible.** Renter screens are replication tasks. Landlord screens are
design-system extensions. Prioritise visual fidelity, functionality and mobile
usability equally. Never substitute a generic component because it is faster.
