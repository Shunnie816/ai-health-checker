import pytest
from pydantic import ValidationError

from ai_health_checker.models.log import Log, LogCreate, LogUpdate, _calc_overtime_minutes, _calc_overtime_score


class TestCalcOvertimeMinutes:
    def test_should_return_zero_when_within_standard_hours(self) -> None:
        assert _calc_overtime_minutes("09:00", "18:00") == 0

    def test_should_return_overtime_when_exceeds_standard_hours(self) -> None:
        assert _calc_overtime_minutes("09:00", "19:30") == 90

    def test_should_return_zero_when_exactly_standard_hours(self) -> None:
        assert _calc_overtime_minutes("10:00", "19:00") == 0


class TestCalcOvertimeScore:
    def test_should_return_0_when_no_overtime(self) -> None:
        assert _calc_overtime_score(0) == 0

    def test_should_return_1_when_up_to_30_min(self) -> None:
        assert _calc_overtime_score(30) == 1

    def test_should_return_2_when_up_to_60_min(self) -> None:
        assert _calc_overtime_score(60) == 2

    def test_should_return_3_when_up_to_90_min(self) -> None:
        assert _calc_overtime_score(90) == 3

    def test_should_return_4_when_up_to_120_min(self) -> None:
        assert _calc_overtime_score(120) == 4

    def test_should_return_5_when_over_120_min(self) -> None:
        assert _calc_overtime_score(121) == 5


class TestLogCreate:
    def test_should_create_holiday_log_without_work_fields(self) -> None:
        log = LogCreate(
            date="2026-06-25",
            is_holiday=True,
            mood_morning=3,
            fatigue=2,
        )
        assert log.is_holiday is True
        assert log.work_start is None

    def test_should_create_workday_log_with_all_required_fields(self) -> None:
        log = LogCreate(
            date="2026-06-25",
            is_holiday=False,
            mood_morning=2,
            mood_after_work=-1,
            fatigue=3,
            work_start="09:00",
            work_end="18:30",
        )
        assert log.work_start == "09:00"

    def test_should_raise_when_workday_missing_work_start(self) -> None:
        with pytest.raises(ValidationError, match="work_start"):
            LogCreate(
                date="2026-06-25",
                is_holiday=False,
                mood_morning=2,
                mood_after_work=1,
                fatigue=3,
            )

    def test_should_create_morning_partial_log_on_workday(self) -> None:
        log = LogCreate(
            date="2026-06-25",
            is_holiday=False,
            mood_morning=2,
            work_start="09:00",
        )
        assert log.work_end is None
        assert log.mood_after_work is None
        assert log.fatigue is None

    def test_should_raise_when_work_end_is_set_without_work_start(self) -> None:
        with pytest.raises(ValidationError, match="work_start"):
            LogCreate(
                date="2026-06-25",
                is_holiday=True,
                mood_morning=2,
                work_end="18:00",
            )

    def test_should_raise_when_mood_morning_out_of_range(self) -> None:
        with pytest.raises(ValidationError):
            LogCreate(
                date="2026-06-25",
                is_holiday=True,
                mood_morning=6,
                fatigue=3,
            )

    def test_should_raise_when_fatigue_out_of_range(self) -> None:
        with pytest.raises(ValidationError):
            LogCreate(
                date="2026-06-25",
                is_holiday=True,
                mood_morning=1,
                fatigue=6,
            )


class TestLog:
    def test_should_compute_overtime_for_workday(self) -> None:
        log = Log(
            date="2026-06-25",
            is_holiday=False,
            mood_morning=1,
            mood_after_work=-2,
            fatigue=4,
            work_start="09:00",
            work_end="19:30",
        )
        assert log.overtime_minutes == 90
        assert log.overtime_score == 3

    def test_should_not_compute_overtime_for_holiday(self) -> None:
        log = Log(
            date="2026-06-25",
            is_holiday=True,
            mood_morning=5,
            fatigue=1,
        )
        assert log.overtime_minutes is None
        assert log.overtime_score is None

    def test_should_not_compute_overtime_when_work_end_is_missing(self) -> None:
        log = Log(
            date="2026-06-25",
            is_holiday=False,
            mood_morning=1,
            work_start="09:00",
        )
        assert log.overtime_minutes is None
        assert log.overtime_score is None
