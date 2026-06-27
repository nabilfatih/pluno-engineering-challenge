title: Using tools in the Agents SDK
source_url: https://developers.openai.com/api/docs/guides/tools#usage-in-the-agents-sdk
kind: target
---
# Using tools

## Usage in the Agents SDK

In the Agents SDK, the tool semantics stay the same, but the wiring moves into the agent definition and workflow design rather than a single Responses API request.

- Attach hosted tools, function tools, or hosted MCP tools directly on the agent when one specialist should call them itself.
- Expose a specialist as a tool when a manager should stay in control of the user-facing reply.
- Keep shell, apply patch, and computer-use harnesses in your runtime even when the SDK models the tool decision.

Wrap local logic as a function tool:

```python
from agents import function_tool

@function_tool
def get_weather(city: str) -> str:
    """Get the weather for a given city."""
    return f"The weather in {city} is sunny."
```

Expose a specialist as a tool:

```python
from agents import Agent

summarizer = Agent(
    name="Summarizer",
    instructions="Generate a concise summary of the supplied text.",
)

main_agent = Agent(
    name="Research assistant",
    tools=[
        summarizer.as_tool(
            tool_name="summarize_text",
            tool_description="Generate a concise summary of the supplied text.",
        )
    ],
)
```
