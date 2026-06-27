# Implementation Plan

This plan records scoped product and architecture decisions for the Pluno take-home challenge.

## Goal

Build a documentation review app that turns a Documentation Update Request into evidence-backed, apply-ready Edit Suggestions for OpenAI Agents SDK documentation.

## Resolved Scope

- Use one OpenAI Agents SDK reviewer agent first.
- Use the actual Python Agents SDK package, `openai-agents`, in the backend.
- Enforce structured agent output and validate it again in backend code.
- Use deterministic backend verification before any optional verifier agent.
- Search curated local documentation snapshots instead of live-fetching docs per request.
- Store curated markdown snapshots inside the backend Documentation Review module.
- Commit curated markdown snapshots and include a small refresh script.
- Use ranked in-process full-text retrieval for v1.
- Treat OpenAI Agents SDK docs as Target Documentation Sources.
- Treat OpenAI API implementation docs as Reference Documentation Sources.
- Use structured Edit Suggestions as the source of truth.
- Add Review Narratives only to improve user comprehension.
- Save apply-ready before-and-after documentation changes.
- Represent each Edit Suggestion with full original and replacement excerpts, not patch syntax.
- Require each Edit Suggestion to include a matching original excerpt from a Target Documentation Source.
- Filter or reject ungrounded agent output in the backend before it reaches the UI.
- Return an explicit No-Suggestions Result when no grounded apply-ready edits are available.
- Do not mutate documentation repositories or open GitHub pull requests in v1.
- Return up to 3 Edit Suggestions per Documentation Update Request.
- Keep the challenge review workflow usable without login.
- Persist Saved Updates in Postgres through the existing SQLAlchemy/Alembic stack.
- Expose three challenge endpoints: generate suggestions, save reviewed updates, and list Saved Updates.
- Generate suggestions synchronously in v1.
- Let users edit replacement excerpts and approve/reject suggestions; keep evidence and rationale read-only.
- Save rejected suggestions as review history, but only approved or revised suggestions are apply-ready changes.
- Allow saving a review when all suggestions are rejected.
- Show a simple Saved Updates list in v1.
- Make `/` the documentation review workspace.
- Build the review workspace as a client component with TanStack Query and TanStack Form.
- Call FastAPI directly from the browser through the generated OpenAPI client.

## Why Cap Suggestions

A single Documentation Update Request can affect multiple Target Documentation Sources, but unlimited suggestions would reduce review quality and make the UI noisy. Three suggestions is enough to show cross-document reasoning while keeping the review workflow fast and testable.

## Authentication Scope

The take-home workflow should be usable immediately without registration or login. The starter template's authentication code can remain, but the main documentation review experience should not depend on it because the challenge prioritizes AI quality and review UX.

Production should require authentication and associate Saved Updates with a user, team, or workspace. That production version would also need authorization rules around who can create, review, export, or apply documentation changes.

## Persistence Shape

Use one `saved_updates` table row per saved review session. Store the Documentation Update Request, a compact summary/title, and the reviewed Edit Suggestions as JSON.

The JSON shape should include both accepted and rejected Review Decisions. Approved or revised suggestions are apply-ready changes; rejected suggestions are preserved as review history. Saving a review with all suggestions rejected is valid, but it has zero apply-ready changes and should be labeled clearly in the UI.

The JSON shape is enough for the take-home because the app only needs to save and display reviewed updates. Production can normalize Edit Suggestions into separate rows later if it needs per-suggestion analytics, assignment, comments, audit trails, or cross-update search.

## Saved Updates List

The frontend should show a simple list of Saved Updates so persistence is visible in the demo. Each list item should include a compact title or request summary, creation time, and approved change count.

The list endpoint should return summary rows only: id, compact title or request summary, creation time, approved count, and rejected count. A saved-update detail endpoint is acceptable v1 polish if the core flow is already working, but it is not on the critical path.

## Frontend Surface

The root page `/` should be the usable documentation review workspace. It should not show the template landing page, login prompt, or dashboard-first navigation.

The starter template's auth/dashboard code can remain available, but the take-home demo should open directly to the product workflow.

## Frontend State and Forms

The review workspace should be a client component. Use TanStack Query for server state and mutations:

- generate suggestions
- save reviewed updates
- refresh the Saved Updates summary list

Use TanStack Form for the Documentation Update Request form and the review form fields. The review form should manage each suggestion's Review Decision and final replacement excerpt, while read-only evidence and rationale stay outside editable form state.

Do not refactor existing template auth/item forms from React Hook Form to TanStack Form unless they block the challenge workflow. New documentation review UI should use TanStack Form; existing template surfaces can remain unchanged.

Keep Zod for validation. Do not introduce Effect-TS in the frontend v1 unless the TypeScript side becomes meaningfully Effect-native; adding Effect only around generated client calls would be ceremony without enough leverage for this challenge.

Use existing shadcn/ui primitives and add missing primitives only when needed, such as `textarea`, `alert`, `skeleton`, `separator`, or `tooltip`. Do not reinitialize shadcn; the project already has `components.json`, theme tokens, and local component source.

The review workspace should call FastAPI directly from the browser through the generated OpenAPI client. Do not add Next.js proxy routes or server actions for v1 because the challenge workflow is unauthenticated and the template already supports CORS.

Production can add Next.js server routes or server actions if the app needs cookie-backed authentication, request signing, sensitive server-only aggregation, or backend-for-frontend behavior.

