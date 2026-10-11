# FitCircle — Independent Plan

Status: planning only. Nothing here has been built or tested.
Written before weighing the second blueprint in `FitCircle_Master_Prompt.md` (Part 3). The comparison is in `PLAN_COMPARISON.md`; final decisions are in `FINAL_PRODUCT_BLUEPRINT.md`.
Source references such as [S7] point to `SOURCES_AND_VERIFICATION.md`.

**Historical document. Not the current plan.** This describes the larger public product as first reasoned, and is kept unchanged for when FitCircle grows. On 11 October 2026 the owner reset the scope to a private MVP for a few friends, built in 20 days as a hosted web app. Scope, schema, roadmap, estimates and decision numbers here no longer apply. `FINAL_PRODUCT_BLUEPRINT.md` is the current plan, and `PLAN_COMPARISON.md` section 0 says what carried over.

## 0. Situation this plan is built for

These facts came from the owner during brainstorming and shape every recommendation.

| Fact | Consequence |
|---|---|
| Real product for real users | Security, privacy, account deletion and store policy are launch work, not polish |
| Solo developer, 10–15 hours a week, alongside college | The MVP must be small; the roadmap is stated in hours as well as weeks |
| Strong SQL and PostgreSQL, beginner in React Native and Expo | Put the hard logic in the database, keep the mobile layer conventional |
| Daily device is a Samsung S25; an iPhone is available only occasionally; no Mac; no paid store accounts yet | Android is the primary native target; iPhone users are served by a web app |
| Adults 18+, India only at launch | One privacy regime, one timezone in practice, no minors' data |

## 1. Product strategy and MVP definition

### 1.1 Positioning

FitCircle is a habit app for pairs of friends. Two people agree on workout days and keep a shared streak alive. Personal tracking exists to feed the streak and to give the user a reason to open the app on their own.

It is not, at launch, a full fitness tracker or a social network. Those are crowded categories with mature products. The partner streak is the one thing a new user cannot already get elsewhere.

### 1.2 Why the vision's scope must be cut

The product vision lists five tracking categories, nutrition with a food database, a feed with comments, private chat, and health imports on two platforms. My estimate is that this is well over a year of work at 10–15 hours a week. A solo project that takes that long to reach its first user usually does not reach one.

Two items carry most of the hidden cost:

- **Nutrition.** Useful food logging needs a licensed food database, serving-unit conversion, search and usually barcode scanning. None of it helps a partner streak.
- **Open social surface (feed, comments, chat).** Free-text content between users triggers store rules on user-generated content: reporting, blocking and ongoing moderation [S17]. Each text surface adds moderation duty for one person.

### 1.3 MVP (first store release)

| Area | In the MVP |
|---|---|
| Accounts | Email sign-up, Google sign-in, 18+ confirmation, profile with unique username |
| Tracking | Workout logging (strength and cardio), manual steps, water and sleep per day, personal records for strength |
| Dashboard | Today's goals, week view, streak preview |
| Friends | Search by username, request, accept, decline, cancel, remove, block, report |
| Partner streaks | Invite a friend, agree workout days, shared streak, history |
| Sharing | Workout and streak-milestone events visible to friends, with emoji reactions only |
| Notifications | Android push: reminders, partner completed, streak lost, requests |
| Privacy | Per-event visibility, account deletion in the app and on the web, data export |

### 1.4 After launch, in order

1. Automatic step import (Health Connect) and step-based streaks.
2. Native iOS app with Apple Health import.
3. Comments, then private chat.
4. Nutrition logging.
5. Group challenges, streak freezes, workout templates.

### 1.5 Explicitly not planned

AI coaching, food photo recognition, wearable-specific integrations beyond what Health Connect and Apple Health already aggregate, public profiles, leaderboards among strangers.

## 2. Personas and journeys

| Persona | Wants | Risk for us |
|---|---|---|
| **The pair starter** (college student who already works out) | A friend to stay consistent with | Needs the friend to join; the invite flow is the growth loop |
| **The invited partner** (less consistent) | Not to let the friend down | First session must reach "streak started" in minutes |
| **The solo logger** | A clean workout log | We are weaker than dedicated trackers; keep logging fast enough not to annoy |

Key journey: A installs, logs a workout, invites B by username or link. B installs or opens the web app, signs up, accepts the friend request and the streak invitation. Both pick Mon/Wed/Fri/Sat. On each scheduled day each logs a workout; the streak grows when both have.

