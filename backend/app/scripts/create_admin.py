"""İlk admin kullanıcısını oluşturur.

Kullanım (`backend/` içinde, `alembic upgrade head` sonrası):
    python -m app.scripts.create_admin --username admin

Parola komut satırından alınmaz, iki kez sorulur. Kullanıcı adı varsa hiçbir şey değiştirmez.
"""

import argparse
import getpass
import sys

from pydantic import TypeAdapter, ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import User
from app.models.enums import UserRole
from app.schemas.user import Password, Username


def create_admin(db: Session, username: str, password: str) -> User:
    """Admin kullanıcı ekler. Ad ya da parola kurala uymuyorsa ya da ad alınmışsa `ValueError`."""
    try:
        username = TypeAdapter(Username).validate_python(username)
        password = TypeAdapter(Password).validate_python(password)
    except ValidationError as exc:
        raise ValueError(exc.errors()[0]["msg"]) from exc
    if db.scalar(select(User.id).where(User.username == username)) is not None:
        raise ValueError(f"'{username}' kullanıcı adı zaten var; değiştirilmedi")
    user = User(username=username, password_hash=hash_password(password), role=UserRole.admin)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def main() -> int:
    parser = argparse.ArgumentParser(description="İlk admin kullanıcısını oluşturur.")
    parser.add_argument("--username", default="admin", help="Kullanıcı adı (varsayılan: admin)")
    args = parser.parse_args()

    password = getpass.getpass("Parola (en az 8 karakter): ")
    if password != getpass.getpass("Parola (tekrar): "):
        print("Parolalar eşleşmiyor.", file=sys.stderr)
        return 1

    with SessionLocal() as db:
        try:
            user = create_admin(db, args.username, password)
        except ValueError as exc:
            print(f"Hata: {exc}", file=sys.stderr)
            return 1
    print(f"Admin oluşturuldu: {user.username} (id={user.id})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
