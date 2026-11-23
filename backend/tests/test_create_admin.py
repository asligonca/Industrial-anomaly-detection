import pytest

from app.core.security import verify_password
from app.models.enums import UserRole
from app.scripts.create_admin import create_admin


def test_create_admin_creates_admin(db_session):
    user = create_admin(db_session, "kurucu", "guclu-parola")
    assert user.role == UserRole.admin
    assert verify_password("guclu-parola", user.password_hash)


def test_create_admin_rejects_short_password(db_session):
    with pytest.raises(ValueError):
        create_admin(db_session, "kurucu", "kisa")


def test_create_admin_does_not_overwrite_existing(db_session, make_user):
    existing = make_user("kurucu")
    old_hash = existing.password_hash
    with pytest.raises(ValueError, match="zaten var"):
        create_admin(db_session, "kurucu", "baska-parola")
    db_session.refresh(existing)
    assert existing.password_hash == old_hash
    assert existing.role == UserRole.operator