Install TanStack dependencies during implementation, not during planning:

- `@tanstack/react-query`
- `@tanstack/react-form`

Use `pnpm` from `nextjs-frontend` because `package.json` declares pnpm and `pnpm-lock.yaml` matches the current dependency versions. Avoid touching the stale npm `package-lock.json` unless the project package-manager strategy changes.

Implementation update: the stale `package-lock.json` was removed after the generated OpenAPI client moved from axios to fetch and the frontend was standardized on pnpm.

## Edit Shape

Each Edit Suggestion should include a full `original_excerpt` and a full `replacement_excerpt`. The user can revise the replacement text directly, and the Saved Update stores the final replacement excerpt.

The app should not ask the agent to emit patch syntax for v1. Patch generation is brittle when excerpts drift and would add validation work that does not improve the core review workflow. The UI can still render a before/after comparison from the two excerpts.

Reviewers can edit only the replacement excerpt and the Review Decision in v1. Rationale, evidence, confidence, source path, and original excerpt should be visible but read-only so the Saved Update preserves a trustworthy audit of what the agent grounded its suggestion on.

## Retrieval Scope

The v1 retrieval module should search local markdown snapshots in-process. It should chunk documents by heading, score exact terms and phrases, boost title/path matches, and include aliases for common domain terms such as `as_tool`, `handoff`, `agent as tool`, and `tool call`.

Curated markdown snapshots should live under the backend Documentation Review module, for example `fastapi_backend/app/documentation_review/corpus/`. This keeps runtime corpus files separate from project planning docs and lets retrieval tests load the same package-relative sources as production code.

The first Target Documentation Source corpus should cover:

- Agents SDK overview / starting points
- Agents SDK quickstart
- Agents SDK running agents
- Agents SDK results and state
- Agents SDK orchestration and handoffs
- OpenAI tools guide sections that document Agents SDK tool usage, including function tools and agents-as-tools

Keep the corpus narrow enough that retrieval quality can be inspected manually. Add more Target Documentation Sources only after the core `as_tool` versus handoff scenario works reliably.

Corpus snapshots should be committed so tests and demos are deterministic. Add a small refresh script to fetch/update snapshots from official docs, but the runtime app should not depend on network access to load its corpus.

The refresh script should fetch public documentation URLs directly with normal Python tooling. It must not depend on Codex MCP tools or local agent-only infrastructure, so a reviewer can run it outside Codex. Place it beside the corpus, for example `fastapi_backend/app/documentation_review/refresh_corpus.py`, because it owns the corpus format and package-relative paths.

Vector search is a day-6 stretch goal, not a first-pass dependency. Production should move toward hybrid retrieval with full-text search plus embeddings, indexed asynchronously with freshness checks.

## Agents SDK Dependency

The backend should use the real Python OpenAI Agents SDK package, `openai-agents`, not a direct Responses API call wrapped in a locally named "agent" module. The reviewer should use SDK primitives such as `Agent`, `Runner`, and `function_tool`.

Install this during implementation through the backend's `uv` workflow, then update the lock/exported requirements consistently. Keep the workflow to one focused reviewer agent first, matching the official quickstart guidance to add tools and specialist agents incrementally.

## Agent Output Validation

The reviewer agent should produce structured output at the SDK boundary, not free-form text that the backend tries to parse after the fact. Backend Pydantic models should then validate the structured result again before it is returned to the frontend or persisted.

The second validation pass is authoritative. It should enforce suggestion count limits, required fields, matching original excerpts, source type rules, and No-Suggestions Result shape.

Use deterministic backend verification for basic trust: source paths must exist, original excerpts must match Target Documentation Sources, counts must be within limits, and saved payloads must match the public contracts. A second verifier agent is optional polish for semantic quality if the core flow is already complete, but it should not replace deterministic checks.

## Grounding Rule

Every Edit Suggestion must include an `original_excerpt` that matches text from a Target Documentation Source. If the reviewer agent cannot find a matching excerpt, the response should explain that more source context is needed instead of inventing an apply-ready change.

This rule keeps suggestions reviewable and makes Saved Updates credible. It also gives backend tests a clear validation target: suggested original excerpts must be traceable to the curated corpus.

The backend owns this validation. The frontend should receive only grounded Edit Suggestions or a clear no-suggestions result; it should not be responsible for detecting hallucinated excerpts.

## No-Suggestions Result

The API should return an explicit No-Suggestions Result instead of a bare empty suggestions array. The result should include a plain-language reason, such as no matching Target Documentation Source, insufficient evidence, or related docs found but no apply-ready excerpt.

The UI should not say "all good" unless the backend can confidently explain that the current documentation already matches the requested change. Most no-suggestions cases should be phrased as "No apply-ready edits found" with the reason.

## Endpoint Shape

Expose three challenge endpoints:

- `POST /documentation-reviews/suggestions`
- `POST /documentation-reviews/saved-updates`
- `GET /documentation-reviews/saved-updates`

Search, drafting, structured output parsing, grounding validation, and no-suggestions handling should stay behind the backend Documentation Review module interface. The frontend should not orchestrate internal AI pipeline steps.

Suggestion generation should be synchronous in v1. The curated corpus and single-agent workflow should keep demo latency acceptable, and the simpler request/response interface reduces frontend and test complexity.

Production can move this endpoint to background jobs, streaming status, or queue-backed workflows if retrieval expands, verification becomes multi-step, or request latency becomes unpredictable.
