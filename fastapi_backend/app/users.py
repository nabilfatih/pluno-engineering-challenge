import re
import uuid
from collections.abc import AsyncGenerator, Awaitable, Callable
from typing import Annotated, cast, override

from fastapi import Depends, Request
from fastapi_users import (
    BaseUserManager,
    FastAPIUsers,
    InvalidPasswordException,
    UUIDIDMixin,
    schemas as fastapi_users_schemas,
)

from fastapi_users.authentication import (
    AuthenticationBackend,
    BearerTransport,
    JWTStrategy,
)
from fastapi_users.db import SQLAlchemyUserDatabase
from fastapi_users.jwt import SecretType

from .config import settings
from .database import get_user_db
from .email import send_reset_password_email
from .models import User

AUTH_URL_PATH = "auth"


class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret: SecretType = settings.RESET_PASSWORD_SECRET_KEY
    verification_token_secret: SecretType = settings.VERIFICATION_SECRET_KEY

    @override
    async def on_after_register(
        self, user: User, request: Request | None = None
    ) -> None:
        print(f"User {user.id} has registered.")

    @override
    async def on_after_forgot_password(
        self, user: User, token: str, request: Request | None = None
    ) -> None:
        await send_reset_password_email(user, token)

    @override
    async def on_after_request_verify(
        self, user: User, token: str, request: Request | None = None
    ) -> None:
        print(f"Verification requested for user {user.id}. Verification token: {token}")

    @override
    async def validate_password(
        self,
        password: str,
        user: fastapi_users_schemas.BaseUserCreate | User,
    ) -> None:
        errors: list[str] = []

        if len(password) < 8:
            errors.append("Password should be at least 8 characters.")
        if user.email in password:
            errors.append("Password should not contain e-mail.")
        if not any(char.isupper() for char in password):
            errors.append("Password should contain at least one uppercase letter.")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append("Password should contain at least one special character.")

        if errors:
            raise InvalidPasswordException(reason=errors)


UserDatabaseDep = Annotated[
    SQLAlchemyUserDatabase[User, uuid.UUID],
    Depends(get_user_db),
]


async def get_user_manager(
    user_db: UserDatabaseDep,
) -> AsyncGenerator[UserManager, None]:
    yield UserManager(user_db)


bearer_transport = BearerTransport(tokenUrl=f"{AUTH_URL_PATH}/jwt/login")


def get_jwt_strategy() -> JWTStrategy[User, uuid.UUID]:
    return JWTStrategy(
        secret=settings.ACCESS_SECRET_KEY,
        lifetime_seconds=settings.ACCESS_TOKEN_EXPIRE_SECONDS,
    )


auth_backend: AuthenticationBackend[User, uuid.UUID] = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

fastapi_users = FastAPIUsers[User, uuid.UUID](get_user_manager, [auth_backend])

current_active_user = cast(
    Callable[..., Awaitable[User]],
    fastapi_users.current_user(active=True),
)
