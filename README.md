# FitCircle

A private workout-streak app for a small group of friends.

Expo SDK 57 (React Native 0.86, React 19), Supabase (`@supabase/supabase-js` 2.x, CLI 2.120). The product is the web build; routes live in `src/app/`.

## Commands

| Command | What it does |
|---|---|
| `npm run web` | Start the app in a browser at http://localhost:8081 |
| `npm run typecheck` | Type-check |
| `npm test` | Run the unit tests |
| `npm run lint` | Lint |
| `npx supabase start` | Start the local database (needs Docker running) |
| `npm run test:db` | Run the database tests against the local database |
| `npx supabase stop` | Stop the local database |
| `npm run build:web` | Build the website into `dist/`. Always clears the build cache, because a cached build can keep old `.env` values |
| `npx eas-cli@latest deploy --prod` | Upload `dist/` to the public link |

## First-time setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in the two values from your Supabase project (Settings, API).
3. `npm run web`

## Google sign-in setup (once)

Sign-in runs against the hosted Supabase project, also during local development.

1. Supabase: create a project in the Mumbai region.
2. Google Cloud Console: create an OAuth client of type "Web application". Add the authorised redirect URI shown in Supabase under Authentication, Providers, Google (it ends in `/auth/v1/callback`).
3. Supabase: Authentication, Providers, Google: enable it and paste the client ID and secret.
4. Supabase: Authentication, URL Configuration: set the Site URL to the hosted app's address and add `http://localhost:8081` to the redirect URLs.

## Database changes

Add a new file under `supabase/migrations/`; never edit one that has been applied. Every table gets its row level security policies and a test under `supabase/tests/` in the same change.
