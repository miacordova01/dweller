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
| `blue` | `#477CF5` | Links and active states only — never a button fill |
| `mint` | `#D9FBE9` | Success, completed tasks |

White and ink dominate. One accent per screen, never all of them.

### Resolved conflicts

The written brief and the reference image disagree in four places. These are the
decisions — change them here, in one place, if you disagree.

1. **Ink is `#0B1020`, not `#1B2435`.** The image is the declared primary visual
   reference and `#0B1020` is the chip under the logo. `#1B2435` is dropped;
   use `inkMuted` for secondary text.
2. **Purple is the primary button colour, not Electric Blue.** The mockup's
   "Create an account" button is purple and the image labels `#7C3AED` as
   Primary. Blue is demoted to links and active states. Two competing accent
   fills would violate the brief's own "one accent per screen" rule.
3. **Because purple is now the action colour, purple alone no longer signals
   AI.** AI is marked by a sparkle glyph plus a `lavender` surface. A purple
   button is just a button; a lavender card with a sparkle is the assistant.
4. **Font is Manrope**, per the brief, not Geist/Inter/Plus Jakarta from the
   image panel — that panel was an earlier exploration. Manrope is on Google
   Fonts, so `@expo-google-fonts/manrope` works with no custom asset pipeline.

---

## 2. Typography

Manrope throughout, via `@expo-google-fonts/manrope`.

| Role | Weight | Notes |
|---|---|---|
| Display / editorial headings | Medium (500) | Tighter letter spacing, `-0.02em` |
| Headings | Semibold (600) | |
| Body | Regular (400) | |
| Buttons | Medium (500) | |
| Prices | Semibold (600) | Tabular figures |

The wordmark is thin, clean, modern. Never bold, never cartoonish.

---

## 3. The mark

A capital **D** that reads as a door: thin stroke, with a small purple circular
doorknob inside it, positioned where a knob would sit. It should look like a
logo, not an illustration of a door.

The door is a recurring motif — in empty states, in the move-in celebration, in
the onboarding transition — but the full opening animation plays once.

---

## 4. Signature opening animation

The first thing a new user sees. Mobile-first and **tap-triggered**.

**Initial state:** white screen, large thin black D centred, purple doorknob
inside it. Nothing else — no text, no buttons, no hint copy.

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
- **Middle:** headline **"Find home. Feel at home."**, supporting line
  *"Your next place, and everything after."* Optionally one residential
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