## 3. Information architecture

Four tabs. Fewer than the vision suggests, because the MVP has less to show.

| Tab | Contents |
|---|---|
| **Home** | Today's goals, quick-log buttons, active streak cards, recent friend events |
| **Log** | Workout logger, history, records, steps/water/sleep entry |
| **Streaks** | Active challenges, invitations, challenge detail with day-by-day calendar |
| **Profile** | Own stats, friends list and requests, settings, privacy, account |

Friends live under Profile and Home; a dedicated Friends tab is not justified until there is a feed worth browsing.

## 4. Visual design and interaction

- One token set (colour, spacing, type, radius, motion) with light and dark values; components read tokens only.
- Logging is the most-repeated action: last-used exercise and weights prefilled, large touch targets, numeric keypad, one tap to repeat a set.
- Motion is limited to state changes that mean something: set completed, day completed, streak incremented.
- Every screen defines loading, empty, error and offline states before it is considered done.
- Text respects the system font-size setting; contrast meets WCAG AA; every control has an accessibility label.

## 5. Architecture and technology choices

### 5.1 Client framework

**Recommendation: Expo with React Native and TypeScript.**

| Option | For | Against |
|---|---|---|
| **Expo + React Native** | One codebase for Android, iOS and web; cloud builds remove the need for a Mac; large ecosystem; TypeScript | Native modules need a development build, not the Expo Go app [S3] |
| Flutter | Excellent UI consistency | Dart is a second new language; web output is weaker for an app that must feel like a normal website on iPhone |
| Native Kotlin + Swift | Best health-API access | Two codebases and a Mac; not feasible solo |
| Web app only (PWA) | Simplest, no stores | No Health Connect ever; weaker notifications; not a Play Store product |

Why it fits: the owner needs Android native plus a web app for iPhone users from one codebase, without a Mac. Expo is the only option that gives all three.

Decide now: yes. Changing framework later is a rewrite.

Mobile concept worth knowing: **Expo Go** is a ready-made app that runs your JavaScript for quick experiments. A **development build** is your own app compiled with the native libraries you chose. Push notifications on Android stopped working in Expo Go from SDK 53 [S2], and health libraries always need a development build. So Expo Go is useful only for the first learning weeks.

### 5.2 Backend

**Recommendation: Supabase (managed PostgreSQL, authentication, row level security, scheduled jobs, edge functions).**

| Option | For | Against |
|---|---|---|
| **Supabase** | Relational data fits friendships and streaks; row level security enforces privacy in the database [S7]; the owner already knows SQL; Mumbai region available [S11]; scheduled SQL jobs built in [S9] | Row level security is easy to get subtly wrong and must be tested; free tier pauses idle projects [S6] |
| Firebase | Mature push and offline sync | Document model fits "both friends completed the same day" poorly; security rules are a separate language; discards the owner's SQL skill |
| Custom Node/NestJS API + Postgres | Full control, logic in one language | Hosting, auth, deployments and monitoring all become the owner's job |

Decide now: yes for PostgreSQL; the Supabase-specific parts (auth, edge functions) are replaceable later at moderate cost because the data and logic live in standard Postgres.

### 5.3 Where the business logic lives

**Recommendation: critical state changes are PostgreSQL functions; the client never writes streak or friendship state directly.**

- Friend-request transitions, challenge transitions and streak evaluation are database functions that run in one transaction.
- Clients get read access through row level security and call functions for writes that change shared state.
- Edge functions are used only where the database cannot do the job: sending push notifications and deleting auth accounts.

Why: the streak engine needs locking and transactions, which the database gives for free. The alternative, TypeScript in edge functions, means several network round trips per evaluation and hand-rolled locking. It also plays to the owner's strength.

Tradeoff: PL/pgSQL is less pleasant to unit-test than TypeScript. Supabase's CLI runs pgTAP database tests locally [S10], which covers it.

### 5.4 Client data layer

TanStack Query for server data (caching, retries, paused mutations when offline [S24]). No global state library at launch; React state and context cover the rest. Forms use React Hook Form with Zod schemas, which also validate data arriving from the server.

### 5.5 Realtime

**Recommendation: none at launch.** Without chat, nothing needs sub-second updates. Screens refetch on focus and on pull-to-refresh, and a push notification prompts a refetch. This also avoids a known gap: Supabase's change feed does not apply row level security to delete events [S8].

