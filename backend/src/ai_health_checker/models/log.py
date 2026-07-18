from datetime import datetime
from typing import Self

from pydantic import BaseModel, Field, model_validator

STANDARD_WORK_MINUTES = 9 * 60  # フレックス制：9時間（昼休み含む）を超えた分が残業


def _calc_overtime_minutes(work_start: str, work_end: str) -> int:
    def to_minutes(t: str) -> int:
        h, m = map(int, t.split(":"))
        return h * 60 + m

    total = to_minutes(work_end) - to_minutes(work_start)
    return max(0, total - STANDARD_WORK_MINUTES)


def _calc_overtime_score(overtime_minutes: int) -> int:
    if overtime_minutes == 0:
        return 0
    elif overtime_minutes <= 30:
        return 1
    elif overtime_minutes <= 60:
        return 2
    elif overtime_minutes <= 90:
        return 3
    elif overtime_minutes <= 120:
        return 4
    else:
        return 5


class LogCreate(BaseModel):
    date: str = Field(description="記録日 (YYYY-MM-DD)")
    is_holiday: bool
    mood_morning: int = Field(ge=-5, le=5, description="朝の気分 (-5〜+5)")
    mood_after_work: int | None = Field(
        default=None, ge=-5, le=5, description="1日の終わりの気分 (-5〜+5)"
    )
    fatigue: int | None = Field(
        default=None, ge=1, le=5, description="疲れ度 (1〜5)"
    )
    comment: str | None = Field(default=None, description="感想・気分の自由記述")
    work_content: str | None = Field(default=None, description="その日の仕事内容")
    work_start: str | None = Field(default=None, description="勤務開始時刻 (HH:MM)")
    work_end: str | None = Field(default=None, description="勤務終了時刻 (HH:MM)")
    gym: bool = False
    sleep_hours: float | None = None
    weight: float | None = None

    @model_validator(mode="after")
    def validate_workday_fields(self) -> Self:
        # work_end / mood_after_work / fatigue は勤務終了後にしか分からないため、
        # 平日でも未入力で保存し後から追記できる（#94 朝の分割入力）
        if not self.is_holiday and self.work_start is None:
            raise ValueError("is_holiday=false の場合、work_start は必須です")
        if self.work_end is not None and self.work_start is None:
            raise ValueError("work_end を設定する場合、work_start は必須です")
        return self


class Log(LogCreate):
    overtime_minutes: int | None = None
    overtime_score: int | None = None

    @model_validator(mode="after")
    def compute_overtime(self) -> Self:
        if not self.is_holiday and self.work_start and self.work_end:
            self.overtime_minutes = _calc_overtime_minutes(
                self.work_start, self.work_end
            )
            self.overtime_score = _calc_overtime_score(self.overtime_minutes)
        return self


class LogInDB(Log):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


class LogUpdate(BaseModel):
    """ログの部分更新。date のみ変更不可（日付重複ガードの前提を守る）。

    exclude_unset で処理されるため、明示的に null を送ったフィールドは
    クリアされ、送らなかったフィールドは変更されない。
    """

    is_holiday: bool | None = None
    mood_morning: int | None = Field(default=None, ge=-5, le=5)
    mood_after_work: int | None = Field(default=None, ge=-5, le=5)
    fatigue: int | None = Field(default=None, ge=1, le=5)
    comment: str | None = None
    work_content: str | None = None
    work_start: str | None = None
    work_end: str | None = None
    gym: bool | None = None
    sleep_hours: float | None = None
    weight: float | None = None
