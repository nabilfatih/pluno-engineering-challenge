from functools import lru_cache
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_async_session

from .module import DocumentationReviewModule
from .reviewer_agent import ReviewerUnavailableError
from .schemas import (
    DocumentationReviewRequest,
    DocumentationReviewResponse,
    SaveReviewedUpdateRequest,
    SavedUpdateRead,
    SavedUpdateSummary,
)

router = APIRouter(prefix="/documentation-reviews", tags=["documentation-review"])


@lru_cache
def get_documentation_review_module() -> DocumentationReviewModule:
    """Return the process-wide Documentation Review module."""

    return DocumentationReviewModule.from_settings(settings)


@router.post("/suggestions", response_model=DocumentationReviewResponse)
async def propose_documentation_suggestions(
    payload: DocumentationReviewRequest,
    module: DocumentationReviewModule = Depends(get_documentation_review_module),
) -> DocumentationReviewResponse:
    """Generate grounded Edit Suggestions for a documentation update request."""

    try:
        return await module.propose_suggestions(payload)
    except ReviewerUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc


@router.post("/saved-updates", response_model=SavedUpdateRead)
async def save_documentation_update(
    payload: SaveReviewedUpdateRequest,
    db: AsyncSession = Depends(get_async_session),
    module: DocumentationReviewModule = Depends(get_documentation_review_module),
) -> SavedUpdateRead:
    """Persist the user's reviewed documentation update."""

    return await module.save_reviewed_update(db, payload)


@router.get("/saved-updates", response_model=list[SavedUpdateSummary])
async def list_documentation_updates(
    db: AsyncSession = Depends(get_async_session),
    module: DocumentationReviewModule = Depends(get_documentation_review_module),
) -> list[SavedUpdateSummary]:
    """List previously saved documentation updates."""

    return await module.list_saved_updates(db)


@router.get("/saved-updates/{saved_update_id}", response_model=SavedUpdateRead)
async def get_documentation_update(
    saved_update_id: UUID,
    db: AsyncSession = Depends(get_async_session),
    module: DocumentationReviewModule = Depends(get_documentation_review_module),
) -> SavedUpdateRead:
    """Return one saved documentation update with full reviewed suggestions."""

    saved_update = await module.get_saved_update(db, saved_update_id)
    if saved_update is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved update not found.",
        )

    return saved_update
