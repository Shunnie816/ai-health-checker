from datetime import date, timedelta
from unittest.mock import MagicMock

import pytest

from ai_health_checker.services import analysis_service
from tests.conftest import (
    TEST_USER_ID,
    get_reports_ref,
    make_workday_db_data,
    stub_logs_in_period,
)

TEST_REPORT_ID = "test-report-id"
TEST_EMAIL = "user@example.com"


class TestRunAnalysisForUser:
    def _stub_collaborators(
        self,
        monkeypatch: pytest.MonkeyPatch,
        *,
        content: str = "疲労度と残業時間に相関が見られます。",
        user_email: str | None = TEST_EMAIL,
    ) -> MagicMock:
        monkeypatch.setattr(
            analysis_service.llm_service,
            "generate_analysis_report",
            MagicMock(return_value=content),
        )
        monkeypatch.setattr(
            analysis_service, "get_user_email", MagicMock(return_value=user_email)
        )
        mock_send_email = MagicMock()
        monkeypatch.setattr(analysis_service, "send_report_email", mock_send_email)
        return mock_send_email

    def test_should_create_report_from_logs_in_period(
        self, mock_db: MagicMock, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        mock_log_doc = MagicMock()
        mock_log_doc.to_dict.return_value = make_workday_db_data()
        stub_logs_in_period(mock_db, [mock_log_doc])

        report_doc_ref = MagicMock()
        report_doc_ref.id = TEST_REPORT_ID
        get_reports_ref(mock_db).document.return_value = report_doc_ref

        mock_send_email = self._stub_collaborators(monkeypatch)

        result = analysis_service.run_analysis_for_user(
            mock_db, TEST_USER_ID, "2026-06-01", "2026-06-30"
        )

        assert result.id == TEST_REPORT_ID
        assert result.user_id == TEST_USER_ID
        assert result.start_date == "2026-06-01"
        assert result.end_date == "2026-06-30"
        assert result.content == "疲労度と残業時間に相関が見られます。"
        assert result.log_count == 1
        assert result.focus == "general"
        report_doc_ref.set.assert_called_once()
        mock_send_email.assert_called_once_with(TEST_EMAIL, result)

    def test_should_save_focus_and_pass_it_to_llm(
        self, mock_db: MagicMock, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        mock_log_doc = MagicMock()
        mock_log_doc.to_dict.return_value = make_workday_db_data()
        stub_logs_in_period(mock_db, [mock_log_doc])

        report_doc_ref = MagicMock()
        report_doc_ref.id = TEST_REPORT_ID
        get_reports_ref(mock_db).document.return_value = report_doc_ref

        self._stub_collaborators(monkeypatch)

        result = analysis_service.run_analysis_for_user(
            mock_db, TEST_USER_ID, "2026-06-01", "2026-06-30", focus="gym"
        )

        assert result.focus == "gym"
        llm_call = analysis_service.llm_service.generate_analysis_report.call_args
        assert llm_call.args[2] == "gym"

    def test_should_raise_when_no_logs_in_period(
        self, mock_db: MagicMock, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        stub_logs_in_period(mock_db, [])
        self._stub_collaborators(monkeypatch)

        with pytest.raises(ValueError, match="ログが見つかりません"):
            analysis_service.run_analysis_for_user(
                mock_db, TEST_USER_ID, "2026-06-01", "2026-06-30"
            )

    def test_should_skip_email_when_user_has_no_email(
        self, mock_db: MagicMock, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        mock_log_doc = MagicMock()
        mock_log_doc.to_dict.return_value = make_workday_db_data()
        stub_logs_in_period(mock_db, [mock_log_doc])
        get_reports_ref(mock_db).document.return_value = MagicMock(id=TEST_REPORT_ID)

        mock_send_email = self._stub_collaborators(monkeypatch, user_email=None)

        analysis_service.run_analysis_for_user(
            mock_db, TEST_USER_ID, "2026-06-01", "2026-06-30"
        )

        mock_send_email.assert_not_called()

    def test_should_use_trailing_30_day_period_when_dates_not_provided(
        self, mock_db: MagicMock, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        class _FixedDate(date):
            @classmethod
            def today(cls) -> "date":
                return date(2026, 6, 30)

        monkeypatch.setattr(analysis_service, "date", _FixedDate)

        mock_log_doc = MagicMock()
        mock_log_doc.to_dict.return_value = make_workday_db_data()
        stub_logs_in_period(mock_db, [mock_log_doc])
        get_reports_ref(mock_db).document.return_value = MagicMock(id=TEST_REPORT_ID)
        self._stub_collaborators(monkeypatch)

        result = analysis_service.run_analysis_for_user(mock_db, TEST_USER_ID)

        expected_start = (date(2026, 6, 30) - timedelta(days=30)).isoformat()
        assert result.start_date == expected_start
        assert result.end_date == "2026-06-30"


class TestListReports:
    def test_should_convert_firestore_documents_to_report_list(
        self, mock_db: MagicMock
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

        result = analysis_service.list_reports(mock_db, TEST_USER_ID)

        assert len(result) == 1
        assert result[0].id == TEST_REPORT_ID


class TestRunAnalysisForAllUsers:
    def test_should_skip_users_with_no_logs_and_collect_the_rest(
        self, mock_db: MagicMock, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        user_with_logs = MagicMock(id="user-1")
        user_without_logs = MagicMock(id="user-2")
        mock_db.collection.return_value.stream.return_value = [
            user_with_logs,
            user_without_logs,
        ]

        fake_report = object()

        def fake_run_analysis_for_user(db: MagicMock, user_id: str) -> object:
            if user_id == "user-2":
                raise ValueError("対象期間のログが見つかりません")
            return fake_report

        monkeypatch.setattr(
            analysis_service, "run_analysis_for_user", fake_run_analysis_for_user
        )

        result = analysis_service.run_analysis_for_all_users(mock_db)

        assert result == [fake_report]
