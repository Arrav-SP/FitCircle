# FITCIRCLE — INDEPENDENT PLANNING, CRITICAL COMPARISON & FINAL PRODUCT BLUEPRINT

## YOUR ROLE

Act as a principal mobile architect, senior product strategist, UI/UX designer, backend engineer, database architect, security engineer, health-integration specialist, and technical project manager.

Your task is to develop the best practical plan for building FitCircle, a premium social fitness mobile application for iOS and Android.

You will receive:

1. My complete product vision.
2. Instructions to develop your own independent product and technical plan.
3. A second, independently generated blueprint included later in this prompt.
4. Requirements for critically comparing both plans and producing a consolidated final specification.

You must think independently, research important technical questions, challenge assumptions, identify missing requirements, and resolve disagreements based on evidence and engineering judgment.

**THIS IS A PLANNING TASK. DO NOT IMPLEMENT THE APPLICATION.**

Do not initialize an application, install packages, write application source code, execute migrations, modify GitHub, change Git remotes, commit or push anything, or overwrite existing project files.

Your deliverables are planning documents saved in the current project directory.

---

# PART 1 — PROJECT VISION

## 1.1 The product

The working name is FitCircle. The name and branding can change later.

FitCircle is a social fitness and wellness platform where users can track their own activity, share selected progress with friends, encourage each other, chat, and maintain shared fitness streaks.

The core differentiator is the combination of personal tracking, social accountability, and collaborative habit formation.

The experience should combine the usability of a premium fitness tracker with the social interaction and gamification of a modern consumer social application.

It should feel polished, intentional, engaging, accessible, and reliable—not like a generic admin dashboard or a collection of forms.

## 1.2 Platforms

- iOS and Android from the beginning.
- Adaptive light, dark, and system themes.
- Native-feeling mobile navigation and interactions.
- Support for automatic health-data imports where supported and authorized.
- Manual tracking must remain available regardless of health-provider availability.

## 1.3 Personal tracking

Users should be able to track:

### Workouts
- Strength training.
- Cardio.
- Exercises, sets, repetitions, weights, duration, distance and notes.
- Workout history.
- Personal records.
- Estimated exercise calories.

### Nutrition
- Food entries and meals.
- Serving quantities and units.
- Calories.
- Protein, carbohydrates and fats where available.
- Saved meals and custom foods.
- Nutrition-source attribution.

### Other metrics
- Steps.
- Water intake.
- Sleep duration and sleep sessions.
- Calories consumed.
- Estimated active calories burned.
- Daily goals and weekly progress.

Support manual logging and automatic imports where technically possible.

Never represent estimates as exact measurements or conflate active calories with total daily energy expenditure.

## 1.4 Social features

Users should be able to:

- Create profiles and unique usernames.
- Search for friends.
- Send, accept, decline and cancel friend requests.
- Remove friends and block or report users.
- Share workouts, meals and selected activity.
- Control who sees each post and sensitive metric.
- React to posts.
- Comment on activity.
- Chat privately with friends.
- Receive relevant notifications.
- Participate in collaborative challenges.

Being friends must not automatically grant access to all personal health information.

## 1.5 Duolingo-inspired partner streaks

Two friends should be able to create a shared challenge and maintain a streak when both complete an agreed daily commitment.

Potential qualifying activities include workouts, steps and other measurable goals.

The system must account for:
- Invitations and acceptance.
- Challenge configuration.
- Participant-specific goals.
- Daily deadlines.
- Timezones.
- Missed days and resets.
- Historical edits.
- Duplicate events.
- Concurrent updates.
- Imported data delays.
- Denied health permissions.
- Fairness and abuse prevention.

The streak engine must be deterministic, testable and enforced by trusted backend logic—not implemented as a simple frontend counter.

## 1.6 Product quality

Prioritize:
- Fast daily logging.
- Beautiful and useful dashboards.
- Clear information hierarchy.
- Consistent design tokens.
- Smooth but restrained animations.
- Accessible typography and contrast.
- Functional empty, loading, offline and error states.
- Privacy by default.
- Reliable data synchronization.
- Maintainability and straightforward onboarding for future developers.

---

# PART 2 — YOUR INDEPENDENT PLAN

Before reading and evaluating the second blueprint below, develop your own independent assessment of the product.

Do not merely repeat the supplied product vision. Think through the engineering implications and identify missing requirements.

