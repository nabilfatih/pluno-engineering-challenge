title: Agents SDK results and state
source_url: https://developers.openai.com/api/docs/guides/agents/results#choose-the-result-surface-you-need
kind: target
---
# Results and state

## Choose the result surface you need

Most applications only need a small set of result properties:

- The final answer to show the user: final_output in Python.
- Local replay-ready history: to_input_list() in Python.
- The specialist that should usually own the next turn: last_agent in Python.
- OpenAI-managed response chaining: last_response_id in Python.
- Pending approvals and a resumable snapshot: interruptions plus to_state() in Python.

Those are the guide-level surfaces to learn first. Richer run items, raw model responses, and detailed diagnostics still belong in the SDK docs and reference material.
