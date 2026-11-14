from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

is_sqlite = settings.database_url.startswith("sqlite")

# SQLite bağlantısı varsayılan olarak tek thread'e kilitlidir; FastAPI ise
# senkron endpoint'leri thread havuzunda çalıştırır. Bu yüzden kontrolü kapatıyoruz.
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(settings.database_url, connect_args=connect_args)

if is_sqlite:

    @event.listens_for(engine, "connect")
    def _enable_sqlite_foreign_keys(dbapi_connection, connection_record):
        # SQLite foreign key kurallarını varsayılan olarak uygulamaz; her yeni bağlantıda açıyoruz.
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Her istek için bir oturum açar, istek bitince kapatır. `Depends(get_db)` ile kullanılır."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
