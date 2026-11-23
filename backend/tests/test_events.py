from datetime import UTC, datetime

import pytest
from sqlalchemy import event as sa_event

from app.models import AlarmAction, AnomalyEvent, Camera, Zone
from app.models.enums import (
    EVENT_TYPE_SEVERITY,
    EventStatus,
    EventType,
    ZoneRuleType,
)


def _at(text: str) -> datetime:
    return datetime.fromisoformat(text).astimezone(UTC)


@pytest.fixture
def data(db_session, operator_user):
    """İki kamera, bir bölge, dört olay ve bir durum kaydı.

    e2 UTC 20 Kasım 21:30'da: İstanbul saatiyle 21 Kasım 00:30 (gün sınırı testi).
    """
    c1 = Camera(name="Üretim Hattı A", area="Üretim", stream_url=None)
    c2 = Camera(name="İç Depo", area="Depo", stream_url=None)
    db_session.add_all([c1, c2])
    db_session.flush()
    z1 = Zone(
        camera_id=c1.id,
        name="KKD alanı",
        rule_type=ZoneRuleType.ppe_helmet_vest,
        polygon=[[0.1, 0.1], [0.5, 0.1], [0.5, 0.5]],
    )
    db_session.add(z1)
    db_session.flush()

    def make(camera, zone, event_type, status, confidence, created_at):
        return AnomalyEvent(
            camera_id=camera.id,
            zone_id=zone.id if zone else None,
            type=event_type,
            severity=EVENT_TYPE_SEVERITY[event_type],
            confidence=confidence,
            bbox=[0.1, 0.2, 0.3, 0.4],
            track_id=7,
            model_version="yolo26n-exp1",
            status=status,
            created_at=_at(created_at),
        )

    events = [
        make(c1, z1, EventType.no_helmet, EventStatus.new, 0.9, "2026-11-20T09:00:00+00:00"),
        make(c1, None, EventType.restricted_zone, EventStatus.reviewing, 0.7, "2026-11-20T21:30:00+00:00"),
        make(c2, None, EventType.no_vest, EventStatus.confirmed, 0.8, "2026-11-21T12:00:00+00:00"),
        make(c2, None, EventType.no_helmet, EventStatus.false_alarm, 0.95, "2026-11-22T06:00:00+00:00"),
    ]
    db_session.add_all(events)
    db_session.flush()
    db_session.add(
        AlarmAction(
            event_id=events[1].id,
            user_id=operator_user.id,
            from_status=EventStatus.new,
            to_status=EventStatus.reviewing,
            note="Bakılıyor",
            created_at=_at("2026-11-20T21:32:00+00:00"),
        )
    )
    db_session.commit()
    return {"c1": c1, "c2": c2, "z1": z1, "e": events}


def _ids(response) -> list[int]:
    assert response.status_code == 200, response.text
    return [item["id"] for item in response.json()["items"]]


def test_list_default_sort_and_shape(client, data):
    response = client.get("/api/events")
    e = data["e"]
    assert _ids(response) == [e[3].id, e[2].id, e[1].id, e[0].id]
    body = response.json()
    assert body["total"] == 4
    assert body["limit"] == 50
    assert body["offset"] == 0

    item = next(i for i in body["items"] if i["id"] == e[0].id)
    assert item["code"] == f"OLY-{e[0].id:03d}"
    assert item["camera"] == {"id": data["c1"].id, "name": "Üretim Hattı A", "area": "Üretim"}
    assert item["zone"] == {"id": data["z1"].id, "name": "KKD alanı"}
    assert item["bbox"] == [0.1, 0.2, 0.3, 0.4]
    assert item["model_version"] == "yolo26n-exp1"
    assert item["track_id"] == 7
    assert item["severity"] == "high"
    assert item["snapshot_url"] is None
    assert item["created_at"] == "2026-11-20T09:00:00Z"
    assert "snapshot_path" not in item


