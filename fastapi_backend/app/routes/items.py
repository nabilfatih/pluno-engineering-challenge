from collections.abc import Sequence
from typing import Annotated, cast
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi_pagination import Page, Params
from fastapi_pagination.ext.sqlalchemy import apaginate
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_async_session
from app.models import Item, User
from app.schemas import ItemRead, ItemCreate
from app.users import current_active_user

router = APIRouter(tags=["item"])

AsyncSessionDep = Annotated[AsyncSession, Depends(get_async_session)]
CurrentUserDep = Annotated[User, Depends(current_active_user)]
PageNumberQuery = Annotated[int, Query(ge=1, description="Page number")]
PageSizeQuery = Annotated[int, Query(ge=1, le=100, description="Page size")]


def transform_items(items: Sequence[Item]) -> list[ItemRead]:
    """Convert persisted Items into the paginated API response shape."""

    return [ItemRead.model_validate(item) for item in items]


@router.get("/", response_model=Page[ItemRead])
async def read_item(
    db: AsyncSessionDep,
    user: CurrentUserDep,
    page: PageNumberQuery = 1,
    size: PageSizeQuery = 10,
) -> Page[ItemRead]:
    """Return the authenticated user's Items as a paginated collection."""

    params = Params(page=page, size=size)
    query = select(Item).filter(Item.user_id == user.id)
    return cast(
        Page[ItemRead],
        await apaginate(db, query, params, transformer=transform_items),
    )


@router.post("/", response_model=ItemRead)
async def create_item(
    item: ItemCreate,
    db: AsyncSessionDep,
    user: CurrentUserDep,
) -> Item:
    """Create one Item owned by the authenticated user."""

    db_item = Item(**item.model_dump(), user_id=user.id)
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item


@router.delete("/{item_id}")
async def delete_item(
    item_id: UUID,
    db: AsyncSessionDep,
    user: CurrentUserDep,
) -> dict[str, str]:
    """Delete one authenticated-user-owned Item."""

    result = await db.execute(
        select(Item).filter(Item.id == item_id, Item.user_id == user.id)
    )
    item = result.scalars().first()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found or not authorized")

    await db.delete(item)
    await db.commit()

    return {"message": "Item successfully deleted"}
