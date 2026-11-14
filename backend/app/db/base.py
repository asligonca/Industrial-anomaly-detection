from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase

# Index ve constraint'lere sabit isim kalıbı verir.
# Alembic migration'larında isimsiz constraint sorun çıkarır (özellikle SQLite'ta).
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    """Tüm ORM modellerinin ortak üst sınıfı."""

    metadata = MetaData(naming_convention=NAMING_CONVENTION)
