from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field


class ReviewDecision(StrEnum):
    """Decision a reviewer makes for one Edit Suggestion."""

    APPROVED = "approved"
    REJECTED = "rejected"


class SuggestionEvidence(BaseModel):
    """A source excerpt used to justify an Edit Suggestion."""

    source_path: str = Field(min_length=1)
    source_title: str = Field(min_length=1)
    source_url: str = Field(min_length=1)
    quote: str = Field(min_length=1, max_length=1200)


class EditSuggestion(BaseModel):
    """An apply-ready documentation replacement tied to one source excerpt."""

    id: str = Field(min_length=1, max_length=80)
    source_path: str = Field(min_length=1)
    source_title: str = Field(min_length=1)
    original_excerpt: str = Field(min_length=1, max_length=3000)
    suggested_excerpt: str = Field(min_length=1, max_length=4000)
    rationale: str = Field(min_length=1, max_length=1200)
    evidence: list[SuggestionEvidence] = Field(default_factory=list, max_length=4)
    confidence: float = Field(ge=0, le=1)
    review_narrative: str = Field(min_length=1, max_length=1400)


class NoSuggestionsResult(BaseModel):
    """A grounded explanation for why no Edit Suggestions were produced."""

    reason: str = Field(min_length=1, max_length=1200)
    searched_sources: list[str] = Field(default_factory=list, max_length=8)
    review_narrative: str = Field(min_length=1, max_length=1400)


class GeneratedDocumentationReview(BaseModel):
    """Structured output expected from the Agents SDK reviewer."""

    suggestions: list[EditSuggestion] = Field(default_factory=list, max_length=3)
    no_suggestions: NoSuggestionsResult | None = None


class DocumentationReviewRequest(BaseModel):
    """Request body for generating documentation Edit Suggestions."""

    request: str = Field(min_length=8, max_length=4000)


class DocumentationReviewResponse(GeneratedDocumentationReview):
    """Grounded documentation review returned to the web app."""

    request: str


class ReviewedSuggestion(BaseModel):
    """One reviewed suggestion with the user's final decision and edits."""

    suggestion: EditSuggestion
    decision: ReviewDecision
    final_excerpt: str | None = Field(default=None, max_length=4000)
    reviewer_note: str | None = Field(default=None, max_length=1200)


class SaveReviewedUpdateRequest(BaseModel):
    """Request body for persisting reviewed documentation changes."""

    request: str = Field(min_length=8, max_length=4000)
    title: str = Field(min_length=3, max_length=160)
    summary: str = Field(min_length=3, max_length=600)
    reviewed_suggestions: list[ReviewedSuggestion] = Field(
        default_factory=list,
        max_length=3,
    )


class SavedUpdateSummary(BaseModel):
    """Compact Saved Update shape used by the list view."""

    id: UUID
    title: str
    summary: str
    approved_count: int
    rejected_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class SavedUpdateRead(SavedUpdateSummary):
    """Full Saved Update shape returned after saving."""

    request: str
    reviewed_suggestions: list[ReviewedSuggestion]