Research relevant current official documentation when useful, especially for:
- Mobile frameworks.
- iOS HealthKit.
- Android Health Connect.
- Expo native-development requirements.
- Database authorization.
- Backend and realtime capabilities.
- Push notifications.
- App-store health-data policies.

Prefer primary documentation and cite important claims. Verify compatibility and limitations instead of assuming that a popular package supports every required feature.

Do not invent sources, APIs, package capabilities, prices or test results.

Create an independent plan covering:

1. Product strategy and MVP definition.
2. User personas and user journeys.
3. Information architecture and screen flows.
4. Visual design system and interaction requirements.
5. Architecture and technology choices.
6. Database schema and domain model.
7. Security, privacy and access-control policies.
8. Health integrations and nutrition data.
9. Workout and calorie calculations.
10. Friendships, feed and messaging.
11. Partner streak state machine and calculation rules.
12. Testing and quality assurance.
13. Project structure.
14. Milestone roadmap and realistic estimates.
15. Deployment, monitoring, operational costs and release readiness.
16. Major risks, assumptions and unresolved decisions.

Evaluate alternatives where they materially affect the result.

For every major technology decision, explain:
- What you recommend.
- Why it fits this project.
- The most relevant alternatives.
- The practical tradeoffs.
- Whether the decision must be made now or can remain flexible.

Do not assume any particular technology stack is mandatory. You may recommend Expo/React Native, native development, a managed backend, a custom backend or other suitable alternatives.

Make an explicit recommendation at the end of your independent assessment.

---

# PART 3 — SECOND INDEPENDENT BLUEPRINT

The following is the complete second blueprint. It was independently generated and is provided as an alternative proposal.

You must evaluate it critically. Do not treat it as ground truth, and do not accept its technical decisions automatically.

## 3.1 Product definition

The product is a mobile-first fitness social network called FitCircle, designed around personal tracking, social accountability and collaborative habit formation.

The core principles are:

- Social by choice.
- Fast logging.
- Transparent estimates.
- Consistency over perfection.
- Mobile-first quality.
- Privacy before virality.

The product should make daily tracking effortless and make sharing progress rewarding.

## 3.2 Proposed feature priorities

### P0: Core MVP
- Authentication, profiles and onboarding.
- Daily dashboard and personal goals.
- Manual workout, meal, water and sleep logging.
- Manual steps.
- Friend search, requests, acceptance and removal.
- Activity feed, sharing controls, reactions and comments.
- Partner streak invitations and daily progress.
- Basic privacy settings and account deletion.

### P1: Social and health integrations
- One-to-one realtime chat.
- Push notifications and unread counts.
- HealthKit and Health Connect integration.
- Automatic steps and sleep synchronization.
- Food search and nutrition database.
- Weekly reports, personal records and progress charts.

### P2: Advanced features
- Group challenges and leaderboards.
- Workout templates.
- Streak freezes or rescue tokens.
- Meal photos and richer food recognition.
- Wearable integrations.
- Optional AI coaching.

Evaluate whether this sequencing is correct, whether chat should be P0 or P1, and whether any features are missing or incorrectly prioritized.

## 3.3 Screen architecture

Suggested primary navigation:

- Home: dashboard, daily goals, quick actions and streak preview.
- Track: workout, nutrition, water, sleep and steps.
- Friends: requests, activity feed, reactions, comments and challenges.
- Streaks: partner challenges, daily completion and milestones.
- Profile and settings: personal statistics, privacy, health connections and preferences.

Important flows include:

### Onboarding
Welcome → sign-up/login → profile → goals and units → privacy preferences → dashboard → optional health connection → find friends.

### Workout
Select workout → add exercises → record sets/reps/weights or cardio data → review → save → update dashboard → optionally share.

### Social
Search username → view permitted profile → send request → accept → become friends → share activity, react, comment, chat and invite to streak.

### Partner streak
Choose friend → define goal → send invitation → accept → track individual completion → evaluate shared daily completion → increment or reset streak.

Evaluate edge cases such as duplicate requests, reciprocal requests, blocking, removal, pending invitations, and changed post visibility.

## 3.4 Proposed technology stack

The second plan proposes:

