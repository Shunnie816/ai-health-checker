from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from ai_health_checker.services import reminder_service


class TestRunRemindersRouter:
    def test_should_return_401_when_scheduler_key_invalid(
        self, client: TestClient, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("SCHEDULER_API_KEY", "correct-secret")

        response = client.post(
            "/reminders/run", headers={"X-Scheduler-Key": "wrong-secret"}
        )

        assert response.status_code == 401

    def test_should_return_401_when_scheduler_key_header_missing(
        self, client: TestClient, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("SCHEDULER_API_KEY", "correct-secret")

        response = client.post("/reminders/run")

        assert response.status_code == 401

    def test_should_run_reminders_when_scheduler_key_valid(
        self, client: TestClient, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("SCHEDULER_API_KEY", "correct-secret")
        monkeypatch.setattr(
            reminder_service, "run_reminders", MagicMock(return_value=["user-1"])
        )

        response = client.post(
            "/reminders/run", headers={"X-Scheduler-Key": "correct-secret"}
        )

        assert response.status_code == 200
        assert response.json() == {"reminded_user_ids": ["user-1"]}
