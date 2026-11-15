# Dweller — reference-inspired mobile UI overlay

This folder is an **overlay for the existing** `miacordova01/dweller` Expo Router + React Native + Convex project, **not a standalone application**.

## Install

1. Back up your branch and create a new Git branch.
2. Copy `src/` from this folder into the repository's `src/`, allowing matching files to be overwritten.
3. Keep all original `convex/`, `package.json`, `src/lib/`, `src/components/Wordmark.tsx`, `src/components/DoorMark.tsx`, and existing assets.
4. Run `npm install`, `npx tsc --noEmit`, then `npx expo start` and inspect on an iPhone simulator at approximately 390×844.
5. Review the references in `references/` while comparing screenshots.

## Screens included

- `src/app/door.tsx`: tap-to-open, closed lavender door, white light transition
- `src/app/index.tsx`: photo-first renter discovery with Convex listings and existing import sheet
- `src/app/home.tsx`: renter dashboard
- `src/app/assistant.tsx`: Dweller AI layout and navigation (no simulated agent actions)
- `src/app/maintenance.tsx`: maintenance form and timeline preview (not persisted)
- `src/app/payments.tsx`: rent/payment overview (no real payment provider)
- `src/app/payment-success.tsx`: visual sample only, not linked to payments
- `src/app/profile.tsx`, `src/app/saved.tsx`, `src/app/activity.tsx`
- `src/app/landlord/overview.tsx`: landlord portfolio, using Convex summary
- `src/app/landlord/properties.tsx`: searchable, filterable property cards from Convex
- `src/app/landlord/inbox.tsx`: inbox landing, no fabricated messages
- `src/app/landlord/approvals.tsx`: approval overview, no fake approvals
- `src/components/DwellerUI.tsx`: shared visual language and bottom tabs

## Important limitations

These screens reproduce the *design direction*, but pixel-perfect identity to the AI-generated reference images is **not verified**. The original reference panels contain some inconsistent navigation, generated photo compositions, and spacing. The implementation has not been executed in an iOS simulator. The existing repository's onboarding, welcome, and listing-detail screens are retained because they already implement much of the reference styling and integrate with existing backend functions. For a literal image match, use the attached reference images and adjust image assets/crops and screen dimensions after a simulator comparison.

Several flows are **UI previews**, not completed product workflows: maintenance requests are local state, favorites are local state, rent is not charged, the AI composer does not invoke a model, and landlord approvals must be completed using the original working backend flow. Do not represent any of these as completed transactions.

## Recommended validation

Check the Expo Router screen registration and navigation for new routes. Run TypeScript checking; inspect missing SymbolView mappings on Android; verify Convex response fields; verify that `ImportSheet` accepts `visible` and `onClose` props (adjust if needed); test safe-area and keyboard interactions. This is a substantial UI handoff, not a production-ready release.
