from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Agent Governance Gateway"
    environment: str = "development"
    demo_seed_enabled: bool = True
    database_url: str = "sqlite:///./agent_governance_gateway.db"
    jwt_secret: str = Field(default="dev-only-change-me", min_length=16)
    jwt_algorithm: str = "HS256"
    token_expiry_minutes_default: int = 60
    policy_version: str = "2026.05.25"
    redact_full_name: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
