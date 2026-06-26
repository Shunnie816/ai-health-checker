from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from google.cloud.firestore import Client

from ai_health_checker.dependencies import get_current_user_id, get_db
from ai_health_checker.main import app

TEST_USER_ID = "test-user-id"
TEST_LOG_ID = "test-log-id"
FIXED_NOW = datetime(2026, 6, 26, 0, 0, 0, tzinfo=timezone.utc)


def make_workday_db_data(**overrides: object) -> dict:  # type: ignore[type-arg]
    base: dict = {  # type: ignore[type-arg]
        "id": TEST_LOG_ID,
        "user_id": TEST_USER_ID,
        "date": "2026-06-26",
        "is_holiday": False,
        "mood_morning": 3,
        "mood_after_work": 2,
        "fatigue": 2,
        "work_start": "09:00",
        "work_end": "18:00",
        "overtime_minutes": 0,
        "overtime_score": 0,
        "gym": False,
        "sleep_hours": None,
        "weight": None,
        "comment": None,
        "work_content": None,
        "created_at": FIXED_NOW,
        "updated_at": FIXED_NOW,
    }
    return {**base, **overrides}


@pytest.fixture
def mock_db() -> MagicMock:
    return MagicMock(spec=Client)


@pytest.fixture
def client(mock_db: MagicMock) -> TestClient:
    app.dependency_overrides[get_current_user_id] = lambda: TEST_USER_ID
    app.dependency_overrides[get_db] = lambda: mock_db
    yield TestClient(app)  # type: ignore[misc]
    app.dependency_overrides.clear()


def get_logs_ref(mock_db: MagicMock) -> MagicMock:
    """mock_db から logs コレクション参照を返すヘルパー"""
    return mock_db.collection.return_value.document.return_value.collection.return_value
