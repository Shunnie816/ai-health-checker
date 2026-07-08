from datetime import datetime

from pydantic import BaseModel, Field


class AnalysisRunRequest(BaseModel):
    start_date: str | None = Field(
        default=None, description="分析対象期間の開始日 (YYYY-MM-DD)"
    )
    end_date: str | None = Field(
        default=None, description="分析対象期間の終了日 (YYYY-MM-DD)"
    )


class AnalysisReport(BaseModel):
    user_id: str
    start_date: str
    end_date: str
    content: str = Field(description="AI が生成した分析レポート本文")
    log_count: int = Field(ge=0, description="分析対象になったログ件数")


class AnalysisReportInDB(AnalysisReport):
    id: str
    created_at: datetime