### 5.6 Notifications

Android: Expo's push service through `expo-notifications`. Web: that library does not support web notifications [S1], so iPhone web users need a separate browser-push implementation. Apple supports web push only for sites added to the home screen [S20]. This is the least certain part of the plan; see section 16.

## 6. Domain model (outline)

| Group | Tables | Notes |
|---|---|---|
| Identity | `profiles`, `user_private` | Split because row level security is per row: other users may read a profile row, never a private row |
| Social graph | `friend_requests`, `friendships`, `user_blocks`, `reports` | One friendship row per pair, ordered so duplicates are impossible |
| Workouts | `exercises`, `workouts`, `workout_exercises`, `workout_sets` | Exercise catalogue is seeded plus user-created |
| Daily metrics | `metric_entries` | One table for steps, water and sleep, with `source` and `external_id` so imports deduplicate later |
| Streaks | `streak_challenges`, `streak_days` | A day ledger; the streak number is always recomputed from it |
| Sharing | `shared_events`, `event_reactions` | No free text |
| Operations | `push_tokens`, `notification_log` | Log gives idempotent sends |

All keys are UUIDs. All instants are `timestamptz` in UTC. Calendar days are `date` columns computed with an explicit IANA timezone.

## 7. Security, privacy and access control

- Row level security on every table in the exposed schema, default deny.
- Private tracking data is owner-only. Friendship grants nothing by itself; a friend sees only `shared_events` rows the owner chose to share, plus the streak partner's completion for scheduled days.
- Functions that need elevated rights are `security definer`, live in a schema not exposed through the API, set an empty `search_path`, and have `execute` granted only to the roles that need them [S7].
- Views are created with `security_invoker` so they do not bypass row level security [S7].
- The service-role key exists only in edge-function secrets. It never ships in the app.
- Block is enforced inside the policies, so it takes effect on the next query.
- Database tests assert both allowed and denied access for every table and role [S10].

Legal frame: India's Digital Personal Data Protection Act treats anyone under 18 as a child whose data needs verifiable parental consent, which is why the launch is 18+ [S22]. The Act's substantive duties (notice, consent, erasure, breach reporting) are reported to apply from about May 2027 [S22]; the plan meets them from launch anyway because the stores already require most of them.

## 8. Health integrations and nutrition

- No health import in the MVP. Every entry still records `source` (`manual`, later `health_connect`, `healthkit`) so nothing is rewritten when imports arrive.
- First import feature: read-only steps from Health Connect on Android. Background reads need an extra permission and a scheduled worker [S18]. Play requires a health-apps declaration and a Health Connect data-type declaration with justification [S16].
- The likely library is `react-native-health-connect`, which ships an Expo config plugin and needs Android API 26+ [S19]. Its background-read support is unverified.
- Apple Health needs the native iOS app and is planned with it.
- Nutrition is deferred. When it is planned, the selection criteria are: licence terms that allow commercial use, coverage of Indian foods, and a per-request cost that works at small scale.

## 9. Workout and calorie calculations

- Strength volume = sum of weight × reps. Personal records are per exercise: heaviest weight, most reps at a weight, and best estimated one-rep max.
- Exercise calories are an estimate: MET value × body weight in kg × hours. MET values come from the 2024 Adult Compendium of Physical Activities [S23]. The formula is standard but I have not cited a primary source for it.
- The interface always labels this "estimated" and never adds it to a "total calories burned" figure, because active calories and total daily energy expenditure are different quantities.
- If the user has not entered a body weight, no calorie estimate is shown.

## 10. Friendships, sharing and messaging

- A request is unique per ordered pair while pending. If B requests A while A's request to B is pending, the function accepts instead of creating a second request.
- Removing a friend ends any shared challenge and hides shared events from each other.
- Blocking removes the friendship, cancels pending requests both ways, ends shared challenges, and makes each user unfindable by the other.
- Shared events contain no free text. A workout event shows what the owner chose (title, duration, exercise count), never the raw log.
- No chat and no comments at launch.

## 11. Partner streak rules

Departure from the vision: **agreed workout days, not every day.** A daily workout streak with no rest days rewards overtraining. A challenge has a set of weekdays; only those days count.

