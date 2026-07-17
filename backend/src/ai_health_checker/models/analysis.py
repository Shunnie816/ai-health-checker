from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

AnalysisFocus = Literal["general", "fatigue", "overtime_mood", "gym"]


class AnalysisRunRequest(BaseModel):
    start_date: str | None = Field(
        default=None, description="分析対象期間の開始日 (YYYY-MM-DD)"
    )
    end_date: str | None = Field(
        default=None, description="分析対象期間の終了日 (YYYY-MM-DD)"
    )
    focus: AnalysisFocus = Field(
        default="general",
        description="分析の切り口（総合/疲労傾向/残業と気分/ジム習慣）",
    )


class AnalysisReport(BaseModel):
    user_id: str
    start_date: str
    end_date: str
    content: str = Field(description="AI が生成した分析レポート本文")
    log_count: int = Field(ge=0, description="分析対象になったログ件数")
    # focus 導入前のレポートは Firestore にフィールドがないため default で補う
    focus: AnalysisFocus = Field(default="general", description="分析の切り口")


class AnalysisReportInDB(AnalysisReport):
    id: str
    created_at: datetime
