from logging.config import fileConfig

from sqlalchemy import create_engine, pool

from alembic import context

import app.models  # noqa: F401
from app.core.config import settings
from app.db.base import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata
database_url = settings.database_url
is_sqlite = database_url.startswith("sqlite")


def run_migrations_offline() -> None:
    """DB'ye bağlanmadan SQL çıktısı üretir (`alembic upgrade head --sql`)."""
    context.configure(
        url=database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=is_sqlite,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Migration'ları DB'ye bağlanarak uygular.

    Uygulamanın engine'i yerine ayrı bir engine kullanılır: uygulamadaki
    `PRAGMA foreign_keys=ON`, SQLite batch modunda tablo yeniden oluşturulurken
    eski tablonun silinmesini engelleyebilir.
    """
    connectable = create_engine(database_url, poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=is_sqlite,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
