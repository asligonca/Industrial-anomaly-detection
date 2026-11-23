from fastapi import APIRouter

from app.api.routes import audit_logs, auth, cameras, events, users, zones

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(events.router)
api_router.include_router(cameras.router)
api_router.include_router(zones.router)
api_router.include_router(users.router)
api_router.include_router(audit_logs.router)
