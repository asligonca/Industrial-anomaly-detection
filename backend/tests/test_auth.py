from datetime import timedelta

import jwt
import pytest

from app.core.config import settings
from app.core.security import create_access_token
from app.models.enums import UserRole
from tests.conftest import TEST_PASSWORD


def _login(client, username: str, password: str):
    return client.post("/api/auth/login", data={"username": username, "password": password})


def test_login_success_returns_token_and_updates_last_login(anon_client, db_session, admin_user):
    assert admin_user.last_login_at is None

    response = _login(anon_client, "admin", TEST_PASSWORD)

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["user"] == {"id": admin_user.id, "username": "admin", "role": "admin"}

    claims = jwt.decode(body["access_token"], settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    assert claims["sub"] == str(admin_user.id)
    assert claims["role"] == "admin"

    db_session.refresh(admin_user)
    assert admin_user.last_login_at is not None


def test_login_token_works_on_protected_endpoint(anon_client, admin_user):
    token = _login(anon_client, "admin", TEST_PASSWORD).json()["access_token"]
    response = anon_client.get("/api/cameras", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200


@pytest.mark.parametrize(
    ("username", "password"),
    [("admin", "yanlis-parola"), ("olmayan", TEST_PASSWORD)],
)
def test_login_wrong_credentials_returns_401(anon_client, admin_user, username, password):
    response = _login(anon_client, username, password)
    assert response.status_code == 401
    assert response.json()["detail"] == "Kullanıcı adı ya da parola hatalı"


def test_login_inactive_user_returns_401(anon_client, make_user):
    make_user("pasif", is_active=False)
    assert _login(anon_client, "pasif", TEST_PASSWORD).status_code == 401


def test_login_requires_form_encoding(anon_client, admin_user):
    response = anon_client.post("/api/auth/login", json={"username": "admin", "password": TEST_PASSWORD})
    assert response.status_code == 422


@pytest.mark.parametrize("path", ["/api/cameras", "/api/zones", "/api/users"])
def test_no_token_returns_401(anon_client, path):
    response = anon_client.get(path)
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_expired_token_returns_401(anon_client, admin_user):
    token = create_access_token(admin_user, expires_delta=timedelta(seconds=-1))
    response = anon_client.get("/api/cameras", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


def test_tampered_token_returns_401(anon_client, admin_user):
    forged = jwt.encode(
        {"sub": str(admin_user.id), "role": "admin", "exp": 9999999999},
        "baska-bir-anahtar-otuz-iki-karakterden-uzun",
        algorithm="HS256",
    )
    response = anon_client.get("/api/cameras", headers={"Authorization": f"Bearer {forged}"})
    assert response.status_code == 401


def test_garbage_token_returns_401(anon_client):
    response = anon_client.get("/api/cameras", headers={"Authorization": "Bearer abc.def.ghi"})
    assert response.status_code == 401


def test_token_of_deactivated_user_returns_401(anon_client, db_session, operator_user):
    token = create_access_token(operator_user)
    operator_user.is_active = False
    db_session.commit()
    response = anon_client.get("/api/cameras", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


def test_role_is_read_from_db_not_token(anon_client, db_session, admin_user):
    token = create_access_token(admin_user)
    admin_user.role = UserRole.operator
    db_session.commit()
    response = anon_client.post(
        "/api/cameras",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "K", "area": "Depo", "stream_url": "v.mp4"},
    )
    assert response.status_code == 403


def test_operator_can_list(operator_client):
    assert operator_client.get("/api/cameras").status_code == 200
    assert operator_client.get("/api/zones").status_code == 200


def test_operator_writes_return_403(operator_client, camera):
    requests = [
        ("post", "/api/cameras", {"json": {"name": "K", "area": "Depo", "stream_url": "v.mp4"}}),
        ("patch", f"/api/cameras/{camera['id']}", {"json": {"name": "X"}}),
        (
            "post",
            "/api/zones",
            {"json": {"camera_id": camera["id"], "name": "Z", "rule_type": "restricted",
                      "polygon": [[0.1, 0.1], [0.5, 0.1], [0.5, 0.5]]}},
        ),
        ("delete", "/api/zones/1", {}),
        ("get", "/api/users", {}),
        ("post", "/api/users", {"json": {"username": "yeni", "password": "parola123"}}),
    ]
    for method, path, kwargs in requests:
        response = getattr(operator_client, method)(path, **kwargs)
        assert response.status_code == 403, (method, path)


def test_cors_allows_only_frontend_origin(anon_client):
    allowed = anon_client.options(
        "/api/auth/login",
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"},
    )
    assert allowed.headers.get("access-control-allow-origin") == "http://localhost:5173"

    denied = anon_client.options(
        "/api/auth/login",
        headers={"Origin": "http://evil.example", "Access-Control-Request-Method": "POST"},
    )
    assert "access-control-allow-origin" not in denied.headers
