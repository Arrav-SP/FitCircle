# FitCircle — Blueprint for the 20-Day Private MVP

Status: planning only. Nothing in this document has been built, run or tested.
Revised 11 October 2026 after the owner reset the scope. This replaces the earlier blueprint for a public product; what was removed is listed in section 12 so it can come back later.
Source references such as [S7] point to `SOURCES_AND_VERIFICATION.md`.

## 1. Goal

A polished, working fitness app that the owner, their girlfriend and a few close friends use together, within 15–20 calendar days, at zero running cost.

This is a private beta for fewer than ten people who know each other. It is not a public launch. If the group likes it, it grows into the larger product later.

**Time assumption.** The plan needs about 85–110 hours, which is 4–5 hours a day for 20 days. The owner has not confirmed this. If less time is available, apply the cut order in section 10 from the top; do not extend the deadline silently.

## 2. Scope

### In

| Area | What the group can do |
|---|---|
| Accounts | Sign in with Google; set a username, display name, units and weekly goals |
| Workouts | Log exercises with sets, reps and weights, plus duration and notes; edit and delete |
| History and progress | See past workouts, workouts per week, and best lift per exercise |
| Trained muscles | A front and back body figure with the muscles worked on a chosen day or week highlighted, with a week strip to pick the day. Added 12 October 2026 as step 2.4; uses the open-source `react-native-body-highlighter` drawing |
| Friends | Connect through a single-use invite link; see a friend's workouts; remove a friend |
| Partner streaks | Agree workout weekdays with one friend and keep a shared streak |
| Feed | See friends' workouts (all except the ones they hid) and streak milestones |
| Water | Add glasses through the day against a goal |
| Body weight | Log your body weight and see the trend; private to you |
| Dashboard | Today, this week, and active streaks at a glance |
| Look and feel | Light and dark themes; designed loading, empty, error and success states |
| Privacy | Friends see your workouts unless you hide one; notes, goals, settings and body weight are never shown; strangers see nothing; edit or delete any entry; delete the account |

### Stretch (only if the day-15 checkpoint is met)

Manual steps and sleep logging. Emoji reactions on feed items.

### Out for this phase

Push notifications, offline use, user search, blocking, reporting, rate limits, age gate, consent records, data export, calorie estimates, nutrition, comments, chat, health-platform imports, the Android build and any store release.

### Kept on purpose, even at this size

