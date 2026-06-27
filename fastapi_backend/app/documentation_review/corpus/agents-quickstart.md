title: Agents SDK quickstart
source_url: https://developers.openai.com/api/docs/guides/agents/quickstart
kind: target
---
# Quickstart

Use this page when you want the shortest path to a working SDK-based agent. The examples below use the same high-level concepts in both TypeScript and Python: define an agent, run it, then add tools and specialist agents as your workflow grows.

## Create and run your first agent

Start with one focused agent and one turn. The SDK handles the model call and returns a result object with the final output plus the run history.

```python
from agents import Agent, Runner

agent = Agent(
    name="History tutor",
    instructions="You answer history questions clearly and concisely.",
    model="gpt-5.5",
)

result = await Runner.run(agent, "When did the Roman Empire fall?")
print(result.final_output)
```

## Give the agent a tool

The first capability you add is often a function tool or a hosted OpenAI tool such as web search or file search.

```python
from agents import Agent, Runner, function_tool

@function_tool
def history_fun_fact() -> str:
    """Return a short history fact."""
    return "Sharks are older than trees."

agent = Agent(
    name="History tutor",
    instructions="Answer history questions clearly. Use history_fun_fact when it helps.",
    tools=[history_fun_fact],
)
```

Use the shared Using tools guide when you need hosted tools, tool search, or agents-as-tools.

## Add specialist agents

A common next step is to split the workflow into specialists and let a router delegate to them with handoffs.

```python
history_tutor = Agent(
    name="History tutor",
    handoff_description="Specialist for history questions.",
    instructions="Answer history questions clearly and concisely.",
)

triage_agent = Agent(
    name="Homework triage",
    instructions="Route each homework question to the right specialist.",
    handoffs=[history_tutor],
)
```
