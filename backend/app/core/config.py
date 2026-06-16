import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

# Resolve the absolute path to the .env file in the backend folder
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(os.path.dirname(current_dir))  # parent of app directory
env_path = os.path.join(backend_dir, ".env")

class Settings(BaseSettings):
    PORT: int = 8000
    DEBUG: bool = True
    
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    
    TIMEZONE: str = "Asia/Kathmandu"

    model_config = SettingsConfigDict(
        env_file=env_path,
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

