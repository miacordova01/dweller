# Dweller — Design System

Mobile-first, AI-native rental discovery and property management.
Visual reference: `design/reference.webp` — read it before implementing anything here.

Design objective: make renting feel effortless, approachable, and unexpectedly
delightful. Dweller should read as a next-generation consumer product, not as
real estate software.

Avoid: generic SaaS dashboards, heavy gradients, glowing AI orbs, cluttered
cards, animation that does not serve a task.

---

## 1. Color

| Token | Hex | Use |
|---|---|---|
| `ink` | `#0B1020` | Primary text, wordmark, bottom-nav icons when active |
| `inkMuted` | `#5A6478` | Secondary text, captions, inactive nav |
| `canvas` | `#FAFBFF` | App background |
| `white` | `#FFFFFF` | Cards, sheets, forms, welcome screen |
| `primary` | `#7C3AED` | Primary buttons, doorknob, brand moments |
| `lavender` | `#F1EDFF` | AI surfaces, subtle highlights, pressed states |
| `sky` | `#A7D8FF` | Background washes, discovery accents |
| `blue` | `#477CF5` | Primary actions INSIDE the app, links, active states |
| `mint` | `#D9FBE9` | Success, completed tasks |

White and ink dominate. One accent per screen, never all of them.

### Resolved conflicts

The written brief and the reference image disagree in four places. These are the
decisions — change them here, in one place, if you disagree.

1. **Ink is `#0B1020`, not `#1B2435`.** The image is the declared primary visual
   reference and `#0B1020` is the chip under the logo. `#1B2435` is dropped;
   use `inkMuted` for secondary text.
2. **Purple and blue split by context — corrected after the later panels.**
   My first reading demoted blue to links only. `reference-renter.png` and
   `reference-renter-2.png` show the real rule:
   - **Purple** is brand and AI: the doorknob, the wordmark dot, the welcome
     screen's "Get started", the AI send button, the "Ask Dweller AI" row.
   - **Blue** is the primary action once you are inside the app: "Apply now",
     "Get started" on a listing, "View receipt".
   - White with a hairline border is the secondary action: "Schedule tour".

   So the first-run CTA is purple, in-app CTAs are blue, and only one of them
   appears on any given screen. That keeps "one accent per screen" intact.
3. **AI is marked by the sparkle plus a lavender surface**, not by purple
   alone. A lavender row with a ✦ and purple text is the assistant; a blue
   button is an ordinary action.
4. **Font is Manrope**, per the brief, not Geist/Inter/Plus Jakarta from the
   image panel — that panel was an earlier exploration. Manrope is on Google
   Fonts, so `@expo-google-fonts/manrope` works with no custom asset pipeline.

---

## 2. Typography

**Arial**, with bold for anything that carries weight. Use the platform font
rather than bundling a webfont: `Arial` on iOS resolves to ArialMT and
`Arial-BoldMT`; on Android it aliases to Roboto, which is the right fallback.
Do not load Manrope — it was the earlier direction and has been replaced.

| Role | Weight |
|---|---|
| Slogan and display | Bold, tight letter spacing (`-0.02em`) |
| Headings | Bold |
| Body | Regular |
| Buttons | Bold |
| Prices | Bold, tabular figures |

## 3. The mark

A capital **D** that reads as a door: thin stroke, with a small purple circular
doorknob inside it, positioned where a knob would sit. It should look like a
logo, not an illustration of a door.

The door is a recurring motif — in empty states, in the move-in celebration, in
the onboarding transition — but the full opening animation plays once.

---

## 4. Signature opening animation

The first thing a new user sees. Mobile-first and **tap-triggered**.

**Initial state: the door is CLOSED.** A flat, thin ink D centred on a near
white surface, with the purple knob inside it and the Dweller wordmark beneath.
It must read as a clean logo, not as a door standing ajar. `reference.png`
labels the four beats explicitly — *1 Logo appears, 2 Door animates open,
3 Peek into home, 4 Transition to sign up* — and starting part-open destroys
beat 1, which is the whole reveal.

**On tap:**
1. Doorknob responds to the touch first (scale down, spring back).
2. The vertical stroke of the D rotates on its hinge.
3. Perspective-based 3D opening — `transform: [{ perspective: 800 }, { rotateY }]`.
4. A soft sky-blue environment is revealed behind the opening.
5. The opening scales up until it fills the screen.
6. Seamless transition into the welcome screen.

**Timing:** 2–2.5s total. Spring easing on the knob and hinge, smooth cinematic
easing on the expansion.

**Implementation:** `react-native-reanimated`. Real interactive components, not
a video.

Note on step 5: do not attempt a true 3D camera push. Scale and fade the door
frame outward while the revealed scene scales up behind it — it reads as moving
through the doorway and stays at 60fps.

**Requirements**
- Works on iOS and Android.
- Repeated taps are ignored while playing.
- Honour `useReducedMotion()` — skip straight to the welcome screen.
- A visible skip affordance after ~600ms.
- Authenticated returning users never see it; they land on their dashboard.

---

## 5. Welcome screen

Reached when the door finishes opening.

- **Top:** wordmark, centred, generous whitespace, subtle sky wash.
- **Middle:** headline **"Dwell well."** in Arial Bold, supporting line
  *"Your next place, and everything after."* directly beneath it. Optionally one residential
  photograph — keep it uncluttered.
