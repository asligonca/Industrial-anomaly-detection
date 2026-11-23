from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app


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
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """`get_db`'yi test veritabanına yönlendiren TestClient."""
    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


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
