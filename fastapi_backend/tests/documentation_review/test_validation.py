from app.documentation_review.corpus_loader import load_documentation_sources
from app.documentation_review.schemas import (
    EditSuggestion,
    GeneratedDocumentationReview,
    SuggestionEvidence,
)
from app.documentation_review.validation import grounded_review_response


def test_grounded_review_response_keeps_matching_excerpt() -> None:
    """A suggestion is returned when its original excerpt exists in the target."""

    generated = GeneratedDocumentationReview(
        suggestions=[
            _suggestion(
                original_excerpt=(
                    "Start with one focused agent and one turn. The SDK handles "
                    "the model call and returns a result object with the final "
                    "output plus the run history."
                )
            )
        ]
    )

    response = grounded_review_response(
        "Clarify the first agent run output.",
        generated,
        load_documentation_sources(),
    )

    assert len(response.suggestions) == 1
    assert response.no_suggestions is None


def test_grounded_review_response_rejects_non_matching_excerpt() -> None:
    """A suggestion is hidden when the model invents the original excerpt."""

    generated = GeneratedDocumentationReview(
        suggestions=[_suggestion(original_excerpt="This text is not in the docs.")]
    )

    response = grounded_review_response(
        "Clarify the first agent run output.",
        generated,
        load_documentation_sources(),
    )

    assert response.suggestions == []
    assert response.no_suggestions is not None


def _suggestion(original_excerpt: str) -> EditSuggestion:
    return EditSuggestion(
        id="quickstart-output",
        source_path="agents-quickstart.md",
        source_title="Agents SDK quickstart",
        original_excerpt=original_excerpt,
        suggested_excerpt="Start with one focused agent and inspect final_output.",
        rationale="The replacement calls out the result field directly.",
        evidence=[
            SuggestionEvidence(
                source_path="agents-results.md",
                source_title="Agents SDK results and state",
                source_url=(
                    "https://developers.openai.com/api/docs/guides/agents/results"
                ),
                quote="The final answer to show the user: final_output in Python.",
            )
        ],
        confidence=0.8,
        review_narrative="Grounded quickstart wording update.",
    )
