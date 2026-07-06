from collections.abc import Sequence
from typing import Protocol
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings

from .corpus_loader import DocumentationSource, load_documentation_sources
from .repository import get_saved_update, list_saved_updates, save_reviewed_update
from .reviewer_agent import OpenAIDocumentationReviewer
from .schemas import (
    DocumentationReviewRequest,
    DocumentationReviewResponse,
    GeneratedDocumentationReview,
    SaveReviewedUpdateRequest,
    SavedUpdateRead,
    SavedUpdateSummary,
)
from .validation import grounded_review_response


class DocumentationReviewer(Protocol):
    """Interface for the adapter that produces raw documentation review output."""

    async def review(
        self,
        request: str,
        sources: Sequence[DocumentationSource],
    ) -> GeneratedDocumentationReview:
        """Generate raw Edit Suggestions before local grounding validation."""
        ...


class DocumentationReviewModule:
    """Deep module for generating, validating, and saving documentation reviews."""

    def __init__(
        self,
        reviewer: DocumentationReviewer,
        sources: Sequence[DocumentationSource] | None = None,
    ) -> None:
        self.reviewer: DocumentationReviewer = reviewer
        self.sources: list[DocumentationSource] = list(
            sources or load_documentation_sources()
        )

    @classmethod
    def from_settings(cls, settings: Settings) -> "DocumentationReviewModule":
        """Build the production module from application settings."""

        return cls(
            reviewer=OpenAIDocumentationReviewer(
                model=settings.OPENAI_MODEL,
                api_key=settings.OPENAI_API_KEY,
            )
        )

    async def propose_suggestions(
        self,
        payload: DocumentationReviewRequest,
    ) -> DocumentationReviewResponse:
        """Generate and ground Edit Suggestions for one update request."""

        generated = await self.reviewer.review(payload.request, self.sources)
        return grounded_review_response(payload.request, generated, self.sources)

    async def save_reviewed_update(
        self,
        db: AsyncSession,
        payload: SaveReviewedUpdateRequest,
    ) -> SavedUpdateRead:
        """Persist one reviewed update."""

        return await save_reviewed_update(db, payload)

    async def list_saved_updates(self, db: AsyncSession) -> list[SavedUpdateSummary]:
        """List previously saved updates."""

        return await list_saved_updates(db)

    async def get_saved_update(
        self,
        db: AsyncSession,
        saved_update_id: UUID,
    ) -> SavedUpdateRead | None:
        """Return one previously saved update with full reviewed suggestions."""

        return await get_saved_update(db, saved_update_id)
