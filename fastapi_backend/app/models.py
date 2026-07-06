from datetime import datetime
from uuid import UUID as PythonUUID
from uuid import uuid4

from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(SQLAlchemyBaseUserTableUUID, Base):
    items: Mapped[list["Item"]] = relationship(
        "Item",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class Item(Base):
    __tablename__: str = "items"

    id: Mapped[PythonUUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    user_id: Mapped[PythonUUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        ForeignKey("user.id"),
        nullable=False,
    )

    user: Mapped[User] = relationship("User", back_populates="items")


class SavedUpdate(Base):
    __tablename__: str = "saved_updates"

    id: Mapped[PythonUUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    request_text: Mapped[str] = mapped_column(Text, nullable=False)
    reviewed_suggestions: Mapped[list[object]] = mapped_column(JSON, nullable=False)
    approved_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rejected_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
