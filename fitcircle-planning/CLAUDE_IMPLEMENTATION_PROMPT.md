# FitCircle — Implementation Prompt for Claude Code

This file is a deliverable for future use. It does not authorise implementation. Give the text below the line to Claude Code only when you are ready to start building, and name the milestone you want.

---

## Your task

You are implementing FitCircle, a partner-streak fitness app, for a solo developer who is experienced with SQL and PostgreSQL and new to React Native and Expo. You implement **one milestone at a time, and only the milestone the user names**. If the user has not named a milestone and explicitly asked you to implement it, do not write application code; ask which milestone to start.

The specification is `docs/fitcircle-planning/FINAL_PRODUCT_BLUEPRINT.md`. It is the source of truth. `DECISIONS_AND_OPEN_QUESTIONS.md` in the same folder lists decisions and unresolved items. Read both before doing anything else. If this prompt and the blueprint disagree, stop and ask.

## Before you edit anything

1. Read the repository's `CLAUDE.md` and follow it.
2. Inspect what actually exists: directory tree, `package.json`, `app.json` or `app.config.*`, `supabase/` contents, existing migrations and tests. Do not assume the structure in the blueprint has been created.
3. Read the blueprint sections for the named milestone (5.10) and every requirement ID it lists (5.2), plus 5.5, 5.6 and 5.8 where relevant.
4. Tell the user, briefly: what exists, what the milestone will add, and any conflict between the repository and the blueprint. Wait for a go-ahead if there is a conflict.

## Preserve existing work

- Never overwrite, delete or reformat files unrelated to the milestone.
- If a file you need to create already exists, read it and extend it.
- Never edit a migration that has been applied. Add a new one.
- Do not touch `docs/fitcircle-planning/` except to update `DECISIONS_AND_OPEN_QUESTIONS.md` when a decision changes, and say that you did.

## Architecture you must use

- **App:** Expo, React Native, TypeScript, Expo Router. One codebase for web and Android. No iOS-only code.
- **Web first.** The web app launches first (M0–M6); the Android app is released in M7. Develop and verify in the browser. At the end of each milestone, make one Android build and run the milestone's main flow, or tell the user it still needs doing; the Android app must never be left broken.
- **Zero running cost.** Use only free tiers. Do not add any paid service, paid plan, domain, or dependency that needs one. If a requirement cannot be met for free, stop and ask.
- **Sign-in:** Google only at launch (web redirect flow). Do not build email and password sign-in.
- **Push:** standard browser push through a service worker with VAPID keys, sent from the `send-push` edge function. `expo-notifications` does not support web; it is used only in M7 for the Android app.
- **Server data:** TanStack Query. **Forms:** React Hook Form with Zod.
- **Backend:** Supabase. PostgreSQL is the source of truth.
- **Schemas:** `public` for tables and policies; `api` for functions the client may call; `private` for `security definer` internals. `private` is not exposed through the Data API.
- **Shared state** (friend requests, friendships, blocks, challenges, streak days, shared events, notifications) is written only by database functions. The client has no insert, update or delete rights on those tables.
- **Edge functions** exist only for `send-push` and `delete-account`.
- **No realtime subscriptions.** Refetch on focus and after mutations.
- **No features outside the MVP:** no nutrition, comments, chat, health imports, group challenges or native iOS work. If something seems to need one of these, stop and ask.
- Use the structure in blueprint section 5.9. Create a directory only when you put a real file in it.
- Choose library versions compatible with the current Expo SDK, check each library works on both Android and web before adding it, and record the versions in the README. Do not add a dependency for something a few lines of code can do.

## Database rules

- Every new table gets, in the same migration: row level security enabled, its policies, its constraints and indexes from blueprint 5.5.
- Every `security definer` function sets `search_path = ''`, uses schema-qualified names, has `execute` revoked from `public`, and is granted only to the roles that need it.
- Every view is created `with (security_invoker = true)`.
- Timestamps are `timestamptz`. A calendar day is always computed with an explicit IANA timezone.
- Streak numbers are recomputed from `streak_days`; never incremented.
- Evaluation and finalisation lock the challenge row first and run in one transaction.

## Authorization must be tested

- For every table you add or change, write pgTAP tests that prove the allowed user can do the action and the wrong user cannot. For a denied write, also assert the target row is unchanged.
- Implement the rows of the security test matrix (blueprint 5.6) assigned to the milestone.
- For M4, implement all 20 streak tests in blueprint 5.8 before building streak screens.
- A milestone is not complete while any of its required tests is missing or failing.

## Secrets

- The service-role key is used only inside edge functions, read from function secrets. It must never appear in app code, app configuration, logs, tests committed to the repository, or your messages.
- Never print or commit the contents of `.env` files. Keep `.env.example` to variable names only.
- If you need a credential you do not have, stop and tell the user which one and where it goes. Do not invent placeholders that look real.

## Working method

- Small steps. After each step run the relevant checks: type-check, lint, unit tests, `supabase test db`, and the end-to-end flow if the milestone has one.
- Write the test for critical logic before the logic.
- Explain unfamiliar mobile concepts in a sentence or two when they affect a decision the user has to make. The user knows SQL well; do not explain SQL.
- Keep code simple and consistent with what is already in the repository. No speculative abstractions, options or configuration.

## Honesty about results

- Report what you actually ran and its actual output. If a test fails, show the failure.
- Never say a test, build, integration or feature works unless you ran it and saw it work in this session.
- Say plainly what you could not verify: anything needing a physical device, a store account, a production project, push delivery, or Google sign-in configuration that you could not exercise.
- If a native integration or missing credential blocks a requirement, implement what can be verified, mark the rest as blocked with the exact reason, and do not fake it with mocks presented as working.

## Git and external services

- Do not commit, push, create branches on a remote, open pull requests, or change Git remotes or settings unless the user explicitly asks in this session.
- Do not deploy, publish builds, apply migrations to a hosted project, submit to a store, or create cloud resources unless the user explicitly asks. Local development stack only by default.
- Ask before any destructive command (dropping data, resetting a database other than the local one, deleting files outside the milestone).

## Milestones

Implement only the one named. Details, acceptance criteria and test gates are in blueprint 5.10.

| Milestone | Scope |
|---|---|
| M0 | Project setup, web app running, one Android development build, local Supabase, one policy-protected read, check commands |
| M1 | Google sign-in on web, age and consent, profile, design tokens, core components, tab shell, onboarding |
| M2 | Workout logging, exercise catalogue, records, calorie estimate, daily metrics, dashboard, offline-safe logging |
| M3 | Friends, requests, blocking, reporting, rate limits, policy review |
| M4 | Streak engine in the database with tests, scheduled jobs, streak screens |
| M5 | Service worker, browser push, offline app shell, notification log, shared events, reactions |
| M6 | Account deletion, export, free-tier production setup with the backup routine, accessibility and security review, web launch |
| M7 | Android app: native Google sign-in, native push, store preparation, closed test, Play release |

## End-of-milestone report

When you believe the milestone is done, report:

1. Requirement IDs implemented, and any not implemented with the reason.
2. Files and migrations added or changed.
3. Each check you ran, the command, and the real result.
4. What was not verified and what the user must do to verify it (for example, on the phone).
5. Any decision you made that the blueprint did not cover, and any place you departed from it.
6. Open questions for the user.

Then stop. Do not start the next milestone until the user asks.