| Rule | Decision |
|---|---|
| Participants | Exactly two friends |
| Commitment | Each logs at least one workout of a minimum duration on each scheduled day |
| Day boundary | Local calendar day in the challenge's timezone, fixed when the challenge starts |
| Finalisation | Three hours after the day ends. Until then workouts can be added, edited or deleted and the day is re-evaluated |
| After finalisation | The day's result is permanent. Later edits do not change it |
| Missed scheduled day | Current streak returns to zero; longest streak is kept; the challenge continues |
| Streak number | Recomputed from the day ledger on every evaluation, never incremented |
| Concurrency | Evaluation locks the challenge row; the whole evaluation is one transaction |
| Scheduler | A job runs every 15 minutes and finalises every due day in order, so downtime is caught up |
| Fairness | Workouts are self-reported. The partner can see that a qualifying workout was logged and its duration. No backfilling past finalisation |

The fairness limit is real: a user can log a workout they did not do. Between two friends who chose each other this is acceptable for launch. Step streaks will not have this weakness because they will count imported steps only.

## 12. Testing and quality

| Layer | Tool | Covers |
|---|---|---|
| Database | pgTAP via `supabase test db` [S10] | Every access policy (allow and deny), friend and challenge transitions, the streak engine including timezones and concurrency |
| Client logic | Jest | Calculations, validation schemas, date helpers |
| Components | React Native Testing Library | Critical forms and states |
| End to end | Maestro on Android | Sign-up, log workout, friend request, streak day |
| Manual | S25, borrowed iPhone (web), desktop browser | Each milestone's checklist |

The streak engine and the access policies are the two places where a bug is a broken promise to users, so they get tests first and most.

## 13. Project structure

One repository: the Expo app and the `supabase/` directory (migrations, tests, edge functions). No monorepo tooling. Directories are created when a feature needs them.

## 14. Roadmap and estimates

Estimates are mine, at 10–15 hours a week, and include testing and fixes.

| Milestone | Weeks | Hours |
|---|---|---|
| M0 Learning spike and setup | 2–3 | 25–40 |
| M1 Accounts, profile, design system | 3–4 | 35–55 |
| M2 Workout logging and dashboard | 4–5 | 45–70 |
| M3 Friends, blocking, access policies | 3–4 | 35–55 |
| M4 Streak engine | 5–6 | 55–85 |
| M5 Notifications and sharing | 3–4 | 35–55 |
| M6 Hardening and release | 5–6 | 55–85 |
| **Total** | **25–32** | **285–445** |

Google requires a new personal developer account to run a closed test with at least 12 testers opted in for 14 consecutive days before it can apply for production [S13]. That fortnight sits inside M6, and tester recruitment starts in M4.

## 15. Deployment, monitoring and cost

| Item | Cost | Source |
|---|---|---|
| Google Play developer account | US$25 once | [S14] |
| Expo cloud builds | Free tier: 15 Android builds a month | [S5] |
| Supabase development project | Free | [S6] |
| Supabase production project | Paid plan needed, because free projects pause after a week of low activity | [S6]; price to confirm |
| Domain and web hosting | Small yearly cost | Not researched |
| Apple Developer Program | US$99 a year, deferred | [S21] |

Two Supabase projects (development and production) in the Mumbai region. Error reporting through Sentry. Migrations are the only way the production schema changes.

## 16. Risks, assumptions and open decisions

| Risk | Why it matters | Mitigation |
|---|---|---|
| iPhone web users get no push reminders | Reminders drive streak apps; half of a pair may be on iPhone | Time-boxed browser-push spike in M5; in-app reminders as fallback; native iOS moves up if it fails |
| Access policy mistakes | Health data exposed | Deny-by-default, tests per table, review at M3 and M6 |
| Twelve Android testers for two weeks | Hard gate before release | Recruit from M4; the web app lets iPhone friends take part but they do not count |
| Pace drops during exams | Timeline slips | Milestones are independently shippable to testers; hours given alongside weeks |
| React Native learning curve | Early milestones run long | M0 is a deliberate learning spike with throwaway code |
| Self-reported workouts | Streak trust | Stated plainly; imported-step streaks later |

## 17. Recommendation

Build a streak-first product on Expo, React Native and Supabase. Ship Android on Google Play and a web app for iPhone users from one codebase. Put streak and friendship logic in PostgreSQL functions with database tests. Launch without health imports, nutrition, comments, chat or realtime, and add them in that order of value once real pairs are using the app.
