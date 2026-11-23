import os

os.environ["JWT_SECRET_KEY"] = "test-anahtari-en-az-otuz-iki-karakter-uzunlukta"

from collections.abc import Callable, Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import create_access_token, hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import User
from app.models.enums import UserRole

TEST_PASSWORD = "parola123"


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    """Her test için bellekte, boş ve foreign key'leri açık ayrı bir SQLite veritabanı."""
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )

    @event.listens_for(engine, "connect")
    def _fk_on(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture
def make_user(db_session: Session) -> Callable[..., User]:
    """Test veritabanına doğrudan kullanıcı ekler (parola: `TEST_PASSWORD`)."""

    def _make(username: str, role: UserRole = UserRole.operator, is_active: bool = True) -> User:
        user = User(
            username=username,
            password_hash=hash_password(TEST_PASSWORD),
            role=role,
            is_active=is_active,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    return _make


@pytest.fixture
def anon_client(db_session: Session) -> Generator[TestClient, None, None]:
    """Token göndermeyen, `get_db`'yi test veritabanına yönlendiren TestClient."""
    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def _client_for(user: User) -> TestClient:
    test_client = TestClient(app)
    test_client.headers["Authorization"] = f"Bearer {create_access_token(user)}"
    return test_client


@pytest.fixture
def admin_user(make_user) -> User:
    return make_user("admin", UserRole.admin)


@pytest.fixture
def operator_user(make_user) -> User:
    return make_user("operator", UserRole.operator)


@pytest.fixture
def client(anon_client: TestClient, admin_user: User) -> Generator[TestClient, None, None]:
    """Admin olarak giriş yapmış TestClient."""
    with _client_for(admin_user) as test_client:
        yield test_client


@pytest.fixture
def operator_client(anon_client: TestClient, operator_user: User) -> Generator[TestClient, None, None]:
    """Operatör olarak giriş yapmış TestClient."""
    with _client_for(operator_user) as test_client:
        yield test_client


@pytest.fixture
def camera(client: TestClient) -> dict:
    """Parolalı stream adresi olan örnek kamera."""
    response = client.post(
        "/api/cameras",
        json={
            "name": "Pres Hattı",
            "area": "Üretim",
            "stream_url": "rtsp://admin:gizli123@10.0.1.11/stream",
            "location": "Hol B, kuzey duvarı",
        },
    )
    assert response.status_code == 201
    return response.json()
