from app.core.security import verify_password
from app.models import User


def test_create_user_hashes_password(client, db_session):
    response = client.post(
        "/api/users", json={"username": "ayse", "password": "parola123", "role": "admin"}
    )
    assert response.status_code == 201
    body = response.json()
    assert body["username"] == "ayse"
    assert body["role"] == "admin"
    assert body["last_login_at"] is None
    assert body["created_at"].endswith("Z")
    assert "password" not in body
    assert "password_hash" not in body

    stored = db_session.get(User, body["id"])
    assert stored.password_hash != "parola123"
    assert verify_password("parola123", stored.password_hash)


def test_create_user_defaults_to_operator(client):
    response = client.post("/api/users", json={"username": "mehmet", "password": "parola123"})
    assert response.json()["role"] == "operator"


def test_create_user_short_password_returns_422(client):
    response = client.post("/api/users", json={"username": "ali", "password": "kisa"})
    assert response.status_code == 422


def test_create_user_duplicate_returns_409(client):
    body = {"username": "ayse", "password": "parola123"}
    assert client.post("/api/users", json=body).status_code == 201
    assert client.post("/api/users", json=body).status_code == 409


def test_list_users_envelope(client):
    for name in ("a1", "a2", "a3"):
        client.post("/api/users", json={"username": name, "password": "parola123"})
    body = client.get("/api/users", params={"limit": 2, "offset": 1}).json()
    assert body["total"] == 3
    assert body["limit"] == 2
    assert body["offset"] == 1
    assert [u["username"] for u in body["items"]] == ["a2", "a3"]
    assert all("password_hash" not in u for u in body["items"])
