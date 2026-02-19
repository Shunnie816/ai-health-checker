from fastapi import FastAPI
from ai_health_checker.etl import load_and_concat_all_data
from pydantic import BaseModel
from typing import Optional


class MonthlySummary(BaseModel):
    year: int
    month: int
    avg_overtime_min: float
    avg_fatigue: float
    avg_morning_condition: float
    correlation_overtime_fatigue: Optional[float]

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "year": 2023,
                    "month": 6,
                    "avg_overtime_min": 8.409090909090908,
                    "avg_fatigue": 3.590909090909091,
                    "avg_morning_condition": 2.8636363636363638,
                    "correlation_overtime_fatigue": 0.049720268404029634,
                }
            ]
        }
    }


app = FastAPI()

# 起動時に一度だけ読み込む
df = load_and_concat_all_data()


@app.get("/monthly-summary", response_model=MonthlySummary)
def monthly_summary(year: int, month: int):
    filtered = df[(df["date"].dt.year == year) & (df["date"].dt.month == month)]

    if filtered.empty:
        return {"message": "No data found"}

    avg_overtime = filtered["overtime_min_calculated"].mean()
    avg_fatigue = filtered["fatigue"].mean()
    avg_morning = filtered["morning_condition"].mean()

    correlation = filtered["fatigue"].corr(filtered["overtime_min_calculated"])

    return {
        "year": year,
        "month": month,
        "avg_overtime_min": avg_overtime,
        "avg_fatigue": avg_fatigue,
        "avg_morning_condition": avg_morning,
        "correlation_overtime_fatigue": correlation,
    }
