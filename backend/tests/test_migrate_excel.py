from datetime import datetime, time
from typing import Any
from unittest.mock import MagicMock

import pytest
from pydantic import ValidationError

from ai_health_checker import migrate_excel
from ai_health_checker.migrate_excel import migrate_rows, row_to_log_create

TEST_USER_ID = "test-user-id"

NAN = float("nan")


def make_row(**overrides: Any) -> dict[str, Any]:
    base: dict[str, Any] = {
        "date": datetime(2023, 4, 3),
        "mood_morning": 3.0,
        "mood_after_work": 4.0,
        "fatigue": 2.0,
        "work_start": time(9, 0),
        "work_end": time(19, 30),
        "comment": "楽しく話せた",
        "work_content": "Java研修",
    }
    return {**base, **overrides}


class TestRowToLogCreate:
    def test_should_convert_valid_row_to_log_create(self) -> None:
        payload = row_to_log_create(make_row())

        assert payload.date == "2023-04-03"
        assert payload.mood_morning == 3
        assert payload.mood_after_work == 4
        assert payload.fatigue == 2
        assert payload.work_start == "09:00"
        assert payload.work_end == "19:30"
        assert payload.comment == "楽しく話せた"
        assert payload.work_content == "Java研修"
        assert payload.is_holiday is False
        assert payload.gym is False

    def test_should_convert_nan_comment_and_content_to_none(self) -> None:
        payload = row_to_log_create(make_row(comment=NAN, work_content=NAN))

        assert payload.comment is None
        assert payload.work_content is None

    def test_should_raise_validation_error_when_fatigue_is_out_of_range(
        self,
    ) -> None:
        with pytest.raises(ValidationError):
            row_to_log_create(make_row(fatigue=0.0))

    def test_should_raise_validation_error_when_required_field_is_missing(
        self,
    ) -> None:
        with pytest.raises(ValidationError):
            row_to_log_create(make_row(mood_morning=NAN))

    def test_should_convert_row_without_fatigue(self) -> None:
        payload = row_to_log_create(make_row(fatigue=NAN))

        assert payload.fatigue is None


class TestMigrateRows:
    @pytest.fixture
    def mock_deps(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> dict[str, MagicMock]:
        list_logs = MagicMock(return_value=[])
        create_log = MagicMock()
        monkeypatch.setattr(migrate_excel, "list_logs", list_logs)
        monkeypatch.setattr(migrate_excel, "create_log", create_log)
        return {"list_logs": list_logs, "create_log": create_log}

    def test_should_create_logs_for_new_dates(
        self, mock_deps: dict[str, MagicMock]
    ) -> None:
        db = MagicMock()
        rows = [make_row(), make_row(date=datetime(2023, 4, 4))]

        result = migrate_rows(db, TEST_USER_ID, rows, execute=True)

        assert result.migrated == ["2023-04-03", "2023-04-04"]
        assert mock_deps["create_log"].call_count == 2

    def test_should_skip_dates_already_in_firestore(
        self, mock_deps: dict[str, MagicMock]
    ) -> None:
        mock_deps["list_logs"].return_value = [MagicMock(date="2023-04-03")]
        rows = [make_row(), make_row(date=datetime(2023, 4, 4))]

        result = migrate_rows(MagicMock(), TEST_USER_ID, rows, execute=True)

        assert result.skipped_existing == ["2023-04-03"]
        assert result.migrated == ["2023-04-04"]
        assert mock_deps["create_log"].call_count == 1

    def test_should_skip_duplicate_dates_within_the_same_run(
        self, mock_deps: dict[str, MagicMock]
    ) -> None:
        rows = [make_row(), make_row()]

        result = migrate_rows(MagicMock(), TEST_USER_ID, rows, execute=True)

        assert result.migrated == ["2023-04-03"]
        assert result.skipped_existing == ["2023-04-03"]

    def test_should_record_invalid_rows_with_reason_and_continue(
        self, mock_deps: dict[str, MagicMock]
    ) -> None:
        rows = [make_row(mood_morning=NAN), make_row(date=datetime(2023, 4, 4))]

        result = migrate_rows(MagicMock(), TEST_USER_ID, rows, execute=True)

        assert result.migrated == ["2023-04-04"]
        assert len(result.skipped_invalid) == 1
        label, reason = result.skipped_invalid[0]
        assert label == "2023-04-03"
        assert reason  # 理由が空でないこと

    def test_should_not_write_when_dry_run(
        self, mock_deps: dict[str, MagicMock]
    ) -> None:
        rows = [make_row()]

        result = migrate_rows(MagicMock(), TEST_USER_ID, rows, execute=False)

        assert result.migrated == ["2023-04-03"]
        mock_deps["create_log"].assert_not_called()
