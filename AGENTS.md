# Pluno Challenge Agent Guide

Build for longevity. Favor readable, skimmable, well-verified code over speed or cleverness.

Keep the implementation tight. If a change starts growing past a few hundred lines, stop and reassess the scope before continuing.

This project is a take-home challenge based on `vintasoftware/nextjs-fastapi-template`. Preserve the template's FastAPI + Next.js conventions unless there is a concrete reason to depart.

Expected product:
- User enters a natural-language documentation update request.
- Backend uses the OpenAI API to inspect OpenAI Agents SDK documentation and propose edit suggestions.
- Web app lets the user review, edit, approve, reject, and save suggested updates.
- README documents speed tradeoffs and how the implementation would change for production.

Engineering rules:
- Keep domain logic readable and directly named.
- Use typed request/response contracts at backend/frontend boundaries.
- Do not commit secrets or generated local env files.
- Public module interfaces, service methods, schema parsers, route helpers, and non-obvious functions need useful JSDoc/docstrings.
- Prefer early returns and simple control flow. Avoid clever ternaries and wrapper chains.
- Tests should cover the suggestion pipeline and the review/save workflow at a practical level.

Research expectations:
- Read the existing template docs and code before editing.
- Read the relevant OpenAI Agents SDK documentation before designing the AI prompt/retrieval path.
- Inspect installed dependencies and generated OpenAPI client conventions before adding new packages.
