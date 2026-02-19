from fastapi import FastAPI
from ai_health_checker.etl import load_and_concat_all_data

app = FastAPI()

# 起動時に一度だけ読み込む
df = load_and_concat_all_data()


@app.get("/monthly-summary")
def monthly_summary(year: int, month: int):
    filtered = df[
        (df["date"].dt.year == year) &
        (df["date"].dt.month == month)
    ]

    if filtered.empty:
        return {"message": "No data found"}

    avg_overtime = filtered["overtime_min_calculated"].mean()
    avg_fatigue = filtered["fatigue"].mean()
    avg_morning = filtered["morning_condition"].mean()

    correlation = filtered["fatigue"].corr(
        filtered["overtime_min_calculated"]
    )

    return {
        "year": year,
        "month": month,
        "avg_overtime_min": avg_overtime,
        "avg_fatigue": avg_fatigue,
        "avg_morning_condition": avg_morning,
        "correlation_overtime_fatigue": correlation,
    }
