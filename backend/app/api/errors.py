from typing import Any

from fastapi import HTTPException, status

UNAUTHORIZED_RESPONSE: dict[int | str, dict[str, Any]] = {
    401: {"description": "Giriş yapılmamış ya da token geçersiz/süresi dolmuş"}
}
FORBIDDEN_RESPONSE: dict[int | str, dict[str, Any]] = {
    403: {"description": "Yalnızca admin"}
}


def body_field_error(field: str, message: str, error_type: str, value: Any) -> HTTPException:
    """FastAPI doğrulama hatasıyla aynı biçimde tek alanlık 422 üretir."""
    return HTTPException(
        status.HTTP_422_UNPROCESSABLE_CONTENT,
        [{"type": error_type, "loc": ["body", field], "msg": message, "input": value}],
    )
