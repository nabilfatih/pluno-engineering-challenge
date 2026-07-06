from collections.abc import Sequence
from typing import cast

from agents import Agent, Runner, function_tool, set_default_openai_key

from .corpus_loader import DocumentationSource
from .retrieval import render_chunks, retrieve_documentation
from .schemas import GeneratedDocumentationReview, NoSuggestionsResult


class ReviewerUnavailableError(RuntimeError):
    """Raised when the OpenAI reviewer cannot run in this environment."""


class OpenAIDocumentationReviewer:
    """Agents SDK adapter that turns a request into grounded suggestions."""

    def __init__(self, model: str, api_key: str | None) -> None:
        self.model: str = model
        self.api_key: str | None = api_key

    async def review(
        self,
        request: str,
        sources: Sequence[DocumentationSource],
    ) -> GeneratedDocumentationReview:
        """Run one focused Agents SDK reviewer over retrieved documentation."""

        if not self.api_key:
            raise ReviewerUnavailableError("OPENAI_API_KEY is not configured.")

        set_default_openai_key(self.api_key, use_for_tracing=False)
        retrieved = retrieve_documentation(request, sources)

        @function_tool
        def search_documentation(query: str) -> str:
            """Return relevant OpenAI documentation excerpts for a change request."""

            return render_chunks(retrieve_documentation(query, sources))

        agent = Agent(
            name="Documentation reviewer",
            instructions=REVIEWER_INSTRUCTIONS,
            model=self.model,
            output_type=GeneratedDocumentationReview,
            tools=[search_documentation],
        )
        result = await Runner.run(
            agent, _review_prompt(request, render_chunks(retrieved))
        )
        final_output = cast(object, result.final_output)

        if isinstance(final_output, GeneratedDocumentationReview):
            return final_output

        return GeneratedDocumentationReview.model_validate(final_output)


def _review_prompt(request: str, context: str) -> str:
    return "\n\n".join(
        [
            "Documentation Update Request:",
            request,
            "Retrieved documentation context:",
            context,
        ]
    )


REVIEWER_INSTRUCTIONS = """
You review OpenAI Agents SDK documentation for a maintainer.

Return at most three Edit Suggestions. Each suggestion must:
- target only a source with kind target from the provided context or search_documentation tool;
- copy original_excerpt exactly from the target source;
- replace only that excerpt with suggested_excerpt;
- cite evidence from the documentation context;
- explain the rationale and review_narrative in plain language.

Always return one title for the overall review:
- base it on the Documentation Update Request;
- keep it under 80 characters;
- do not copy a source_title or page title as the review title.

Call search_documentation when the initial context is not enough.

If the request is vague, unsupported, already reflected, or cannot be tied to an exact
target excerpt, return no_suggestions with a useful reason instead of guessing.
"""


def no_api_key_review() -> GeneratedDocumentationReview:
    """Return a deterministic no-suggestions result when local API access is absent."""

    return GeneratedDocumentationReview(
        title="Configure OpenAI API key",
        suggestions=[],
        no_suggestions=NoSuggestionsResult(
            reason="OPENAI_API_KEY is not configured for this environment.",
            searched_sources=[],
            review_narrative=(
                "Configure a rotated OpenAI API key to run the live Agents SDK "
                "reviewer. The rest of the workflow can still be tested with fakes."
            ),
        ),
    )
