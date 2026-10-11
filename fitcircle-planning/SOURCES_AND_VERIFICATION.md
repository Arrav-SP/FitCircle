# FitCircle — Sources and Verification

Status: planning only. Research date: 11 October 2026. Reorganised the same day for the 20-day private MVP.

## How to read this

**How the research was done.** Sources were found by web search, mostly limited to the vendor's own site. I relied on the search tool's summaries and quoted excerpts, and did not read every page in full. Re-check a price, limit or deadline at the source before relying on it.

**Nothing was tested.** No library was installed and nothing was built. Section 2 lists what the MVP depends on that has not been tried.

Source numbers are kept from earlier versions so references in older documents still resolve.

## 1. Researched facts the MVP relies on

| ID | Source | What it supports | Confidence | Limits |
|---|---|---|---|---|
| S4 | [Develop websites with Expo](https://docs.expo.dev/workflow/web/), [Static rendering](https://docs.expo.dev/router/web/static-rendering/), [EAS Hosting](https://docs.expo.dev/eas/hosting/introduction/) | An Expo project builds a website from the same code; the output deploys to EAS Hosting or any static host | High | Home-screen install details were not covered |
| S6 | [Supabase pricing](https://supabase.com/pricing), [Project pausing](https://supabase.com/docs/guides/platform/free-project-pausing) | Free projects pause after about a week of low activity; two free projects per organisation; free quotas far above ten users | High for pausing; medium for quotas | Whether scheduled jobs count as activity is unknown |
| S7 | [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), [Securing your API](https://supabase.com/docs/guides/api/securing-your-api) | Views bypass policies unless `security_invoker`; `security definer` functions can bypass policies, need `search_path = ''`, and must stay out of exposed schemas; restrict `execute` | High | — |
| S9 | [Supabase Cron quickstart](https://supabase.com/docs/guides/cron/quickstart) | Scheduled jobs can call database functions | High | Availability and reliability on the free tier not confirmed |
| S10 | [Testing overview](https://supabase.com/docs/guides/local-development/testing/overview), [Testing your database](https://supabase.com/docs/guides/database/testing) | `supabase test db` runs pgTAP tests on the local stack; tests can act as a given user; test both allowed and denied actions | High | Running tests against a hosted project was not checked |
| S11 | [Available regions](https://supabase.com/docs/guides/platform/regions) | Mumbai is a supported region; a project cannot change region in place | High | — |
| S12 | [Sign in with Google](https://supabase.com/docs/guides/auth/social-login/auth-google), [Expo social auth quickstart](https://supabase.com/docs/guides/auth/quickstarts/with-expo-react-native-social-auth) | Supabase supports Google sign-in; React Native needs an explicit session-storage setting | Medium | The web redirect flow was not read in detail; guides disagree on the storage adapter |
| S25 | [Database backups](https://supabase.com/docs/guides/platform/backups), [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp) | No automatic backups on the free plan, use `supabase db dump`; built-in email is 2 messages an hour to pre-authorised addresses | High | Limits may change |
| S26 | [EAS Hosting custom domain](https://docs.expo.dev/eas/hosting/custom-domain/), [Expo plans](https://docs.expo.dev/billing/plans/) | Custom domains are paid; free accounts cannot be charged overage | High for domains | Free request and bandwidth limits not found; other hosts not researched |

## 2. Untested assumptions the MVP depends on

None of these has been tried. Each has a day in the roadmap where it is found out.

| Assumption | Found out on | If false |
|---|---|---|
| Docker and the Supabase local stack run on the owner's Windows machine | Day 1 | Develop against a second free hosted project |
| An Expo web build of this app deploys to a free static host | Day 1–2 | Try another free host |
| Google sign-in's redirect works with Supabase on that host's subdomain | Day 1–2 | No free alternative; this must be solved |
| React Native's web output looks and feels right in Safari on an iPhone | Day 5 checkpoint | Adjust layouts; budget from the buffer |
| Scheduled jobs are available and dependable on the free tier | Day 8–10 | Finalise days when a user opens the app instead |
| A database function can delete the user's sign-in record | Day 14 | One small edge function |
| Daily use keeps the free database from pausing | Days 16–20 | Restore by hand; note it |
| The whole scope fits in 85–110 hours | Checkpoints | Apply the cut order |

## 3. Statements that are judgement, not fact

| Statement | Where |
|---|---|
| All hour and day estimates | Blueprint section 10 |
| Expo is a better choice than plain React for a web-first start | Blueprint section 5; based on keeping the native path open |
| Weekday streaks suit the group better than daily ones | Decision P4 |
| Database functions are simpler than a separate backend for streak logic | Decision P3 |
| A draft saved on the device is enough without offline support | Blueprint section 2 |

## 4. Sources for later work (not used by the MVP)

Kept from the earlier research for when the product grows. Same caveats apply.

| ID | Source | What it supports |
|---|---|---|
| S1 | [Using push notifications — Expo](https://docs.expo.dev/guides/using-push-notifications-services/) | `expo-notifications` does not support web |
| S2 | [Notifications SDK — Expo](https://docs.expo.dev/versions/latest/sdk/notifications/) | Remote push needs a development build on Android from SDK 53 |
| S3 | [Development builds — Expo](https://docs.expo.dev/develop/development-builds/introduction/) | Native libraries need a development build, not Expo Go |
| S5 | [Expo pricing](https://expo.dev/pricing) | Free plan: 15 Android and 15 iOS cloud builds a month |
| S8 | [Postgres Changes — Supabase](https://supabase.com/docs/guides/realtime/postgres-changes) | The change feed does not apply policies to delete events |
| S13 | [Testing requirements for new personal accounts — Google Play](https://support.google.com/googleplay/android-developer/answer/14151465) | 12 testers opted in for 14 consecutive days before production |
| S14 | [Get started with Play Console](https://support.google.com/googleplay/android-developer/answer/6112435) | US$25 one-time registration fee |
| S15 | [Account deletion requirements — Google Play](https://support.google.com/googleplay/android-developer/answer/13327111) | Deletion must be offered in the app and by web link |
| S16 | [Health Content and Services — Google Play](https://support.google.com/googleplay/android-developer/answer/16679511), [Publish your health app](https://developer.android.com/health-and-fitness/health-connect/publish) | Health-apps declaration; Health Connect declaration |
| S17 | [User Generated Content — Google Play](https://support.google.com/googleplay/android-developer/answer/9876937) | Reporting and blocking required for user content |
| S18 | [Read raw data — Health Connect](https://developer.android.com/health-and-fitness/health-connect/read-data), [Track steps](https://developer.android.com/health-and-fitness/health-connect/features/steps) | Background reads need an extra permission |
| S19 | [react-native-health-connect wiki](https://github.com/matinzd/react-native-health-connect/wiki) | Expo config plugin; Android API 26+; background support unverified |
| S20 | [Web Push for Web Apps on iOS — WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/) | iPhone web push only for home-screen web apps |
| S21 | [Apple Developer Program](https://developer.apple.com/programs/whats-included/), [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) | US$99 a year; login and deletion rules |
| S22 | [PIB: DPDP Rules notified](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2190014), [MediaNama on children's data](https://www.medianama.com/2025/01/223-data-protection-rules-2025-children-data-india/) | Under-18s need verifiable parental consent; phased commencement. Exact dates and periods came from secondary commentary. Not legal advice |
| S23 | [2024 Adult Compendium of Physical Activities](https://pubmed.ncbi.nlm.nih.gov/38242596/) | Reference MET values for calorie estimates |
| S24 | [onlineManager — TanStack Query](https://tanstack.com/query/v5/docs/reference/onlineManager), [Mutations guide](https://tanstack.com/query/v4/docs/react/guides/mutations) | Paused and persisted saves for offline use |
| S27 | [Push API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API), [Push notifications FAQ — web.dev](https://web.dev/articles/push-notifications-faq) | Browser push works on Android without installing the site |
