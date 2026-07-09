from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest

from ai_health_checker.models.analysis import AnalysisReportInDB
from ai_health_checker.services import email_service

TEST_USER_ID = "test-user-id"
TEST_EMAIL = "user@example.com"


def make_report(**overrides: object) -> AnalysisReportInDB:
    base: dict = {  # type: ignore[type-arg]
        "id": "report-id",
        "user_id": TEST_USER_ID,
        "start_date": "2026-06-01",
        "end_date": "2026-06-30",
        "content": "疲労度と残業時間に相関が見られます。",
        "log_count": 20,
        "created_at": datetime(2026, 6, 30, tzinfo=timezone.utc),
    }
    return AnalysisReportInDB(**{**base, **overrides})


class TestSendReportEmail:
    def test_should_skip_sending_when_smtp_host_not_configured(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.delenv("SMTP_HOST", raising=False)
        mock_smtp_class = MagicMock()
        monkeypatch.setattr(email_service.smtplib, "SMTP", mock_smtp_class)

        email_service.send_report_email(TEST_EMAIL, make_report())

        mock_smtp_class.assert_not_called()

    def test_should_send_email_with_report_content_when_smtp_configured(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
        monkeypatch.setenv("SMTP_PORT", "587")
        monkeypatch.setenv("SMTP_USER", "smtp-user")
        monkeypatch.setenv("SMTP_PASSWORD", "smtp-password")
        monkeypatch.setenv("EMAIL_FROM", "noreply@example.com")

        mock_server = MagicMock()
        mock_smtp_class = MagicMock()
        mock_smtp_class.return_value.__enter__.return_value = mock_server
        monkeypatch.setattr(email_service.smtplib, "SMTP", mock_smtp_class)

        report = make_report()
        email_service.send_report_email(TEST_EMAIL, report)

        mock_smtp_class.assert_called_once_with("smtp.example.com", 587)
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once_with("smtp-user", "smtp-password")
        sent_message = mock_server.send_message.call_args[0][0]
        assert sent_message["To"] == TEST_EMAIL
        assert sent_message["From"] == "noreply@example.com"
        assert report.content in sent_message.get_content()

    def test_should_not_login_when_smtp_credentials_not_configured(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
        monkeypatch.delenv("SMTP_USER", raising=False)
        monkeypatch.delenv("SMTP_PASSWORD", raising=False)

        mock_server = MagicMock()
        mock_smtp_class = MagicMock()
        mock_smtp_class.return_value.__enter__.return_value = mock_server
        monkeypatch.setattr(email_service.smtplib, "SMTP", mock_smtp_class)

        email_service.send_report_email(TEST_EMAIL, make_report())

        mock_server.login.assert_not_called()


class TestSendReminderEmail:
    def test_should_skip_sending_when_smtp_host_not_configured(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.delenv("SMTP_HOST", raising=False)
        mock_smtp_class = MagicMock()
        monkeypatch.setattr(email_service.smtplib, "SMTP", mock_smtp_class)

        email_service.send_reminder_email(TEST_EMAIL, "2026-07-08")

        mock_smtp_class.assert_not_called()

    def test_should_send_email_with_reminder_content_when_smtp_configured(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
        monkeypatch.setenv("SMTP_PORT", "587")
        monkeypatch.setenv("EMAIL_FROM", "noreply@example.com")
        monkeypatch.delenv("SMTP_USER", raising=False)
        monkeypatch.delenv("SMTP_PASSWORD", raising=False)

        mock_server = MagicMock()
        mock_smtp_class = MagicMock()
        mock_smtp_class.return_value.__enter__.return_value = mock_server
        monkeypatch.setattr(email_service.smtplib, "SMTP", mock_smtp_class)

        email_service.send_reminder_email(TEST_EMAIL, "2026-07-08")

        mock_smtp_class.assert_called_once_with("smtp.example.com", 587)
        sent_message = mock_server.send_message.call_args[0][0]
        assert sent_message["To"] == TEST_EMAIL
        assert "2026-07-08" in sent_message["Subject"]
        assert "2026-07-08" in sent_message.get_content()
