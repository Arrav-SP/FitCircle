# FitCircle — Project Instructions

## Project Goal
Build a polished, cross-platform social fitness application for iOS and Android. Follow the approved product blueprint and implementation plan.

## Working Rules
- Read the relevant project documentation before making architectural or implementation decisions.
- Keep changes focused, simple, maintainable, and consistent with the existing codebase.
- Reuse existing functionality and dependencies wherever appropriate.
- Do not implement features outside the approved scope without explaining why and obtaining approval.
- Never claim tests, builds, integrations, or features work without verification.
- Use tests for critical business logic and security-sensitive behavior.
- Keep documentation updated when important architectural decisions change.

## Security and Privacy
- Treat health and fitness data as private by default.
- Enforce authorization on the server and database, not just in the UI.
- Never expose service-role keys, credentials, or secrets in client-side code.
- Validate permissions for friendships, posts, messages, and shared activity.
- Handle health-data imports, duplicate records, and time zones carefully.

## Workflow
- For significant new features, clarify requirements and agree on a plan before implementation.
- Implement in small, verifiable steps.
- Run relevant tests and checks before declaring work complete.
- Use Graphify when codebase relationships materially help; do not generate graphs unnecessarily.
- Use RTK for supported terminal commands when appropriate.
- Apply installed Ponytail and Superpowers workflows when relevant, without duplicating unnecessary analysis.

## Scope and Git
- Respect explicit planning-only or implementation-only instructions.
- Do not commit, push, deploy, or perform destructive operations unless authorized.
- Ask before making consequential changes that fall outside the approved plan.