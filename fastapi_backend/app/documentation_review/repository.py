from uuid import UUID

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import SavedUpdate

from .schemas import (
    ReviewDecision,
    ReviewedSuggestion,
    SaveReviewedUpdateRequest,
    SavedUpdateRead,
    SavedUpdateSummary,
)


async def save_reviewed_update(
    db: AsyncSession,
    payload: SaveReviewedUpdateRequest,
) -> SavedUpdateRead:
    """Persist one reviewed documentation update and return its saved shape."""

    approved_count = sum(
        1
        for item in payload.reviewed_suggestions
        if item.decision == ReviewDecision.APPROVED
    )
    rejected_count = sum(
        1
        for item in payload.reviewed_suggestions
        if item.decision == ReviewDecision.REJECTED
    )

    saved = SavedUpdate(
        title=payload.title,
        request_text=payload.request,
        reviewed_suggestions=[
            item.model_dump(mode="json") for item in payload.reviewed_suggestions
        ],
        approved_count=approved_count,
        rejected_count=rejected_count,
    )

    db.add(saved)
    await db.commit()
    await db.refresh(saved)
    return saved_update_read(saved)


async def list_saved_updates(db: AsyncSession) -> list[SavedUpdateSummary]:
    """List Saved Updates from newest to oldest."""

    result = await db.execute(
        select(SavedUpdate).order_by(desc(SavedUpdate.created_at))
    )
    return [SavedUpdateSummary.model_validate(row) for row in result.scalars()]


async def get_saved_update(
    db: AsyncSession,
    saved_update_id: UUID,
) -> SavedUpdateRead | None:
    """Return one Saved Update with full reviewed suggestions when it exists."""

    saved = await db.get(SavedUpdate, saved_update_id)
    if saved is None:
        return None

    return saved_update_read(saved)


def saved_update_read(saved: SavedUpdate) -> SavedUpdateRead:
    """Convert a persisted Saved Update into its response contract."""

    reviewed_suggestions = [
        ReviewedSuggestion.model_validate(item) for item in saved.reviewed_suggestions
    ]

    return SavedUpdateRead(
        id=saved.id,
        title=saved.title,
        request=saved.request_text,
        reviewed_suggestions=reviewed_suggestions,
        approved_count=saved.approved_count,
        rejected_count=saved.rejected_count,
        created_at=saved.created_at,
    )
