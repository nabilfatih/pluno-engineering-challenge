title: Agents SDK overview
source_url: https://developers.openai.com/api/docs/guides/agents#build-with-the-sdk
kind: target
---
# Agents SDK

## Build with the SDK

Use the SDK track when your server owns orchestration, tool execution, state, and approvals. That path is the best fit when you want:

- typed application code in TypeScript or Python
- direct control over tools, MCP servers, and runtime behavior
- custom storage or server-managed conversation strategies
- tight integration with existing product logic or infrastructure

A typical SDK reading order is:

- Start with Quickstart to get one working run on screen.
- Use Agent definitions and Models and providers to shape one specialist cleanly.
- Continue to Running agents, Orchestration and handoffs, and Guardrails and human review as the workflow grows more complex.
- Use Results and state and Integrations and observability when application logic depends on the run object or deeper visibility into behavior.
