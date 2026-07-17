from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from ai_health_checker.services import analysis_service
from tests.conftest import (
    TEST_USER_ID,
    get_reports_ref,
    make_workday_db_data,
    stub_logs_in_period,
)

TEST_REPORT_ID = "test-report-id"


def _stub_analysis_collaborators(
    monkeypatch: pytest.MonkeyPatch, content: str = "分析結果です。"
) -> None:
    monkeypatch.setattr(
        analysis_service.llm_service,
        "generate_analysis_report",
        MagicMock(return_value=content),
    )
    monkeypatch.setattr(analysis_service, "get_user_email", MagicMock(return_value=None))


class TestRunAnalysis:
    def test_should_create_report_and_return_201(
        self, client: TestClient, mock_db: MagicMock, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        mock_log_doc = MagicMock()
        mock_log_doc.to_dict.return_value = make_workday_db_data()
        stub_logs_in_period(mock_db, [mock_log_doc])
        get_reports_ref(mock_db).document.return_value = MagicMock(id=TEST_REPORT_ID)
        _stub_analysis_collaborators(monkeypatch)

        response = client.post(
            "/analysis/run",
            json={"start_date": "2026-06-01", "end_date": "2026-06-30"},
        )

        assert response.status_code == 201
        body = response.json()
        assert body["id"] == TEST_REPORT_ID
        assert body["content"] == "分析結果です。"

    def test_should_create_report_with_selected_focus(
        self, client: TestClient, mock_db: MagicMock, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        mock_log_doc = MagicMock()
        mock_log_doc.to_dict.return_value = make_workday_db_data()
        stub_logs_in_period(mock_db, [mock_log_doc])
        get_reports_ref(mock_db).document.return_value = MagicMock(id=TEST_REPORT_ID)
        _stub_analysis_collaborators(monkeypatch)

        response = client.post(
            "/analysis/run",
            json={
                "start_date": "2026-06-01",
                "end_date": "2026-06-30",
                "focus": "overtime_mood",
            },
        )

        assert response.status_code == 201
        assert response.json()["focus"] == "overtime_mood"

    def test_should_return_422_for_invalid_focus(
        self, client: TestClient, mock_db: MagicMock
    ) -> None:
        response = client.post("/analysis/run", json={"focus": "invalid"})

        assert response.status_code == 422

    def test_should_accept_empty_body_and_use_default_period(
        self, client: TestClient, mock_db: MagicMock, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        mock_log_doc = MagicMock()
        mock_log_doc.to_dict.return_value = make_workday_db_data()
        stub_logs_in_period(mock_db, [mock_log_doc])
        get_reports_ref(mock_db).document.return_value = MagicMock(id=TEST_REPORT_ID)
        _stub_analysis_collaborators(monkeypatch)

        response = client.post("/analysis/run", json={})

        assert response.status_code == 201

    def test_should_return_404_when_no_logs_in_period(
        self, client: TestClient, mock_db: MagicMock, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        stub_logs_in_period(mock_db, [])
        _stub_analysis_collaborators(monkeypatch)

        response = client.post(
            "/analysis/run",
            json={"start_date": "2026-06-01", "end_date": "2026-06-30"},
        )

        assert response.status_code == 404


class TestListReports:
    def test_should_return_reports_for_authenticated_user(
        self, client: TestClient, mock_db: MagicMock
    ) -> None:
        mock_doc = MagicMock()
        mock_doc.to_dict.return_value = {
            "id": TEST_REPORT_ID,
            "user_id": TEST_USER_ID,
            "start_date": "2026-06-01",
            "end_date": "2026-06-30",
            "content": "レポート本文",
            "log_count": 5,
            "created_at": make_workday_db_data()["created_at"],
        }
        get_reports_ref(mock_db).order_by.return_value.stream.return_value = [mock_doc]

        response = client.get("/analysis/reports")

        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["id"] == TEST_REPORT_ID

    def test_should_return_empty_list_when_no_reports(
        self, client: TestClient, mock_db: MagicMock
    ) -> None:
        get_reports_ref(mock_db).order_by.return_value.stream.return_value = []

        response = client.get("/analysis/reports")

        assert response.status_code == 200
        assert response.json() == []


class TestSchedulerRunAnalysis:
    def test_should_return_401_when_scheduler_key_invalid(
        self, client: TestClient, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("SCHEDULER_API_KEY", "correct-secret")

        response = client.post(
            "/analysis/scheduler-run", headers={"X-Scheduler-Key": "wrong-secret"}
        )

        assert response.status_code == 401

    def test_should_return_401_when_scheduler_key_header_missing(
        self, client: TestClient, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("SCHEDULER_API_KEY", "correct-secret")

        response = client.post("/analysis/scheduler-run")

        assert response.status_code == 401

    def test_should_run_analysis_for_all_users_when_scheduler_key_valid(
        self, client: TestClient, mock_db: MagicMock, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("SCHEDULER_API_KEY", "correct-secret")
        mock_db.collection.return_value.stream.return_value = []

        response = client.post(
            "/analysis/scheduler-run", headers={"X-Scheduler-Key": "correct-secret"}
        )

        assert response.status_code == 201
        assert response.json() == []
