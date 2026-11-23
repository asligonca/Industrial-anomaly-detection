from app.models import Zone

SQUARE = [[0.1, 0.1], [0.5, 0.1], [0.5, 0.5], [0.1, 0.5]]


def _zone_body(camera_id: int, **overrides) -> dict:
    body = {"camera_id": camera_id, "name": "Kırmızı alan", "rule_type": "restricted", "polygon": SQUARE}
    body.update(overrides)
    return body


def test_create_zone(client, camera):
    response = client.post("/api/zones", json=_zone_body(camera["id"]))
    assert response.status_code == 201
    body = response.json()
    assert body["polygon"] == SQUARE
    assert body["is_active"] is True
    assert body["camera_id"] == camera["id"]


def test_create_zone_unknown_camera_returns_422(client):
    response = client.post("/api/zones", json=_zone_body(999))
    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["body", "camera_id"]


def test_create_zone_validates_polygon(client, camera):
    too_few = _zone_body(camera["id"], polygon=[[0.1, 0.1], [0.2, 0.2]])
    out_of_range = _zone_body(camera["id"], polygon=[[0.1, 0.1], [1.5, 0.1], [0.5, 0.5]])
    bad_point = _zone_body(camera["id"], polygon=[[0.1], [0.2, 0.2], [0.3, 0.3]])
    missing = _zone_body(camera["id"])
    del missing["polygon"]
    for body in (too_few, out_of_range, bad_point, missing):
        assert client.post("/api/zones", json=body).status_code == 422


def test_create_zone_rejects_unknown_rule_type(client, camera):
    response = client.post("/api/zones", json=_zone_body(camera["id"], rule_type="bilinmeyen"))
    assert response.status_code == 422


def test_delete_zone_soft_deletes_and_hides_from_list(client, db_session, camera):
    first = client.post("/api/zones", json=_zone_body(camera["id"])).json()
    client.post("/api/zones", json=_zone_body(camera["id"], name="Forklift yolu"))

    response = client.delete(f"/api/zones/{first['id']}")
    assert response.status_code == 204
    assert response.content == b""

    stored = db_session.get(Zone, first["id"])
    assert stored is not None
    assert stored.is_active is False

    body = client.get("/api/zones").json()
    assert body["total"] == 1
    assert [z["name"] for z in body["items"]] == ["Forklift yolu"]
    assert body["limit"] == 50
    assert body["offset"] == 0


def test_delete_zone_twice_returns_404(client, camera):
    zone = client.post("/api/zones", json=_zone_body(camera["id"])).json()
    assert client.delete(f"/api/zones/{zone['id']}").status_code == 204
    assert client.delete(f"/api/zones/{zone['id']}").status_code == 404


def test_delete_missing_zone_returns_404(client):
    assert client.delete("/api/zones/999").status_code == 404
