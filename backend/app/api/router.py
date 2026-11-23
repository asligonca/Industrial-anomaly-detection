from fastapi import APIRouter

from app.api.routes import auth, cameras, users, zones

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(cameras.router)
api_router.include_router(zones.router)
api_router.include_router(users.router)
