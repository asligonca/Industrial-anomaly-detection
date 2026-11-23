from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Akıllı Güvenlik API"
    database_url: str = "sqlite:///./app.db"
    jwt_secret_key: str = Field(
        min_length=32, description="JWT imza anahtarı; zorunlu, varsayılanı yok"
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(default=60, ge=1)
    cors_origins: list[str] = ["http://localhost:5173"]

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
