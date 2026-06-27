import re
from typing import Sequence

from .corpus_loader import DocumentationSource
from .schemas import (
    DocumentationReviewResponse,
    EditSuggestion,
    GeneratedDocumentationReview,
    NoSuggestionsResult,
)


def grounded_review_response(
    request: str,
    generated: GeneratedDocumentationReview,
    sources: Sequence[DocumentationSource],
) -> DocumentationReviewResponse:
    """Return only Edit Suggestions that pass the Grounding Check."""

    source_by_path = {source.path: source for source in sources}
    grounded = [
        suggestion
        for suggestion in generated.suggestions[:3]
        if suggestion_passes_grounding_check(suggestion, source_by_path)
    ]

    if grounded:
        return DocumentationReviewResponse(request=request, suggestions=grounded)

    no_suggestions = generated.no_suggestions
    if no_suggestions is None:
        no_suggestions = NoSuggestionsResult(
            reason="The reviewer did not return an excerpt that matched the target documentation.",
            searched_sources=list(source_by_path),
            review_narrative=(
                "No apply-ready update was shown because every proposed original "
                "excerpt failed the grounding check."
            ),
        )

    return DocumentationReviewResponse(
        request=request,
        suggestions=[],
        no_suggestions=no_suggestions,
    )


def suggestion_passes_grounding_check(
    suggestion: EditSuggestion,
    source_by_path: dict[str, DocumentationSource],
) -> bool:
    """Verify that a suggestion replaces exact text from its target source."""

    source = source_by_path.get(suggestion.source_path)
    if source is None:
        return False

    if source.kind != "target":
        return False

    return _contains_excerpt(source.content, suggestion.original_excerpt)


def _contains_excerpt(content: str, excerpt: str) -> bool:
    normalized_content = _normalize_text(content)
    normalized_excerpt = _normalize_text(excerpt)

    if not normalized_excerpt:
        return False

    return normalized_excerpt in normalized_content


def _normalize_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()
