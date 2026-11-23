from sqlalchemy import select

from app.models import AnomalyEvent, AuditLog, Camera
from app.models.enums import EVENT_TYPE_SEVERITY, EventType
from tests.conftest import TEST_PASSWORD

ZONE_POLYGON = [[0.1, 0.1], [0.5, 0.1], [0.5, 0.5]]


def _logs(db_session) -> list[AuditLog]:
    return list(db_session.scalars(select(AuditLog).order_by(AuditLog.id)))


def _actions(db_session) -> list[str]:
    return [log.action for log in _logs(db_session)]


def test_login_writes_user_login(anon_client, db_session, make_user):
    user = make_user("ayse")
    response = anon_client.post(
        "/api/auth/login", data={"username": "ayse", "password": TEST_PASSWORD}
    )
    assert response.status_code == 200
    [log] = _logs(db_session)
    assert log.action == "user.login"
    assert (log.user_id, log.target_type, log.target_id) == (user.id, "user", user.id)
    assert log.details == {"label": "ayse"}


def test_failed_login_writes_nothing(anon_client, db_session, make_user):
    make_user("ayse")
    anon_client.post("/api/auth/login", data={"username": "ayse", "password": "yanlis-parola"})
    assert _logs(db_session) == []


def test_create_user_writes_user_created(client, db_session, admin_user):
    response = client.post(
        "/api/users", json={"username": "mehmet", "password": "parola123", "role": "operator"}
    )
    [log] = _logs(db_session)
    assert log.action == "user.created"
    assert (log.user_id, log.target_type, log.target_id) == (
        admin_user.id,
        "user",
        response.json()["id"],
    )
    assert log.details == {"label": "mehmet"}


def test_duplicate_user_writes_nothing(client, db_session, admin_user):
    response = client.post("/api/users", json={"username": "admin", "password": "parola123"})
    assert response.status_code == 409
    assert _logs(db_session) == []


def test_create_camera_writes_camera_created(client, db_session, camera):
    [log] = _logs(db_session)
    assert log.action == "camera.created"
    assert (log.target_type, log.target_id) == ("camera", camera["id"])
    assert log.details == {"label": camera["code"]}


def test_camera_patch_without_real_change_writes_nothing(client, db_session, camera):
    response = client.patch(
        f"/api/cameras/{camera['id']}",
        json={
            "name": camera["name"],
            "stream_url": camera["stream_url"],
            "is_active": True,
        },
    )
    assert response.status_code == 200
    assert _actions(db_session) == ["camera.created"]


def test_camera_rename_writes_camera_updated(client, db_session, camera):
    client.patch(f"/api/cameras/{camera['id']}", json={"name": "Pres Hattı 2"})
    assert _actions(db_session) == ["camera.created", "camera.updated"]
    assert _logs(db_session)[-1].details == {"label": camera["code"]}


def test_camera_deactivate_and_activate(client, db_session, camera):
    client.patch(f"/api/cameras/{camera['id']}", json={"is_active": False})
    client.patch(f"/api/cameras/{camera['id']}", json={"is_active": True})
    assert _actions(db_session) == [
        "camera.created",
        "camera.deactivated",
        "camera.activated",
    ]


def test_camera_deactivate_with_other_change_writes_both(client, db_session, camera):
    client.patch(
        f"/api/cameras/{camera['id']}", json={"is_active": False, "location": "Hol C"}
    )
    assert _actions(db_session) == ["camera.created", "camera.deactivated", "camera.updated"]


def test_zone_create_and_delete(client, db_session, camera):
    response = client.post(
        "/api/zones",
        json={
            "name": "Kırmızı alan",
            "camera_id": camera["id"],
            "rule_type": "restricted",
            "polygon": ZONE_POLYGON,
        },
    )
    zone_id = response.json()["id"]
    client.delete(f"/api/zones/{zone_id}")
    created, deactivated = _logs(db_session)[1:]
    assert (created.action, created.target_type, created.target_id) == (
        "zone.created",
        "zone",
        zone_id,
    )
    assert deactivated.action == "zone.deactivated"
    assert deactivated.details == {"label": "Kırmızı alan"}


def test_status_change_writes_from_to(operator_client, db_session, operator_user):
    camera = Camera(name="Depo", area="Depo", stream_url=None)
    db_session.add(camera)
    db_session.flush()
    event = AnomalyEvent(
        camera_id=camera.id,
        type=EventType.no_vest,
        severity=EVENT_TYPE_SEVERITY[EventType.no_vest],
        confidence=0.8,
        bbox=[0.1, 0.2, 0.3, 0.4],
        model_version="yolo26n-exp1",
    )
    db_session.add(event)
    db_session.commit()
    operator_client.patch(f"/api/events/{event.id}/status", json={"status": "false_alarm"})
    [log] = _logs(db_session)
    assert log.action == "event.status_changed"
    assert (log.user_id, log.target_type, log.target_id) == (operator_user.id, "event", event.id)
    assert log.details == {"label": f"OLY-{event.id:03d}", "from": "new", "to": "false_alarm"}


def test_list_newest_first_with_user(client, db_session, admin_user, camera):
    client.patch(f"/api/cameras/{camera['id']}", json={"is_active": False})
    response = client.get("/api/audit-logs")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert (body["limit"], body["offset"]) == (50, 0)
    newest = body["items"][0]
    assert newest["action"] == "camera.deactivated"
    assert newest["user"] == {"id": admin_user.id, "username": "admin"}
    assert newest["target_type"] == "camera"
    assert newest["target_id"] == camera["id"]
    assert newest["details"] == {"label": camera["code"]}
    assert newest["created_at"].endswith("Z")
    assert body["items"][1]["action"] == "camera.created"


def test_list_pagination(client, db_session, camera):
    client.patch(f"/api/cameras/{camera['id']}", json={"is_active": False})
    response = client.get("/api/audit-logs", params={"limit": 1, "offset": 1})
    body = response.json()
    assert body["total"] == 2
    assert [item["action"] for item in body["items"]] == ["camera.created"]


def test_system_entry_has_null_user(client, db_session):
    db_session.add(AuditLog(action="camera.updated", target_type="camera", target_id=1))
    db_session.commit()
    [item] = client.get("/api/audit-logs").json()["items"]
    assert item["user"] is None
    assert item["details"] == {}


def test_operator_gets_403(operator_client):
    assert operator_client.get("/api/audit-logs").status_code == 403


def test_anonymous_gets_401(anon_client):
    assert anon_client.get("/api/audit-logs").status_code == 401
