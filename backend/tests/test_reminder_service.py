from datetime import date
from unittest.mock import MagicMock

import pytest

from ai_health_checker.services import reminder_service


class _FixedDatetime:
    @staticmethod
    def now(tz: object) -> "_FixedDatetime":
        return _FixedDatetime()

    def date(self) -> date:
        return date(2026, 7, 8)


class TestRunReminders:
    def test_should_remind_user_without_todays_log(
        self, mock_db: MagicMock, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(reminder_service, "datetime", _FixedDatetime)
        mock_db.collection.return_value.stream.return_value = [MagicMock(id="user-1")]

        monkeypatch.setattr(
            reminder_service.log_service, "list_logs", MagicMock(return_value=[])
        )
        monkeypatch.setattr(
            reminder_service, "get_user_email", MagicMock(return_value="user@example.com")
        )
        mock_send = MagicMock()
        monkeypatch.setattr(reminder_service, "send_reminder_email", mock_send)

        result = reminder_service.run_reminders(mock_db)

        assert result == ["user-1"]
        mock_send.assert_called_once_with("user@example.com", "2026-07-08")

    def test_should_skip_user_with_todays_log(
        self, mock_db: MagicMock, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(reminder_service, "datetime", _FixedDatetime)
        mock_db.collection.return_value.stream.return_value = [MagicMock(id="user-1")]

        monkeypatch.setattr(
            reminder_service.log_service,
            "list_logs",
            MagicMock(return_value=[MagicMock()]),
        )
        mock_send = MagicMock()
        monkeypatch.setattr(reminder_service, "send_reminder_email", mock_send)

        result = reminder_service.run_reminders(mock_db)

        assert result == []
        mock_send.assert_not_called()

    def test_should_skip_user_without_email(
        self, mock_db: MagicMock, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(reminder_service, "datetime", _FixedDatetime)
        mock_db.collection.return_value.stream.return_value = [MagicMock(id="user-1")]

        monkeypatch.setattr(
            reminder_service.log_service, "list_logs", MagicMock(return_value=[])
        )
        monkeypatch.setattr(
            reminder_service, "get_user_email", MagicMock(return_value=None)
        )
        mock_send = MagicMock()
        monkeypatch.setattr(reminder_service, "send_reminder_email", mock_send)

        result = reminder_service.run_reminders(mock_db)

        assert result == []
        mock_send.assert_not_called()

    def test_should_handle_multiple_users_independently(
        self, mock_db: MagicMock, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(reminder_service, "datetime", _FixedDatetime)
        mock_db.collection.return_value.stream.return_value = [
            MagicMock(id="logged-user"),
            MagicMock(id="unlogged-user"),
        ]

        def fake_list_logs(
            db: MagicMock, user_id: str, start_date: str, end_date: str
        ) -> list:  # type: ignore[type-arg]
            return [MagicMock()] if user_id == "logged-user" else []

        monkeypatch.setattr(
            reminder_service.log_service, "list_logs", MagicMock(side_effect=fake_list_logs)
        )
        monkeypatch.setattr(
            reminder_service,
            "get_user_email",
            MagicMock(side_effect=lambda uid: f"{uid}@example.com"),
        )
        mock_send = MagicMock()
        monkeypatch.setattr(reminder_service, "send_reminder_email", mock_send)

        result = reminder_service.run_reminders(mock_db)

        assert result == ["unlogged-user"]
        mock_send.assert_called_once_with("unlogged-user@example.com", "2026-07-08")
