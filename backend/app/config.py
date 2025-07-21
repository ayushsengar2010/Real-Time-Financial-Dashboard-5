import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database - Using SQLite for easier setup
    database_url: str = "sqlite:///./financial_dashboard.db"
    test_database_url: str = "sqlite:///./test_financial_dashboard.db"
    
    # JWT
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # OAuth
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    github_client_id: Optional[str] = None
    github_client_secret: Optional[str] = None
    
    # AI APIs
    openai_api_key: Optional[str] = None
    huggingface_api_key: Optional[str] = None
    
    # Financial APIs
    alpha_vantage_api_key: Optional[str] = None
    finnhub_api_key: Optional[str] = None
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    class Config:
        env_file = ".env"

settings = Settings() 