- Access rules on every table, with tests proving both allowed and denied access.
- A streak day ledger with database tests, so the streak number is always right.
- Friendships and streaks changed only by database functions, never written directly by the app.
- Workouts are visible to friends, because training together is the point of the app; any workout can be hidden. Notes, settings and body weight are never visible to anyone else. People who are not friends see nothing. (Owner's decision, 12 October 2026; replaces "private unless shared".)

## 3. Requirements

| ID | Requirement | Done when |
|---|---|---|
| AUTH-1 | Sign in with Google | Works on the hosted link from an Android phone, an iPhone and a desktop browser |
| AUTH-2 | Sign out | The session ends on that device |
| AUTH-3 | Automatic sign-out after 15 days without using the app on a device | Opening the app after more than 15 idle days shows the sign-in screen. Tracked per device in the browser, not on the server |
| PROF-1 | Unique username (3–20 letters, digits, underscore) and display name | A duplicate username is rejected, ignoring case |
| PROF-2 | Units (kg or lb) and weekly workout goal, daily water goal | Stored privately; never visible to friends |
| WORK-1 | Log a workout: start time, duration, notes, exercises, sets with reps and weight | Saved workout appears in history |
| WORK-2 | Pick exercises from a seeded list or add your own | A custom exercise is visible only to its creator |
| WORK-3 | Last-used sets for an exercise are prefilled | Logging a repeat workout needs no retyping |
| WORK-4 | Edit and delete own workouts | A change inside an open streak day re-evaluates that day |
| WORK-5 | An unsaved workout survives a failed save or a page reload | The draft is restored from the device and can be saved again |
| PROG-1 | History list and workout detail | Newest first |
| PROG-2 | Workouts per week for the last eight weeks; heaviest weight per exercise | Matches the logged data |
| FRND-1 | Create an invite link | Single use; expires after 7 days |
| FRND-2 | Open an invite link to become friends | Works after signing in; own, used or expired links are refused with a clear message |
| FRND-3 | Remove a friend | Shared streak ends; shared items disappear for each other |
| STRK-1 | Propose a streak to a friend: weekdays and minimum workout minutes | At least one weekday; 5–180 minutes, default 20 |
| STRK-2 | Accept, decline or cancel a proposal | Only the invited friend accepts or declines; only the proposer cancels |
| STRK-3 | One live streak per pair | Enforced in the database |
| STRK-4 | A scheduled day counts when both logged a qualifying workout | Rules in section 8 |
| STRK-5 | See current streak, longest streak, today's status for both, and day history | Matches the ledger exactly |
| STRK-6 | Either partner can end the streak | History stays visible to both |
| PAIR-1 | Do it with me: copy a friend's visible workout into your own new workout | The editor opens prefilled; nothing is saved until Save; the friend's own custom exercises are left out and counted |
| FEED-1 | Friends see each workout unless it is hidden; choose per workout | Default is "My friends"; "Only me" hides it. Notes are never included |
| FEED-2 | Streak milestones (7, 14, 30, 50, 100) appear in the feed for the pair and their friends | A friend sees it unless the partner they know has hidden their activity. Undoing the day that reached it removes it |
| FEED-3 | Feed of friends' shared items | Shows nothing the viewer is not permitted to see |
| FEED-4 | Hide a workout later | It disappears for friends on their next refresh |
| WATR-1 | Add or undo a glass of water; daily total against the goal | One tap |
| WGHT-1 | Log body weight for a day, in the user's units; see recent entries | Owner-only; never shown to friends or in the feed |
| DASH-1 | Home shows today's workout status, week progress, the best active streak and pinned friends with their latest workout; water and body weight are on the Health tab | Updates after each log without a manual refresh |
| PRIV-1 | Delete account | All of the user's rows are removed and their streaks end |
| UI-1 | Light, dark and system themes | Both themes pass a contrast check |
| UI-2 | Every screen has loading, empty and error states | No blank screens or raw error text |

## 4. Design system

The interface must look finished. A small scope is not a reason for a rough one.

### Navigation

Five tabs (changed 15 October 2026 to keep Home uncluttered): **Home** (today, week strip, this week, best streak, one action, pinned friends), **Log** (new workout, workout-day calendar, trained muscles, history), **Health** (water, body weight; steps and sleep later; private), **Streaks**, **Profile** (friends, invites, activity feed, settings, appearance). A friend is pinned to Home from their page; pins are remembered per device.

### Principles

1. Logging takes seconds: prefill, large targets, numeric keypad.
2. One primary action per screen.
3. The streak carries the strongest visual weight.
4. Who can see a workout is always shown and can be changed on the workout itself.

### Tokens

| Group | Tokens |
|---|---|
| Colour roles (light and dark value each) | `bg`, `surface`, `surfaceSunken`, `text`, `textMuted`, `textOnAccent`, `accent`, `accentMuted`, `highlight`, `highlightSoft`, `bodyFill`, `partner`, `textOnPartner`, `success`, `warning`, `danger`, `border`, `borderStrong` |
| Type | Headings and numbers in Bricolage Grotesque (bold, extra bold); body text in the device font. Sizes 12, 14, 16 (body), 20, 24, 32, 48 (streak number) |
| Spacing | 4, 8, 12, 16, 24, 32, 48 |
| Radius | 12 (inputs), 24 (cards), full (buttons, pills, avatars) |
| Motion | 150 ms press, 250 ms transition; one celebration when a streak day completes; off when "reduce motion" is set |

The colours, as built (`src/theme/tokens.ts` is the source of truth):

| Role | Light | Dark | Used for |
|---|---|---|---|
| `bg` | `#F3F5F9` | `#000000` (true black) | Page |
| `surface` / `surfaceSunken` | `#FFFFFF` / `#E9EDF4` | `#131316` / `#1E1E23` | Cards / wells and skeletons |
| `text` / `textMuted` | `#0E1526` / `#55607A` | `#F5F5F7` / `#9A9CA6` | Text |
| `accent` / `textOnAccent` | `#14235A` (dark navy) / `#FFFFFF` | `#8FB0FF` (navy is unreadable on black, so a lighter blue of the same hue) / `#00081C` | You: primary buttons, selected day, your ring |
| `accentMuted` | `#DDE4F6` | `#16203A` | Tinted backgrounds |
| `partner` / `textOnPartner` | `#B97700` (marigold) / `#0E1526` | `#F5B83D` / `#000000` | Your streak partner and friends |
| `highlight` / `highlightSoft` / `bodyFill` | `#2448D8` / `#8FA6F2` / `#E6EAF2` | `#8FB0FF` / `#44598F` / `#2A2A30` | Body figure: heavily trained / lightly trained / untrained |
| `success` / `warning` / `danger` | `#1E7A46` / `#8A5A00` / `#C0292B` | `#5BD08A` / `#F0B455` / `#FF8A85` | Status |
| `border` / `borderStrong` | `#D8DEEA` / `#7C869C` | `#2A2A30` / `#70737F` | Dividers / control outlines |

**Personal colour** (added 14 October 2026): on Profile a person picks one of 19 accent colours, stored on the device. Navy is the default and is the table above. Any other choice replaces `accent`, `textOnAccent`, `accentMuted`, `highlight` and `highlightSoft` with shades derived from its hue: deep on the light theme, pastel on the dark theme. Yellow, orange, coral and brown also switch the partner colour to teal so the two rings stay distinct. On the light theme the page (`bg`), `surfaceSunken`, `border` and `bodyFill` also take a pale tint of the chosen hue, with cards left white; the dark theme stays true black. `src/theme/accents.test.ts` checks every colour in both themes for contrast.

Components read tokens only; no colour or spacing is typed directly into a screen. Every text and background pair was checked for WCAG AA contrast.

### Components

Button, TextField, NumberStepper, Card, ListRow, Avatar (initials), Chip, WeekdayPicker, ProgressRing, StreakCard, EmptyState, ErrorState, Skeleton, Toast, ConfirmDialog.

### Accessibility and layout

Contrast at WCAG AA. Touch targets at least 48 px. Labels on every control. State never shown by colour alone. Designed for phone widths first; on desktop the content sits in a centred column.

### States

| State | Behaviour |
|---|---|
| Loading | Skeleton of the final layout |
| Empty | One sentence and one action |
| Error | Plain words and a retry button |
| Success | A brief toast; a celebration only for a completed streak day |
| No connection | A banner; the app says it needs a connection |

## 5. Architecture

### Stack, and why each part is needed now

| Part | Why now |
|---|---|
| Expo, React Native, TypeScript, Expo Router | One codebase that runs as a website today [S4] and can become an Android and iOS app later without a rewrite |
| Supabase: PostgreSQL, Auth, Row Level Security | Sign-in, database and privacy rules without running a server; free tier [S6]; uses the owner's SQL skill |
| PostgreSQL functions for friends and streaks | Transactions and row locks are built in; no separate backend service |
| Supabase Cron | Closes streak days on schedule [S9] |
| TanStack Query | Caching, refetch on focus and mutation states, instead of hand-written loading logic on every screen |
| pgTAP tests through the Supabase CLI | The only way to prove the access rules and streak rules [S10] |
| Jest | A handful of unit tests for date and progress helpers |

### Deliberately not used yet

| Left out | Reason | Comes back when |
|---|---|---|
| Edge functions | Nothing needs one | Push notifications |
| Realtime subscriptions | Refetch on focus is enough for ten people | Chat |
| Form library, schema validation library | Few forms; the database constraints validate | Forms become painful |
| Global state library | React state is enough | Never, ideally |
| Service worker, offline queue | A draft on the device covers the common failure | Public release |
| Error-reporting service | Users can message the owner | Public release |
| End-to-end test tool | A manual checklist per step is faster at this size | Public release |

### Shape

```
  Browser on any phone or computer
              │ HTTPS, user's sign-in token
     ┌────────▼─────────┐
     │ Supabase API      │
     └────────┬─────────┘
              │ row level security
     ┌────────▼──────────────────────────────┐
     │ PostgreSQL                             │
     │  public:  tables and policies          │
     │  api:     functions the app may call   │
     │  private: security-definer internals   │
     │  cron:    close streak days            │
     └────────────────────────────────────────┘
```

### Boundaries

| The app may | The app may not |
|---|---|
| Read rows the policies allow | Rely on its own filtering for privacy |
| Write its own workouts, metrics, profile and settings | Write invites, friendships, streaks, streak days or shared items directly |
| Call `api` functions | Call `private` functions |
| Hold the public key | Hold the service-role key, which is not used anywhere in this phase |

### Environments

| Environment | Backend | App |
|---|---|---|
| Development | Supabase local stack (needs Docker on Windows; see open question Q1) | Local dev server in a desktop browser and on the phone over Wi-Fi |
| Production | One free Supabase project in Mumbai [S11] | Static web build on a free host's subdomain |

Schema changes reach production only through migration files.

### Free-tier risks accepted

| Fact | Handling |
|---|---|
| No automatic backups [S25] | Manual `supabase db dump` weekly and before each migration |
| Project pauses after about a week of low activity [S6] | Daily use by the group prevents it; restore by hand if it happens |

## 6. Database (13 tables)

| Table | Purpose | Key fields |
|---|---|---|
| `profiles` | What friends may see | `id` (= auth user), `username`, `display_name` |
| `user_private` | Owner-only settings | `user_id`, `units`, `timezone`, `weekly_workout_goal`, `water_goal`, `share_workouts_default`, `share_milestones`, `hide_workouts` (hide every workout from every friend) |
| `invites` | Invite links | `id`, `token` (random, unique), `inviter_id`, `expires_at`, `used_by`, `used_at` |
| `friendships` | One row per pair | `user_low`, `user_high`, `created_at` |
| `workout_hides` | Friends an owner has hidden their workouts from (added 12 October 2026) | `owner_id`, `friend_id` |
| `exercises` | Catalogue | `id`, `name`, `muscle_group`, `owner_id` (null for seeded) |
| `workouts` | A session | `id`, `user_id`, `title`, `started_at`, `duration_minutes`, `notes`, `hidden`, `source`, `created_at`, `updated_at` |
| `workout_exercises` | Exercise in a session | `id`, `workout_id`, `exercise_id`, `position` |
| `workout_sets` | A set | `id`, `workout_exercise_id`, `position`, `reps`, `weight_kg` |
| `metric_entries` | Water and body weight now; steps and sleep later | `id`, `user_id`, `type`, `local_date`, `value`, `source` |
| `streak_challenges` | Configuration and state | `id`, `user_a`, `user_b`, `proposer_id`, `status`, `timezone`, `weekdays`, `min_minutes`, `start_date`, `current_streak`, `longest_streak`, `last_finalised_date` |
| `streak_days` | Day ledger | `challenge_id`, `local_date`, `a_done`, `b_done`, `status` (open, complete, missed), `finalised_at` |
| `streak_milestones` | Milestones a streak's best run has reached. Replaces the planned `shared_events`: since friends see workouts by default, the feed reads workouts live and only milestones need a record | `challenge_id`, `milestone`, `reached_at` |

`event_reactions` is added only if the stretch item is built.

### Rules

- UUID keys, generated on the device for workouts so a retried save cannot duplicate.
- Weights stored in kilograms; the app converts for display.
- `source` is `manual` on every row now. It exists so health imports can be added later without changing the tables.
- Instants are `timestamptz`. A calendar day is always derived with an explicit timezone name.
- Deleting a profile cascades to everything the user owns.

### Constraints

| Constraint | Purpose |
|---|---|
| `profiles.username` unique on its lower-case form | No look-alike duplicates |
| `friendships` primary key (`user_low`, `user_high`), check `user_low < user_high` | One row per pair |
| `invites.token` unique; check not used by the inviter | Single use, no self-invite |
| `streak_challenges` unique (`user_a`, `user_b`) where status is pending or active | One live streak per pair |
| `streak_days` primary key (`challenge_id`, `local_date`) | Re-running evaluation cannot duplicate a day |
| `workout_sets`: reps ≥ 0, weight ≥ 0; `workouts.duration_minutes` between 1 and 600 | Sane data |
| Indexes: `workouts (user_id, started_at desc)`, `shared_events (actor_id, created_at desc)`, `metric_entries (user_id, local_date)` | The three common queries |

### Transactions

| Operation | One transaction containing |
|---|---|
| Accept invite | Check token, insert friendship, mark invite used |
| Remove friend | Delete friendship, end their streak |
| Accept streak proposal | Check, set active, fix timezone and start date |
| Evaluate or finalise a streak | Lock the challenge row, update days, recompute the streak, add a milestone event if reached |
| Delete account | End streaks, delete the profile (cascade) and the sign-in record |

## 7. Security and privacy

### Rules for functions and views [S7]

- A `security definer` function the app calls lives in `api`, takes no user id, and acts only for `auth.uid()`. Any other `security definer` function lives in `private`, which the API does not expose. (Changed in step 3: signed-in users have no access to `private`, so a function they call cannot live there.)
- Each sets `search_path = ''` and uses schema-qualified names.
- `execute` is revoked from `public` and granted only to signed-in users where needed.
- Any view is created with `security_invoker = true`.

### Access rules

"Friend" means a current row in `friendships`.

| Table | Read | Write |
|---|---|---|
| `profiles` | Owner and friends. An invite recipient sees the inviter's name through the invite function only | Owner updates own row |
| `user_private` | Owner | Owner |
| `invites` | Inviter | Function only |
| `friendships` | Either member | Function only |
| `workout_hides` | Owner only, so a friend cannot tell they were chosen | Owner adds or removes current friends; cleared for a pair when the friendship ends |
| `exercises` | Seeded rows: any signed-in user; custom rows: owner | Owner on own rows |
| `workouts`, `workout_exercises`, `workout_sets` | Owner. A friend reads non-hidden workouts only through `api.friend_workouts`, which checks the friendship, the owner's hide-all setting and the owner's per-friend hide list, and leaves out notes; friends have no access to the tables | Owner |
| `metric_entries` | Owner | Owner |
| `streak_challenges`, `streak_days` | Either participant | Function only |
| `streak_milestones` | No direct access. Read through `api.feed`, which shows friends' non-hidden workouts and the milestones of the caller and of friends who have not hidden their activity; a partner the caller is not connected to is left unnamed | Function only |

A streak partner never reads the other's workouts. They see only the done flags on `streak_days`.

The feed is built by the database from fixed fields (title, duration, exercise names, milestone number). Workout notes are never included.

### Secrets

The app holds only the public Supabase URL and key. The service-role key is not used in this phase. `.env` files stay out of version control; `.env.example` lists names only.

### Account deletion

`api.delete_account()` deletes the caller's sign-in record; foreign keys remove everything they own, and a trigger ends their streaks first so partners keep the history. Proven on the local stack by `delete_account.test.sql` and an end-to-end run with a real sign-up. Still to confirm once on hosted Supabase (open question Q3); the fallback is one small edge function.

### Security tests (pgTAP)

Each is tested as allowed for the right user and denied for the wrong one. A denied write also checks the target row is unchanged.

| # | Scenario | Expected |
|---|---|---|
| 1 | A non-friend reads someone's workouts, metrics, private settings or profile | No rows |
| 2 | A friend reads metrics, private settings, workout notes, a hidden workout, or the workout tables directly | No rows |
| 2a | A friend reads a non-hidden workout through `api.friend_workouts`; a stranger or former friend calls it | Allowed for the friend; empty for the others |
| 3 | A streak partner reads the partner's workouts | No rows |
| 4 | A friend reads a shared item | Allowed |
| 5 | A non-friend or former friend reads a shared item | No rows |
| 6 | A user inserts a friendship row directly | Denied |
| 7 | An invite is used twice, by its creator, or after expiry | Rejected |
| 8 | A user reads someone else's invites | No rows |
| 9 | A non-participant reads a streak or its days | No rows |
| 10 | A participant updates `current_streak` or a day directly | Denied |
| 11 | A user inserts a workout for another user | Denied |
| 12 | A signed-out visitor reads any table | No rows |
| 13 | A signed-in user calls a `private` function | Denied |
| 14 | Every table in `public` has row level security enabled | True |

## 8. Streak rules

### Configuration

Two friends. One to seven agreed weekdays. A minimum workout length (default 20 minutes). The timezone is the proposer's at acceptance and never changes. The streak starts on the day the friend accepts or the day after, as the proposer chose; a same-day start counts workouts already logged that day. Configuration is fixed; to change it, end the streak and start another.

### States

```
  propose ──▶ PENDING ──accept──▶ ACTIVE ──▶ ENDED (either ends it, unfriend, account deleted)
                 ├── decline ──▶ DECLINED
                 └── cancel  ──▶ CANCELLED
```

A day is OPEN, then at finalisation becomes COMPLETE (both done) or MISSED. A missed day sets the current streak to 0; the streak stays ACTIVE and the longest streak is kept.

### What counts

A partner has done day D when one of their workouts starts on D in the streak's timezone, lasts at least the minimum, does not start in the future, and exists when the day is evaluated.

### Deadline

Day D is finalised at 03:00 the next morning in the streak's timezone. Until then, adding, editing or deleting a workout re-evaluates the day. After that the day never changes.

### Computing the number

The streak is always derived from the ledger: count consecutive scheduled days backwards from the most recent one that is COMPLETE, or OPEN with both done, and stop at the first MISSED day. An OPEN day not yet done by both is skipped, not counted as a break. Running the calculation twice gives the same answer.

### Safety

Every evaluation locks the streak's row first and runs in one transaction. A scheduled job every 15 minutes finalises every due day in date order, so a missed run is caught up by the next. The app also closes the signed-in user's own due days each time it loads streaks (`api.sync_streaks`), so the numbers are right even if the job is late or unavailable. When a participant deletes their account the streak ends and their id on it is cleared, so the other partner keeps the history.

### Limit worth stating

Workouts are self-reported. Among close friends that is acceptable.

### Streak tests (pgTAP, fixed clocks)

1. Both done on a scheduled day → COMPLETE, streak +1.
2. One done → MISSED at finalisation, streak 0, longest kept.
3. Unscheduled days between scheduled days are ignored.
4. A workout at 23:50 logged at 00:30 counts for the earlier day.
5. A workout logged after 03:00 does not change the finalised day.
6. A workout under the minimum does not qualify; two short ones do not add up.
7. Deleting the qualifying workout before finalisation undoes the day.
8. Shortening it below the minimum before finalisation undoes the day.
9. A future-dated workout is rejected.
10. Evaluation run twice gives identical state.
11. Finalisation run twice gives identical state.
12. A job that missed three days finalises all three in order.
13. Day boundaries follow the streak's timezone, not the server's.
14. Streak of 6, then MISSED, then 2 COMPLETE → current 2, longest 6.
15. Two partners saving at the same moment produce one COMPLETE day.
16. Removing the friend or deleting an account ends the streak and keeps the other's history.
17. A second live streak for the same pair is rejected.

## 9. Project structure

```
fitcircle/
├── app/                 routes: (auth)/ and (tabs)/home, log, streaks, profile; invite/[token]
├── src/
│   ├── components/      shared UI
│   ├── features/        auth, workouts, friends, streaks, feed, metrics
│   ├── lib/             supabase client, query client, dates
│   └── theme/           tokens and provider
├── supabase/
│   ├── migrations/
│   ├── tests/           pgTAP
│   └── seed.sql         exercise list, test users
├── docs/fitcircle-planning/
├── CLAUDE.md
├── README.md
└── .env.example
```

A directory is created when the first real file goes into it.

## 10. Roadmap

Twenty calendar days at 4–5 hours a day. Each step ends with its check passing and a deploy to the hosted link.

| Step | Days | Build | Depends on | Done when | Check | Hours | Cut if behind |
|---|---|---|---|---|---|---|---|
| 1 | 1–2 | Expo project; local and hosted Supabase; Google sign-in; first deploy to the free host | — | The owner signs in on their phone at the public link | Manual on phone and desktop; one passing database test | 8–10 | Nothing |
| 2 | 3–5 | Profile and onboarding; tokens and core components; workout logging; history | 1 | A real workout is logged on the phone and appears in history | Access tests for profile and workout tables; manual logging run | 14–18 | Custom exercises |
| 3 | 6–7 | Invite links; friendships; remove friend | 2 | Two accounts connect by link | Security tests 1, 2, 6, 7, 8, 12, 13, 14 | 8–10 | Nothing |
| 4 | 8–10 | Streak tables, functions and tests first; then proposal and streak screens; scheduled job | 2, 3 | Two accounts complete a streak day end to end | All 17 streak tests; security tests 3, 9, 10 | 14–18 | Day-history calendar; minimum minutes (use "any workout") |
| 5 | 11–12 | Share toggle; feed; milestones; dashboard | 2, 3, 4 | A shared workout shows for the friend and an unshared one does not | Security tests 4, 5; manual two-account run | 9–12 | Week view on the dashboard; milestones |
| 6 | 13 | Water; body weight; then steps and sleep | 2 | Water total shows on the dashboard; a body weight entry can be logged and seen | Access test for metrics; manual | 5–6 | Steps and sleep |
| 7 | 14–15 | Theme polish; every screen state; phone layouts; progress view; privacy settings; delete account | 1–6 | Feature complete; girlfriend and one friend invited | Contrast check; manual walkthrough in both themes; deletion test | 9–12 | Progress charts (keep the list) |
| 8 | 16–18 | Use by the real group; bug fixes; read every access rule line by line; backup routine | 7 | No known bug that loses or leaks data | Full security and streak test run; first database dump restored locally | 12–15 | Nothing |
| 9 | 19–20 | Buffer; then reactions and other stretch items | 8 | The group is using it daily | — | 7–10 | All stretch items |

**Total: 85–110 hours.**

### Checkpoints

| Day | Must be true | If not |
|---|---|---|
| 5 | Sign-in, workout logging and history work on a phone at the public link | Drop custom exercises, steps, sleep and reactions now |
| 10 | Two accounts, connected by invite, complete a streak day | Reduce the feed to a plain list with no milestones; drop the dashboard week view |
| 15 | Feature complete and two real users invited | Stop adding features; days 16–20 are fixes only |
| 20 | The group is using it | Whatever is unfinished moves to section 12 |

### Cut order

1. Steps and sleep.
2. Reactions.
3. Progress charts.
4. Dashboard week view.
5. Streak milestones in the feed.
6. Custom exercises.
7. The feed itself (the streak still works without it).

Never cut: sign-in, workout logging, invites, the streak engine, the access-rule tests, the streak tests.

## 11. Risks and fallbacks

| Risk | Fallback |
|---|---|
| Learning Expo while building slows days 1–5 | Apply the day-5 cuts immediately; keep screens plain until the loop works |
| Google sign-in setup fails or takes a day | No free alternative fits, so it is done on day 1 where a slip is visible early |
| Docker or the local Supabase stack will not run on the owner's Windows machine | Use a second free hosted project for development and tests (Q1) |
| The streak engine takes more than three days | Ship with "any workout on a scheduled day" and no minimum minutes |
| No reminders | The group reminds each other; push is first on the list afterwards |
| The web layout feels wrong on an iPhone | Test on a borrowed iPhone at each checkpoint |
| Free tier has no backups | Weekly dump, and one before each migration |
| Less than 4 hours a day is available | Apply the cut order from the top and tell the group what is missing |

## 12. After the private beta

Not built now. Listed so nothing is lost. Detail for most of these is in `INDEPENDENT_PLAN.md` and the history section of `PLAN_COMPARISON.md`.

| Later item | Note |
|---|---|
| Push reminders | Browser push first; Expo's library does not support web [S1] |
| Offline logging | Queued and persisted saves [S24] |
| Android app on Google Play | US$25 once; 12 testers for 14 days [S13][S14] |
| Blocking, reporting, rate limits | Needed before strangers can join [S17] |
| Age gate, consent, privacy policy, data export | Needed before a public launch [S22] |
| Email sign-in | Needs an email provider [S25] |
| Health Connect and Apple Health imports; step streaks | `source` column is already in place |
| Native iOS app | US$99 a year [S21] |
| Comments, chat, nutrition, calorie estimates | In that order of likely value |
| Paid database plan | When there is data the owner would not accept losing |