- React Native.
- Expo.
- TypeScript.
- Expo Router.
- TanStack Query.
- React Hook Form and Zod.
- Supabase Authentication.
- PostgreSQL.
- Supabase Realtime.
- Database Row Level Security.
- Expo Notifications.
- HealthKit on iOS.
- Health Connect on Android.
- A centralized theme-token system.
- Automated unit, integration and end-to-end testing.

It recommends feature-first architecture and treating PostgreSQL as the source of truth for persisted logs, friendship state and shared streak state.

It also recommends:
- Keeping business logic outside UI components.
- Validating sensitive writes on trusted backend boundaries.
- Using database transactions for critical operations.
- Deduplicating imported health records.
- Never shipping service-role keys in the mobile application.
- Using native development builds for integrations that require native configuration.

Do not assume this stack is automatically best. Verify compatibility, realtime behavior, platform constraints, cost and operational tradeoffs.

## 3.5 Proposed repository structure

The second plan proposes a single mobile project with:

- `app/` for Expo Router routes.
- `src/components/` for reusable UI.
- `src/features/` for auth, tracking, health, friends, feed, chat and streaks.
- `src/lib/` for backend clients, query configuration and environment validation.
- `src/theme/` for design tokens.
- `supabase/migrations/` for versioned SQL.
- `supabase/functions/` for trusted server-side operations.
- `tests/` for unit, integration and end-to-end tests.
- `docs/` for product, architecture, database, security, implementation and testing documentation.
- `CLAUDE.md`, `README.md` and `.env.example`.

Treat this as a proposed structure rather than a requirement to create empty directories for every feature.

## 3.6 Proposed database entities

The proposed schema includes:

### Identity
- `profiles`
- `user_settings`

### Friendships
- `friend_requests`
- `friendships`
- `user_blocks`

### Workout and nutrition
- `workout_sessions`
- `workout_exercises`
- `workout_sets`
- `food_entries`
- `water_entries`
- `sleep_sessions`
- `daily_activity_summaries`

### Social
- `activity_posts`
- `post_reactions`
- `post_comments`
- `conversations`
- `conversation_members`
- `messages`

### Streaks
- `streak_challenges`
- `streak_participants`
- `streak_daily_progress`
- `streak_state`

### Operational and health integration
- `notifications`
- `push_tokens`
- `health_connections`
- `health_sync_cursors`
- `health_imported_records`
- Optional export-job tracking.

The proposal recommends UUID keys, foreign keys, constraints, uniqueness rules, indexes, UTC timestamps, user-local daily aggregation and explicit data-source tracking.

Evaluate normalization, duplication, query patterns, data retention, transaction boundaries and whether all entities are necessary for the MVP.

## 3.7 Proposed security model

The second plan requires:

- Explicit RLS policies on every exposed table.
- Owner-only access to private health logs.
- Friends-only access to eligible posts.
- Recipient-only authorization for accepting requests.
- Conversation-member-only access to chat.
- Validated challenge membership.
- Immediate enforcement of blocks and friendship removal.
- Server-side authorization for privileged transitions.
- Safe handling of uploads and user-generated content.
- Rate limiting.
- Secure secrets management.
- Account export and deletion.
- Avoidance of sensitive information in logs.

It emphasizes that frontend visibility controls do not replace backend authorization.

Critically examine the policies, including indirect access through joins, realtime subscriptions, database functions, storage policies, deletion workflows and any service-role operations.

## 3.8 Proposed partner streak logic

The proposed design separates:
- Challenge configuration.
- Participant membership.
- Individual daily progress.
- Aggregate streak state.

The initial challenge has two participants. Both must qualify on the same challenge-local calendar day for the shared streak to advance.

The proposed evaluation process:
1. Lock or otherwise safely coordinate evaluation of the challenge.
2. Compute progress for each participant.
3. Upsert daily progress using a unique challenge/participant/date key.
4. Determine shared completion.
5. Recompute consecutive qualifying dates.
6. Update the current and longest streak.
7. Persist changes transactionally.

The proposal also recommends:
- Idempotent evaluations.
- Defined finalization deadlines.
- Documented late-entry behavior.
- A fixed challenge timezone once activated.
- Recalculation when relevant records are edited or deleted.
- Scheduled backend evaluation.
- Explicit handling of denied health permissions.

Validate whether these rules are sufficient and whether a different state machine or data model would be better.

## 3.9 Proposed health integration approach

