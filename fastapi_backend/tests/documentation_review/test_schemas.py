import pytest
from pydantic import ValidationError

from app.documentation_review.schemas import (
    EditSuggestion,
    ReviewDecision,
    ReviewedSuggestion,
    SuggestionEvidence,
)


def test_reviewed_suggestion_accepts_valid_decision_shapes() -> None:
    """Approved and rejected Review Decisions have different excerpt shapes."""

    approved = ReviewedSuggestion(
        suggestion=_suggestion(),
        decision=ReviewDecision.APPROVED,
        final_excerpt="Use result.final_output after Runner.run.",
    )
    rejected = ReviewedSuggestion(
        suggestion=_suggestion(),
        decision=ReviewDecision.REJECTED,
        final_excerpt=None,
    )

    assert approved.final_excerpt == "Use result.final_output after Runner.run."
    assert rejected.final_excerpt is None


def test_approved_reviewed_suggestion_requires_final_excerpt() -> None:
    """Approved Edit Suggestions must persist the reviewed replacement text."""

    with pytest.raises(
        ValidationError,
        match="Approved suggestions require final_excerpt.",
    ):
        ReviewedSuggestion(
            suggestion=_suggestion(),
            decision=ReviewDecision.APPROVED,
            final_excerpt=" ",
        )


def test_rejected_reviewed_suggestion_rejects_final_excerpt() -> None:
    """Rejected Edit Suggestions must not persist replacement text."""

    with pytest.raises(
        ValidationError,
        match="Rejected suggestions cannot include final_excerpt.",
    ):
        ReviewedSuggestion(
            suggestion=_suggestion(),
            decision=ReviewDecision.REJECTED,
            final_excerpt="Use result.final_output after Runner.run.",
        )


def _suggestion() -> EditSuggestion:
    return EditSuggestion(
        id="runner-output",
        source_path="agents-quickstart.md",
        source_title="Agents SDK quickstart",
        original_excerpt="The SDK handles the model call.",
        suggested_excerpt="The SDK handles the model call and returns final_output.",
        rationale="The request asks for clearer result access wording.",
        evidence=[
            SuggestionEvidence(
                source_path="agents-results.md",
                source_title="Agents SDK results and state",
                source_url="https://openai.github.io/openai-agents-python/results/",
                quote="The final output is available as final_output.",
            )
        ],
        confidence=0.86,
        review_narrative="Grounded in the results documentation.",
    )
