from sqlalchemy import func, select

from app.models import AlarmAction, AnomalyEvent, Camera, User, Zone
from app.models.enums import EventStatus
from app.scripts.seed import EVENT_COUNT, seed


def _counts(db_session) -> dict[str, int]:
    return {
        model.__name__: db_session.scalar(select(func.count()).select_from(model))
        for model in (User, Camera, Zone, AnomalyEvent, AlarmAction)
    }


def test_seed_creates_data(db_session):
    summary = seed(db_session)
    counts = _counts(db_session)
    assert counts["User"] == 2
    assert counts["Camera"] == 3
    assert counts["Zone"] >= 3
    assert counts["AnomalyEvent"] == EVENT_COUNT
    assert summary.events == EVENT_COUNT

    events = db_session.scalars(select(AnomalyEvent)).all()
    assert all(e.model_version and len(e.bbox) == 4 for e in events)
    assert all(0 <= v <= 1 for e in events for v in e.bbox)
    for e in events:
        expected = {EventStatus.new: 0, EventStatus.reviewing: 1}.get(e.status, 2)
        assert len(e.actions) == expected


def test_seed_is_idempotent(db_session):
    seed(db_session)
    first = _counts(db_session)
    summary = seed(db_session)
    assert _counts(db_session) == first
    assert summary.events == 0
    assert summary.skipped


def test_seed_keeps_existing_user(db_session, make_user):
    existing = make_user("admin")
    old_hash = existing.password_hash
    seed(db_session)
    db_session.refresh(existing)
    assert existing.password_hash == old_hash