The second plan proposes:
- HealthKit for iOS.
- Health Connect for Android.
- A platform-independent health provider interface.
- Manual tracking fallbacks.
- Granular permission requests.
- Idempotent imports and provider-specific record IDs.
- Explicit handling of revoked permissions and incomplete history.
- Source attribution and deduplication.
- Avoidance of double-counted steps, workouts and calories.

It proposes a nutrition provider abstraction instead of hardcoding one food database.

Evaluate realistic implementation constraints, supported data types, native configuration, background execution, device testing and store-policy requirements.

## 3.10 Proposed implementation roadmap

The second plan proposes approximately eight weeks, subject to available development time and technical uncertainty.

- Week 1: foundation, design, configuration and authentication.
- Week 2: database, migrations and security.
- Week 3: personal tracking and dashboard.
- Week 4: friendships, feed, reactions and comments.
- Week 5: chat and notifications.
- Week 6: partner streaks.
- Week 7: health integrations.
- Week 8: testing, accessibility, security review and release preparation.

Evaluate dependencies and realism. Revise the timeline if necessary and state the assumptions behind it.

---

# PART 4 — CRITICAL COMPARISON

After developing your independent plan, compare it with the second blueprint above.

Do not simply merge them.

For every material disagreement:
1. Describe the difference.
2. Explain its practical consequences.
3. Determine which proposal is better, or recommend a third alternative.
4. Verify relevant technical claims where possible.
5. Record the final decision and its rationale.

Produce a comparison matrix covering:

- Product scope and prioritization.
- UX and visual design.
- Mobile architecture.
- Backend and database choices.
- Security and privacy.
- Social graph and feed design.
- Chat and realtime behavior.
- Health integration feasibility.
- Nutrition and calorie correctness.
- Streak calculation and fairness.
- Testing.
- Development complexity.
- Cost and scalability.
- Release readiness.

Identify:
- Strong ideas unique to the independent plan.
- Strong ideas unique to the supplied plan.
- Weaknesses shared by both.
- Important requirements missing from both.
- Features that should be removed, deferred or redesigned.

Be especially critical of overengineering, unnecessary abstraction, unverified package compatibility, fragile authorization, inaccurate calorie claims, and simplistic streak logic.

The result must be a reasoned engineering decision, not a compromise that automatically preserves every feature from both plans.

---

# PART 5 — FINAL CONSOLIDATED BLUEPRINT

Use the comparison to create a definitive product and engineering specification.

The final specification must include all the following sections.

## 5.1 Product strategy
- Product positioning.
- Target users.
- Core value proposition.
- Differentiators.
- MVP definition.
- Later releases.
- Explicitly deferred features.
- Key product assumptions and risks.

## 5.2 Functional requirements
- Authentication and profiles.
- Personal tracking.
- Dashboard and analytics.
- Friend requests and blocking.
- Feed, sharing and reactions.
- Comments.
- Private chat.
- Partner streaks.
- Health integrations.
- Notifications.
- Privacy and account management.

Provide requirement IDs and acceptance criteria where practical.

## 5.3 UX and design system
- Navigation.
- Screen hierarchy.
- Important user flows.
- Design principles.
- Light/dark theme tokens.
- Typography and spacing.
- Reusable components.
- Accessibility.
- Loading, empty, offline and error states.

## 5.4 Architecture
- Final technology stack.
- Architecture diagram.
- Client/server boundaries.
- Data-flow examples.
- State management.
- Offline behavior.
- Background processing.
- Notifications.
- Native health integration boundaries.
- Deployment and environment separation.

## 5.5 Database
- Final entity list.
- Important fields and relationships.
- Constraints and indexes.
- Timestamp and timezone rules.
- Data provenance.
- Aggregation and deduplication.
- Migration strategy.
- Transaction boundaries.

## 5.6 Security and privacy
- Threat model.
- Authentication.
- Authorization.
- RLS policies.
- Private health data.
- Feed visibility.
- Messaging authorization.
- Storage security.
- Blocking and removal.
- Secrets management.
- Data export and deletion.
- Rate limiting.
- Security test matrix.

## 5.7 Health and nutrition
- HealthKit and Health Connect strategy.
- Supported data types.
- Permission flows.
- Native configuration requirements.
- Manual fallbacks.
- Sync and deduplication.
- Nutrition database selection criteria.
- Calorie definitions and estimation.
- Platform limitations and external dependencies.

