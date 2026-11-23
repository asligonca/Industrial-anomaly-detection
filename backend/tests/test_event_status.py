import pytest
from sqlalchemy import func, select

from app.models import AlarmAction, AnomalyEvent, AuditLog, Camera
from app.models.enums import EVENT_TYPE_SEVERITY, EventStatus, EventType

S = EventStatus

ALLOWED = [
    (S.new, S.reviewing),
    (S.new, S.confirmed),
    (S.new, S.false_alarm),
    (S.reviewing, S.new),
    (S.reviewing, S.confirmed),
    (S.reviewing, S.false_alarm),
    (S.confirmed, S.reviewing),
    (S.false_alarm, S.reviewing),
]
FORBIDDEN = [
    (S.new, S.new),
    (S.reviewing, S.reviewing),
    (S.confirmed, S.confirmed),
    (S.confirmed, S.new),
    (S.confirmed, S.false_alarm),
    (S.false_alarm, S.false_alarm),
    (S.false_alarm, S.new),
    (S.false_alarm, S.confirmed),
]


@pytest.fixture
def make_event(db_session):
    """Verilen durumda tek bir olay ekler."""
    camera = Camera(name="Pres Hattı", area="Üretim", stream_url=None)
    db_session.add(camera)
    db_session.flush()

    def _make(status: EventStatus = EventStatus.new) -> AnomalyEvent:
        event = AnomalyEvent(
            camera_id=camera.id,
            type=EventType.no_helmet,
            severity=EVENT_TYPE_SEVERITY[EventType.no_helmet],
            confidence=0.9,
            bbox=[0.1, 0.2, 0.3, 0.4],
            model_version="yolo26n-exp1",
            status=status,
        )
        db_session.add(event)
        db_session.commit()
        return event

    return _make


def _count(db_session, model) -> int:
    return db_session.scalar(select(func.count()).select_from(model))


@pytest.mark.parametrize(("from_status", "to_status"), ALLOWED)
def test_allowed_transition(client, db_session, make_event, admin_user, from_status, to_status):
    event = make_event(from_status)
    response = client.patch(f"/api/events/{event.id}/status", json={"status": to_status})
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == to_status
    assert body["code"] == f"OLY-{event.id:03d}"
    assert len(body["actions"]) == 1
    action = body["actions"][0]
    assert action["from_status"] == from_status
    assert action["to_status"] == to_status
    assert action["note"] is None
    assert action["user"] == {"id": admin_user.id, "username": "admin"}
    db_session.refresh(event)
    assert event.status == to_status


@pytest.mark.parametrize(("from_status", "to_status"), FORBIDDEN)
def test_forbidden_transition_returns_409(client, db_session, make_event, from_status, to_status):
    event = make_event(from_status)
    response = client.patch(f"/api/events/{event.id}/status", json={"status": to_status})
    assert response.status_code == 409
    db_session.refresh(event)
    assert event.status == from_status
    assert _count(db_session, AlarmAction) == 0
    assert _count(db_session, AuditLog) == 0


def test_note_is_trimmed_and_saved(client, make_event):
    event = make_event()
    response = client.patch(
        f"/api/events/{event.id}/status",
        json={"status": "confirmed", "note": "  Baret takıldı, uyarıldı  "},
    )
    assert response.status_code == 200
    assert response.json()["actions"][0]["note"] == "Baret takıldı, uyarıldı"


def test_blank_note_becomes_null(client, make_event):
    event = make_event()
    response = client.patch(
        f"/api/events/{event.id}/status", json={"status": "reviewing", "note": "   "}
    )
    assert response.status_code == 200
    assert response.json()["actions"][0]["note"] is None


def test_note_longer_than_500_returns_422(client, make_event):
    event = make_event()
    response = client.patch(
        f"/api/events/{event.id}/status", json={"status": "reviewing", "note": "x" * 501}
    )
    assert response.status_code == 422


def test_unknown_status_returns_422(client, make_event):
    event = make_event()
    response = client.patch(f"/api/events/{event.id}/status", json={"status": "closed"})
    assert response.status_code == 422


def test_missing_event_returns_404(client):
    response = client.patch("/api/events/999/status", json={"status": "reviewing"})
    assert response.status_code == 404


def test_operator_can_change_status(operator_client, make_event, operator_user):
    event = make_event()
    response = operator_client.patch(
        f"/api/events/{event.id}/status", json={"status": "reviewing", "note": "Üstlendim"}
    )
    assert response.status_code == 200
    action = response.json()["actions"][0]
    assert action["user"] == {"id": operator_user.id, "username": "operator"}
    assert action["note"] == "Üstlendim"


def test_history_accumulates_oldest_first(client, make_event):
    event = make_event()
    client.patch(f"/api/events/{event.id}/status", json={"status": "reviewing"})
    response = client.patch(f"/api/events/{event.id}/status", json={"status": "confirmed"})
    steps = [(a["from_status"], a["to_status"]) for a in response.json()["actions"]]
    assert steps == [("new", "reviewing"), ("reviewing", "confirmed")]


def test_change_status_requires_login(anon_client, make_event):
    event = make_event()
    response = anon_client.patch(f"/api/events/{event.id}/status", json={"status": "reviewing"})
    assert response.status_code == 401