def test_snapshot_url_when_image_exists(client, db_session, data):
    event = data["e"][0]
    event.snapshot_path = "media/snapshots/1.jpg"
    db_session.commit()
    item = client.get(f"/api/events/{event.id}").json()
    assert item["snapshot_url"] == f"/api/events/{event.id}/snapshot"


def test_pagination(client, data):
    e = data["e"]
    body = client.get("/api/events", params={"limit": 2, "offset": 1}).json()
    assert body["total"] == 4
    assert [i["id"] for i in body["items"]] == [e[2].id, e[1].id]


def test_filter_status_multi(client, data):
    e = data["e"]
    response = client.get("/api/events", params=[("status", "new"), ("status", "reviewing")])
    assert sorted(_ids(response)) == sorted([e[0].id, e[1].id])
    assert response.json()["total"] == 2


def test_filter_type_multi_and_severity(client, data):
    e = data["e"]
    response = client.get("/api/events", params=[("type", "no_helmet"), ("type", "no_vest")])
    assert sorted(_ids(response)) == sorted([e[0].id, e[2].id, e[3].id])
    response = client.get("/api/events", params=[("severity", "critical"), ("severity", "medium")])
    assert sorted(_ids(response)) == sorted([e[1].id, e[2].id])


def test_unknown_type_returns_empty_not_422(client, data):
    response = client.get("/api/events", params=[("type", "unregistered_visitor")])
    assert _ids(response) == []
    assert response.json()["total"] == 0
    mixed = client.get("/api/events", params=[("type", "smoke_detected"), ("type", "no_vest")])
    assert _ids(mixed) == [data["e"][2].id]


def test_invalid_status_returns_422(client, data):
    assert client.get("/api/events", params={"status": "kapali"}).status_code == 422


def test_filter_camera_zone_area(client, data):
    e, c1, c2 = data["e"], data["c1"], data["c2"]
    both = client.get("/api/events", params=[("camera_id", c1.id), ("camera_id", c2.id)])
    assert len(_ids(both)) == 4
    assert sorted(_ids(client.get("/api/events", params={"camera_id": c2.id}))) == sorted([e[2].id, e[3].id])
    assert _ids(client.get("/api/events", params={"zone_id": data["z1"].id})) == [e[0].id]
    assert sorted(_ids(client.get("/api/events", params={"area": "Üretim"}))) == sorted([e[0].id, e[1].id])


@pytest.mark.parametrize("query", ["OLY-002", "oly-2", "2", "002"])
def test_q_event_code(client, data, query):
    target = data["e"][1]
    assert target.id == 2
    assert _ids(client.get("/api/events", params={"q": query})) == [target.id]


def test_q_camera_code_and_name(client, data):
    e, c2 = data["e"], data["c2"]
    expected = sorted([e[2].id, e[3].id])
    assert sorted(_ids(client.get("/api/events", params={"q": f"KAM-{c2.id:02d}"}))) == expected
    assert sorted(_ids(client.get("/api/events", params={"q": "iç depo"}))) == expected
    assert sorted(_ids(client.get("/api/events", params={"q": "ÜRETİM"}))) == sorted([e[0].id, e[1].id])
    assert _ids(client.get("/api/events", params={"q": "olmayan"})) == []


def test_date_range_converts_timezone_and_includes_to(client, data):
    e = data["e"]
    response = client.get(
        "/api/events",
        params={"from": "2026-11-21T00:00:00+03:00", "to": "2026-11-21T15:00:00+03:00"},
    )
    assert sorted(_ids(response)) == sorted([e[1].id, e[2].id])


def test_date_range_validation(client, data):
    naive = client.get("/api/events", params={"from": "2026-11-21T00:00:00"})
    assert naive.status_code == 422
    reversed_range = client.get(
        "/api/events", params={"from": "2026-11-22T00:00:00Z", "to": "2026-11-21T00:00:00Z"}
    )
    assert reversed_range.status_code == 422
    assert reversed_range.json()["detail"][0]["loc"] == ["query", "from"]


