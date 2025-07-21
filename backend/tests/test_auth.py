from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from ..app.main import app
from ..app.database import Base, get_db
import pytest

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(scope="module")
def test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_register_user(test_db):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "Password123!",
            "full_name": "Test User",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data

def test_register_user_duplicate_email(test_db):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "test1@example.com",
            "username": "testuser1",
            "password": "Password123!",
            "full_name": "Test User",
        },
    )
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test1@example.com",
            "username": "testuser2",
            "password": "Password123!",
            "full_name": "Test User",
        },
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

def test_login(test_db):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "login@example.com",
            "username": "loginuser",
            "password": "Password123!",
            "full_name": "Login User",
        },
    )
    response = client.post(
        "/api/v1/auth/token",
        data={"username": "loginuser", "password": "Password123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer" 