from app.models import Camera
from app.schemas.camera import mask_stream_url


def test_create_camera_returns_code_and_masked_url(camera):
    assert camera["code"] == f"KAM-{camera['id']:02d}"
    assert camera["stream_url"] == "rtsp://admin:***@10.0.1.11/stream"
    assert camera["is_active"] is True
    assert camera["created_at"].endswith("Z")


def test_create_camera_requires_fields(client):
    response = client.post("/api/cameras", json={"name": "Eksik"})
    assert response.status_code == 422


def test_create_camera_rejects_long_area(client):
    response = client.post(
        "/api/cameras", json={"name": "K", "area": "x" * 51, "stream_url": "video.mp4"}
    )
    assert response.status_code == 422


def test_list_cameras_envelope(client, camera):
    client.post("/api/cameras", json={"name": "Depo", "area": "Depo", "stream_url": "depo.mp4"})
    response = client.get("/api/cameras", params={"limit": 1})
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert body["limit"] == 1
    assert body["offset"] == 0
    assert len(body["items"]) == 1
    assert body["items"][0]["stream_url"] == "rtsp://admin:***@10.0.1.11/stream"


def test_list_cameras_limit_bounds(client):
    assert client.get("/api/cameras", params={"limit": 201}).status_code == 422
    assert client.get("/api/cameras", params={"offset": -1}).status_code == 422


def test_patch_without_stream_url_keeps_old(client, db_session, camera):
    response = client.patch(f"/api/cameras/{camera['id']}", json={"name": "Yeni Ad"})
    assert response.status_code == 200
    assert response.json()["name"] == "Yeni Ad"
    stored = db_session.get(Camera, camera["id"])
    assert stored.stream_url == "rtsp://admin:gizli123@10.0.1.11/stream"


def test_patch_with_masked_stream_url_keeps_old(client, db_session, camera):
    response = client.patch(
        f"/api/cameras/{camera['id']}", json={"stream_url": camera["stream_url"]}
    )
    assert response.status_code == 200
    stored = db_session.get(Camera, camera["id"])
    assert stored.stream_url == "rtsp://admin:gizli123@10.0.1.11/stream"


def test_patch_with_new_stream_url_replaces(client, db_session, camera):
    response = client.patch(
        f"/api/cameras/{camera['id']}", json={"stream_url": "rtsp://op:yeni@10.0.1.12/s"}
    )
    assert response.json()["stream_url"] == "rtsp://op:***@10.0.1.12/s"
    stored = db_session.get(Camera, camera["id"])
    assert stored.stream_url == "rtsp://op:yeni@10.0.1.12/s"


def test_patch_deactivate(client, camera):
    response = client.patch(f"/api/cameras/{camera['id']}", json={"is_active": False})
    assert response.json()["is_active"] is False


def test_patch_rejects_null_for_required_field(client, camera):
    response = client.patch(f"/api/cameras/{camera['id']}", json={"name": None})
    assert response.status_code == 422


def test_patch_missing_camera_returns_404(client):
    assert client.patch("/api/cameras/999", json={"name": "X"}).status_code == 404


def test_mask_stream_url_cases():
    assert mask_stream_url(None) is None
    assert mask_stream_url("videos/pres.mp4") == "videos/pres.mp4"
    assert mask_stream_url("rtsp://10.0.1.11/stream") == "rtsp://10.0.1.11/stream"
    assert mask_stream_url("rtsp://u:p@h:554/s?x=1") == "rtsp://u:***@h:554/s?x=1"