def test_sort_options(client, data):
    e = data["e"]
    by_severity = client.get("/api/events", params={"sort": "-severity"})
    assert _ids(by_severity) == [e[1].id, e[3].id, e[0].id, e[2].id]
    by_confidence = client.get("/api/events", params={"sort": "confidence"})
    assert _ids(by_confidence) == [e[1].id, e[2].id, e[0].id, e[3].id]
    oldest_first = client.get("/api/events", params={"sort": "created_at"})
    assert _ids(oldest_first) == [e[0].id, e[1].id, e[2].id, e[3].id]
    assert client.get("/api/events", params={"sort": "id"}).status_code == 422


def test_list_has_no_n_plus_one(client, db_session, data):
    statements: list[str] = []
    engine = db_session.get_bind()

    def count(conn, cursor, statement, *args):
        statements.append(statement)

    sa_event.listen(engine, "before_cursor_execute", count)
    try:
        assert client.get("/api/events").status_code == 200
    finally:
        sa_event.remove(engine, "before_cursor_execute", count)
    assert len(statements) <= 5


def test_detail_with_actions(client, data, operator_user):
    target = data["e"][1]
    response = client.get(f"/api/events/{target.id}")
    assert response.status_code == 200
    body = response.json()
    assert body["code"] == "OLY-002"
    assert body["zone"] is None
    assert body["actions"] == [
        {
            "id": 1,
            "event_id": target.id,
            "from_status": "new",
            "to_status": "reviewing",
            "note": "Bakılıyor",
            "user": {"id": operator_user.id, "username": "operator"},
            "created_at": "2026-11-20T21:32:00Z",
        }
    ]
    assert client.get(f"/api/events/{data['e'][0].id}").json()["actions"] == []


def test_detail_missing_returns_404(client):
    assert client.get("/api/events/999").status_code == 404


@pytest.mark.parametrize("path", ["/api/events", "/api/events/1", "/api/events/stats"])
def test_events_require_login(anon_client, path):
    assert anon_client.get(path).status_code == 401


def test_operator_can_read_events(operator_client, data):
    assert operator_client.get("/api/events").status_code == 200
    assert operator_client.get("/api/events/stats").status_code == 200


def test_stats_groups_by_istanbul_time(client, data):
    c1, c2 = data["c1"], data["c2"]
    body = client.get("/api/events/stats").json()

    assert len(body["by_hour"]) == 24
    assert [h["hour"] for h in body["by_hour"]] == list(range(24))
    hours = {h["hour"]: h["count"] for h in body["by_hour"]}
    assert hours[0] == 1
    assert hours[12] == 1
    assert hours[15] == 1
    assert hours[9] == 1
    assert sum(hours.values()) == 4

    assert body["by_day"] == [
        {"date": "2026-11-20", "count": 1},
        {"date": "2026-11-21", "count": 2},
        {"date": "2026-11-22", "count": 1},
    ]
    assert body["by_type"][0] == {"type": "no_helmet", "count": 2}
    assert body["by_camera"] == [
        {"camera_id": c1.id, "count": 2},
        {"camera_id": c2.id, "count": 2},
    ]


def test_stats_empty_still_has_24_hours(client):
    body = client.get("/api/events/stats").json()
    assert body["by_hour"] == [{"hour": h, "count": 0} for h in range(24)]
    assert body["by_type"] == []
    assert body["by_day"] == []


def test_stats_accepts_same_filters(client, data):
    c2 = data["c2"]
    body = client.get("/api/events/stats", params={"camera_id": c2.id}).json()
    assert body["by_camera"] == [{"camera_id": c2.id, "count": 2}]
    ranged = client.get(
        "/api/events/stats", params={"from": "2026-11-22T00:00:00+03:00"}
    ).json()
    assert sum(h["count"] for h in ranged["by_hour"]) == 1
    assert client.get("/api/events/stats", params={"from": "dün"}).status_code == 422