- **Bottom:** primary **Get started**, secondary **I already have an account**,
  then Continue with Apple / Google / email.

Auth buttons must be wired to real flows, not decorative.

**Motion:** wordmark fades and slides into place, headline staggers in, buttons
rise from below, every button has tactile press feedback. No bouncing, no
floating, no long delays.

---

## 6. Onboarding

**Screen 1 — What brings you here?** Two large cards: *Find a home* ("Discover
rentals, schedule tours, and manage your next move") and *Manage my properties*
("List rentals, manage tenants, and automate everyday tasks"). One account can
hold both roles later.

**Screen 2 — Personalization.**
Renter: preferred location, monthly budget, move-in timeframe, room vs entire
property, essential amenities.
Landlord: number of properties, location, currently occupied, want to list
vacancies.

**Screen 3 — Welcome home.** Short personalized transition into the right
dashboard, using a doorway-inspired motion. Do not replay the full splash.

---

## 7. Navigation and motion

Bottom tab bar, labelled icons, subtle active-state animation.

- Renter: Discover · Saved · Activity · Home · Profile
- Landlord: Overview · Properties · Inbox · Activity · Profile

AI is contextual throughout — never a separate chatbot tab.

**Discovery:** smooth vertical scroll, edge-to-edge imagery, subtle parallax,
swipeable galleries, animated save, shared-element transition into detail,
filters in a bottom sheet.

**AI surfaces:** sparkle glyph beside an AI suggestion, progress indicator while
an agent works, compact action cards showing what it did, explicit approval
buttons where the landlord must authorise, gentle success animation. No chat
bubbles as the primary interface, no animated spheres.

**Microinteractions** for: saving a listing, booking a tour, completing an
application, signing a lease, paying rent, opening a maintenance request,
approving an AI action, moving in. Move-in gets a small door-motif celebration.

---

## 8. Mobile-first rules

Modern iPhone dimensions first. Respect safe areas, notches, home indicator.
Comfortable touch targets. Gestures where intuitive. Bottom sheets for
contextual actions. Never desktop tables. Primary actions in one-hand reach.
Forms behave with the keyboard up. The landlord experience must be fully usable
on a phone.

---

## 9. Quality bar

Consistent spacing and type, strong hierarchy, real property photography, high
quality icons, smooth transitions, beautiful empty states, thoughtful loading
states, clear errors, accessible contrast.

Every animation must serve the task. Someone who just wants to find a home, pay
rent, or report a leak should never be slowed down by the design.


---

## 10. In-app screens

`design/reference-renter.png` and `design/reference-renter-2.png` are the
reference for everything past onboarding. Read them before building any of it.

**Chrome.** Bottom tab bar, labelled icons, the active tab in purple on a
lavender pill. Cards are white on `canvas`, radius about 16, with a soft
shadow rather than a border. Screen padding 20. Section headings in Semibold.

**Discover** — wordmark top left, a notification bell top right, a rounded
search field, then a horizontal row of filter pills (location with a chevron,
Filters, a people count). Listing cards are a large photo with a heart in the
top right, then price, a `2 bd · 1 ba · 950 sq ft` meta line, neighbourhood
with a pin, and a mint "Available Oct 1" chip.

**Listing detail** — full-bleed photo gallery with page dots, back, share and
save buttons floating on it. Below: price as the headline, the meta line,
neighbourhood, then a lavender **✦ Ask Dweller AI** row with a chevron. Then
three bordered stat tiles (bed, bath, sq ft), "About this home", and a
sticky footer with "Schedule tour" (white, bordered) and "Apply now" (blue).

**Renter home** — "Hi {name}," over "Here's what's happening at home." A row
of four square quick actions: AI Assist (lavender, purple icon), Discover,
Request Repair, Pay Rent. Then "Upcoming" with a thumbnail row for the next
tour, then "My Lease" with an `Active` mint chip, the address, the term, and
next rent due.

**Dweller AI** — ✦ with the "Dweller AI" title on a soft lavender wash,
"Hi {name}, How can I help today?", then four action cards each with an icon,
a title and a one-line description: Schedule a tour, Report a maintenance
issue, Ask about my lease, Find new listings. A composer pinned to the bottom
reading "Ask Dweller anything…" with a purple send button.

**Maintenance request** — the photo the tenant took, the issue as an editable
field, then a vertical status timeline: Request submitted (done, with a
timestamp), Reviewing & scheduling (current), Repair in progress, Completed.
Below it a lavender ✦ card describing what the agent is doing right now.

**Confirmation** — a mint circle with a check, a headline, a short line, a
summary card of rows, then a blue primary and a white secondary button.

### The landlord side

Same components, same tokens, different content. Nav is
Overview · Properties · Inbox · Activity · Profile.

- **Overview** mirrors renter home: "Hi {name}," / "Here's what needs you."
  Quick actions: AI Assist, Add listing, Approvals, Rent. Then anything
  waiting on a human — an application to review, a repair quote to approve —
  and a rent-collected summary for the month.
- **Properties** mirrors Discover, but each card is a unit the landlord owns,
  with an occupancy chip instead of a price chip.
- **Inbox** is the inquiries the leasing agent is handling, newest first.
- **Approvals** is the one screen with no renter equivalent: every
  `agentActions` row with `requiresApproval` and status `proposed`, each with
  what the agent wants to do and Approve / Decline. This is where the product
  argument lives — the agent prepares, the human decides.
