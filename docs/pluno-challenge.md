# Pluno Engineering Challenge

Source: https://awesome-qa.notion.site/Pluno-Engineering-Challenge-2167b79cedf280d89257cc0165488555

## Problem

Information changes fast, and companies need help keeping documentation accurate. The product should help users update documentation from natural-language requests.

The example domain is OpenAI's Agents SDK documentation.

## Required Flow

1. User enters a query describing what changed or what they want updated in the documentation.
2. AI checks what might need to be updated and provides edit suggestions.
3. User reviews suggested updates in the app.
4. User can approve, reject, or edit suggestions.
5. Saved result is persisted.

Example query:

> We don't support agents as_tool anymore, other agents should only be invoked via handoff

## Minimum Requirements

- User can enter any query in the web app.
- AI provides edit suggestions.
- User can review and save updates in the web app.

## Focus

- Make conscious tradeoffs between proper and fast implementation.
- Document speed tradeoffs in the README, including what would change for production.
- Spend roughly 40% effort on the web app and 60% on the AI suggestion quality.
- Suggestions only need to be reasonable for straightforward queries; document additional improvements instead of implementing everything.
- Keep alternative architecture and behavior choices ready to discuss.

## Starter

Use the FastAPI + Next.js template:

https://github.com/vintasoftware/nextjs-fastapi-template
