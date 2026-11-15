# dweller

Dweller — AI-native rental platform for independent landlords and renters: someone renting out a spare room, leasing an ADU, or managing two or three properties.

## Stack

- Expo (SDK 58) with Expo Router and TypeScript, routes in `src/app/`
- Convex backend in `convex/`

## Develop

```bash
npm install
npm run dev          # convex dev: provisions/syncs the deployment and writes .env.local
npx expo start
```

The app reads the Convex URL from `EXPO_PUBLIC_CONVEX_URL` (written to `.env.local` by `convex dev`).

Seed three sample San Francisco listings into an empty deployment:

```bash
npx convex run listings:seed
```