## 5.8 Partner streak engine
- State machine.
- Challenge configuration.
- Qualification rules.
- Deadline and timezone policy.
- Missed days.
- Late data and historical corrections.
- Idempotency.
- Concurrency.
- Notifications.
- Unit and integration tests.

## 5.9 Project structure
Provide a concrete repository structure suitable for the final architecture, without unnecessary empty modules or abstractions.

## 5.10 Implementation roadmap
Provide:
- Milestones.
- Dependencies.
- Deliverables.
- Acceptance criteria.
- Test gates.
- Risks.
- Realistic time ranges.
- What can be parallelized.
- What must be completed first.

## 5.11 Release-readiness plan
- Development and production environments.
- Testing.
- Accessibility.
- Performance.
- Device verification.
- Monitoring.
- Privacy disclosures.
- Store requirements.
- Account deletion.
- Backup and recovery.
- Rollback.
- Outstanding limitations.

## 5.12 Final master implementation prompt
At the end of the final blueprint, include a complete, self-contained prompt that can later be given to Claude Code to implement the application.

That future implementation prompt must:
- Instruct Claude to inspect the actual repository before editing.
- Preserve existing user work.
- Use the final approved architecture.
- Implement one milestone at a time.
- Create meaningful code and migrations.
- Enforce authorization and test it.
- Avoid exposing secrets.
- Run checks and report actual results.
- Handle missing credentials and native integration blockers honestly.
- Never claim unverified tests or integrations passed.
- Avoid committing or pushing to GitHub without explicit authorization.
- Never begin implementation until the user explicitly requests it.

Do not let the final implementation prompt override the current planning-only instruction. It is a deliverable for future use, not permission to execute it now.

---

# PART 6 — SAVE THE DELIVERABLES

This requirement is mandatory.

Save the completed planning artifacts inside the current project directory, under a dedicated directory named:

`docs/fitcircle-planning/`

If that path already exists, inspect its contents before making changes. Do not overwrite unrelated files. Use distinct filenames where necessary.

Create these files:

### 1. `INDEPENDENT_PLAN.md`
Your own plan, written before incorporating the second blueprint. Preserve your original reasoning and recommendations.

### 2. `PLAN_COMPARISON.md`
The comparison matrix, disagreements, strengths, weaknesses, missing requirements, evidence and final decisions.

### 3. `FINAL_PRODUCT_BLUEPRINT.md`
The definitive consolidated product and engineering plan, including requirements, UX, architecture, database, security, health integrations, streak logic, testing and roadmap.

### 4. `CLAUDE_IMPLEMENTATION_PROMPT.md`
The complete, self-contained future implementation prompt based on the final approved plan.

### 5. `DECISIONS_AND_OPEN_QUESTIONS.md`
The key architectural and product decisions, their rationale, unresolved questions, assumptions, risks and dependencies.

### 6. `SOURCES_AND_VERIFICATION.md`
Official documentation and other reliable sources used, with links, the claims they support, and any limitations or unresolved compatibility questions.

The files must be complete, substantive Markdown documents—not summaries, placeholders or copies of this entire input prompt.

Maintain clear separation between:
- Independent recommendations.
- Evaluation of the second blueprint.
- Final consolidated decisions.

If a decision remains uncertain, document the uncertainty and a validation step instead of inventing certainty.

Before saving:
1. Inspect the target directory.
2. Preserve unrelated files.
3. Write the complete documents.
4. Check that all six files exist and contain meaningful content.
5. Check internal consistency across the documents.
6. Ensure the final implementation prompt agrees with the final blueprint.
7. Report any file that could not be created or verified.

Do not create a second copy of the application, modify application source code, change Git settings, stage changes, commit, push, or modify GitHub.

If no project directory exists, ask for the intended working directory rather than creating files in an arbitrary location.

---

# PART 7 — FINAL RESPONSE

When the planning task is complete, report:

1. The location of the saved documents.
2. A concise summary of the final recommended architecture.
3. The most important decisions that changed during comparison.
4. The biggest risks and assumptions still unresolved.
5. The proposed MVP and milestone sequence.
6. The checks performed to verify the saved files.
7. Any technical claims or integrations that still require validation.

Be truthful about what was researched, what was implemented, what was merely proposed, and what was actually verified.

Again: **planning and documentation only. Do not implement the application until I explicitly authorize it.**