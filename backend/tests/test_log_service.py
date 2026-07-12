from unittest.mock import MagicMock

import pytest
from google.cloud.firestore import Client

from ai_health_checker.models.log import LogCreate
from ai_health_checker.services import log_service
from tests.conftest import TEST_LOG_ID, TEST_USER_ID, get_logs_ref, make_workday_db_data


class TestCreateLog:
    def test_should_return_log_with_computed_overtime(
        self, mock_db: MagicMock
    ) -> None:
        doc_ref = MagicMock()
        doc_ref.id = TEST_LOG_ID
        get_logs_ref(mock_db).document.return_value = doc_ref

        payload = LogCreate(
            date="2026-06-26",
            is_holiday=False,
            mood_morning=3,
            mood_after_work=2,
            fatigue=2,
            work_start="09:00",
            work_end="19:30",
        )

        result = log_service.create_log(mock_db, TEST_USER_ID, payload)

        assert result.id == TEST_LOG_ID
        assert result.user_id == TEST_USER_ID
        assert result.overtime_minutes == 90
        assert result.overtime_score == 3

    def test_should_return_holiday_log_without_overtime(
        self, mock_db: MagicMock
    ) -> None:
        doc_ref = MagicMock()
        doc_ref.id = TEST_LOG_ID
        get_logs_ref(mock_db).document.return_value = doc_ref

        payload = LogCreate(
            date="2026-06-26",
            is_holiday=True,
            mood_morning=4,
            fatigue=1,
        )

        result = log_service.create_log(mock_db, TEST_USER_ID, payload)

        assert result.overtime_minutes is None
        assert result.overtime_score is None


    def test_should_raise_duplicate_date_error_when_same_date_exists(
        self, mock_db: MagicMock
    ) -> None:
        get_logs_ref(
            mock_db
        ).where.return_value.limit.return_value.stream.return_value = [MagicMock()]

        payload = LogCreate(
            date="2026-06-26",
            is_holiday=True,
            mood_morning=4,
            fatigue=1,
        )

        with pytest.raises(log_service.DuplicateDateError):
            log_service.create_log(mock_db, TEST_USER_ID, payload)

        get_logs_ref(mock_db).document.return_value.set.assert_not_called()


class TestListLogs:
    def test_should_convert_firestore_documents_to_log_list(
        self, mock_db: MagicMock
    ) -> None:
        db_data = make_workday_db_data()
        mock_doc = MagicMock()
        mock_doc.to_dict.return_value = db_data
        get_logs_ref(mock_db).order_by.return_value.stream.return_value = [mock_doc]

        result = log_service.list_logs(mock_db, TEST_USER_ID)

        assert len(result) == 1
        assert result[0].id == TEST_LOG_ID
        assert result[0].date == "2026-06-26"


class TestUpdateLog:
    def test_should_raise_when_log_not_found(self, mock_db: MagicMock) -> None:
        doc_ref = get_logs_ref(mock_db).document.return_value
        doc_ref.get.return_value.exists = False

        from ai_health_checker.models.log import LogUpdate

        with pytest.raises(ValueError, match=TEST_LOG_ID):
            log_service.update_log(mock_db, TEST_USER_ID, TEST_LOG_ID, LogUpdate())

    def test_should_merge_partial_update_with_existing_fields(
        self, mock_db: MagicMock
    ) -> None:
        db_data = make_workday_db_data(fatigue=2, mood_morning=3)
        doc_ref = get_logs_ref(mock_db).document.return_value
        doc_ref.get.return_value.exists = True
        doc_ref.get.return_value.to_dict.return_value = db_data

        from ai_health_checker.models.log import LogUpdate

        result = log_service.update_log(
            mock_db, TEST_USER_ID, TEST_LOG_ID, LogUpdate(fatigue=5)
        )

        assert result.fatigue == 5
        assert result.mood_morning == 3

    def test_should_update_holiday_flag_to_false_and_compute_overtime(
        self, mock_db: MagicMock
    ) -> None:
        db_data = make_workday_db_data(
            is_holiday=True,
            mood_after_work=None,
            work_start=None,
            work_end=None,
            overtime_minutes=None,
            overtime_score=None,
        )
        doc_ref = get_logs_ref(mock_db).document.return_value
        doc_ref.get.return_value.exists = True
        doc_ref.get.return_value.to_dict.return_value = db_data

        from ai_health_checker.models.log import LogUpdate

        result = log_service.update_log(
            mock_db,
            TEST_USER_ID,
            TEST_LOG_ID,
            LogUpdate(
                is_holiday=False,
                mood_after_work=1,
                work_start="09:00",
                work_end="19:30",
            ),
        )

        assert result.is_holiday is False
        assert result.overtime_minutes == 90
        assert result.overtime_score == 3

    def test_should_update_holiday_flag_to_true_and_clear_work_fields(
        self, mock_db: MagicMock
    ) -> None:
        db_data = make_workday_db_data(overtime_minutes=90, overtime_score=3)
        doc_ref = get_logs_ref(mock_db).document.return_value
        doc_ref.get.return_value.exists = True
        doc_ref.get.return_value.to_dict.return_value = db_data

        from ai_health_checker.models.log import LogUpdate

        result = log_service.update_log(
            mock_db,
            TEST_USER_ID,
            TEST_LOG_ID,
            LogUpdate(
                is_holiday=True,
                mood_after_work=None,
                work_start=None,
                work_end=None,
                work_content=None,
            ),
        )

        assert result.is_holiday is True
        assert result.work_start is None
        assert result.work_end is None
        assert result.overtime_minutes is None
        assert result.overtime_score is None

    def test_should_not_change_fields_that_are_not_sent(
        self, mock_db: MagicMock
    ) -> None:
        db_data = make_workday_db_data(comment="既存コメント")
        doc_ref = get_logs_ref(mock_db).document.return_value
        doc_ref.get.return_value.exists = True
        doc_ref.get.return_value.to_dict.return_value = db_data

        from ai_health_checker.models.log import LogUpdate

        result = log_service.update_log(
            mock_db, TEST_USER_ID, TEST_LOG_ID, LogUpdate(fatigue=4)
        )

        assert result.comment == "既存コメント"
        assert result.work_start == "09:00"

    def test_should_raise_validation_error_when_workday_lacks_work_fields(
        self, mock_db: MagicMock
    ) -> None:
        db_data = make_workday_db_data()
        doc_ref = get_logs_ref(mock_db).document.return_value
        doc_ref.get.return_value.exists = True
        doc_ref.get.return_value.to_dict.return_value = db_data

        from pydantic import ValidationError

        from ai_health_checker.models.log import LogUpdate

        with pytest.raises(ValidationError):
            log_service.update_log(
                mock_db, TEST_USER_ID, TEST_LOG_ID, LogUpdate(work_start=None)
            )
