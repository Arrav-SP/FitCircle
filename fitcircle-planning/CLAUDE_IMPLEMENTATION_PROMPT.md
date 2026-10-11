# FitCircle — Implementation Prompt for Claude Code

Give the text below the line to Claude Code at the start of a building session, and name the roadmap step you want.

---

## Your task

You are building FitCircle, a partner workout-streak app, as a private MVP for the owner, their girlfriend and a few close friends. The owner is experienced with SQL and PostgreSQL and new to React Native and Expo. You build **one roadmap step at a time, and only the step the owner names**. If no step has been named, ask which one.

The specification is `fitcircle-planning/FINAL_PRODUCT_BLUEPRINT.md`. It is the source of truth. `DECISIONS_AND_OPEN_QUESTIONS.md` in the same folder lists decisions in force. If this prompt and the blueprint disagree, stop and ask.

## Before you edit anything

1. Read the repository's `CLAUDE.md` and `AGENTS.md` and follow them.
2. Look at what exists: `package.json`, `src/`, `supabase/migrations/`, `supabase/tests/`. Reuse the components, hooks and patterns already there.
3. Read the blueprint rows for the named step (section 10), its requirement IDs (section 3), and sections 6, 7 and 8 where they apply.
4. If the repository and the blueprint conflict, say so and wait.

## What is being built

- **The hosted web app is the product.** Expo, React Native, TypeScript and Expo Router, exported as a web app and opened by link on phones and desktops. There is no Android or iOS build in this phase. Design for phone widths first.
- **Google sign-in only.** No email and password.
- **Zero running cost.** Free tiers only. No paid service, plan or domain. If something cannot be done for free, stop and ask.
- **Backend:** Supabase. PostgreSQL is the source of truth. No edge functions unless the blueprint names one. No realtime; refetch after changes and on focus.
- **Server data:** TanStack Query. No form, validation or state library; add a dependency only when a few lines of code cannot do the job, and install with `npx expo install`.
- **Out of scope:** push notifications, offline use, user search, blocking, reporting, nutrition, comments, chat, health imports, store releases. If the work seems to need one, stop and ask.

## Database rules

- Tables and policies in `public`; functions the app calls in `api`; internals in `private`, which is not exposed.
- Every new table gets, in the same migration: row level security, its policies, explicit grants, constraints and indexes.
- Friendships, invites, streaks and shared items are changed only by database functions. The app has no write access to those tables.
- Every `security definer` function sets `search_path = ''`, uses schema-qualified names, acts only for `auth.uid()`, and is granted only to `authenticated`.
- Never edit a migration that has been applied. Add a new one.
- Timestamps are `timestamptz`. A calendar day is always computed with a named timezone.
- Streak numbers are recomputed from the day ledger, never incremented.

## Tests are never skipped

- For every table added or changed, pgTAP tests prove the right user can and the wrong user cannot. A denied write also checks the row is unchanged.
- Build the security tests the blueprint assigns to the step (section 7).
- For step 4, write all 17 streak tests (section 8) before any streak screen.
- Pure logic in the app gets a unit test beside it (`*.test.ts`, Node's test runner).
- A step is not done while `npm run test:db`, `npm test`, `npm run typecheck`, `npm run lint` or `npm run build:web` fails.

## Secrets

- The app holds only the public Supabase URL and key, in `.env`. The service-role key is not used.
- Never print or commit `.env`. `.env.example` lists names only.

## Honesty

- Report what you ran and what it printed. If something failed, show it.
- Never say something works unless you saw it work in this session.
- Say plainly what you could not check, such as anything needing a real phone or a real Google sign-in.

## Git and external services

- Do not commit, push, deploy, or apply migrations to the hosted database. The owner does these. Give the exact commands and a commit message.
- Work against the local Supabase stack only.
- Ask before any destructive command.

## Steps

| Step | Days | Build |
|---|---|---|
| 1 | 1–2 | Project, local and hosted Supabase, Google sign-in, first deploy |
| 2 | 3–5 | Profile and onboarding, design system, workout logging, history, trained muscles |
| 3 | 6–7 | Invite links, friendships, remove friend |
| 4 | 8–10 | Streak tables, functions and tests first; then streak screens; scheduled job |
| 5 | 11–12 | Share toggle, feed, milestones, dashboard |
| 6 | 13 | Water, body weight; then steps and sleep |
| 7 | 14–15 | Polish, every screen state, progress view, privacy settings, delete account |
| 8 | 16–18 | Real use by the group, fixes, read every access rule, backup routine |
| 9 | 19–20 | Buffer, then stretch items |

Checkpoints at days 5, 10, 15 and 20, and the cut order, are in blueprint section 10.

## When the step is done

Give the owner:

1. What was built, by requirement ID, and anything left out with the reason.
2. Each check you ran and its real result.
3. Click-by-click steps to run it and test it, with the expected result of each and what to do when it differs.
4. The commands to apply the migration to the hosted database and to deploy, and a commit message.
5. Any decision the blueprint did not cover.

Then stop. Do not start the next step until asked.
