from fastapi import FastAPI
from ai_health_checker.etl import load_and_concat_all_data
from pydantic import BaseModel
from typing import Optional
from fastapi import HTTPException
import requests
from dotenv import load_dotenv
import os

# .env 読み込み
load_dotenv()

# 環境変数取得
API_KEY = os.getenv("DATASET_API_KEY")
DATASET_ID = os.getenv("DATASET_ID")

url = f"https://api.dify.ai/v1/datasets/{DATASET_ID}/document/create-by-text"
get_url = "https://api.dify.ai/v1/datasets?page=1&limit=20"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}

data = {
    "name": "2024年3月_健康レポート",
    "text": """
    2024年3月：
    平均残業72.32分、
    平均疲労度3.79。
    相関は0.29。
    """,
    "indexing_technique": "high_quality",
}

# response = requests.post(url, headers=headers, json=data)
res = requests.get(get_url, headers=headers)

# print("status:", response.status_code)
# print("text:", response.text)
print("status:", res.status_code)
print("text:", res.text)


class MonthlySummary(BaseModel):
    year: int
    month: int
    avg_overtime_min: float
    avg_fatigue: float
    avg_morning_condition: float
    correlation_overtime_fatigue: Optional[float]
    correlation_strength: Optional[str]

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
                    "correlation_strength": "ほとんど相関は見られません",
                }
            ]
        }
    }


app = FastAPI()


@app.get("/monthly-summary", response_model=MonthlySummary)
def monthly_summary(year: int, month: int):
    df = load_and_concat_all_data()
    filtered = df[(df["date"].dt.year == year) & (df["date"].dt.month == month)]

    if filtered.empty:
        raise HTTPException(
            status_code=404, detail=f"{year}年{month}月のデータが見つかりません"
        )

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
        "correlation_strength": interpret_correlation(correlation),
    }


@app.get("/monthly-summary-text", response_model=str)
def monthly_summary_text(year: int, month: int):
    df = load_and_concat_all_data()
    filtered = df[(df["date"].dt.year == year) & (df["date"].dt.month == month)]

    if filtered.empty:
        return "No data found"

    avg_overtime = filtered["overtime_min_calculated"].mean()
    avg_fatigue = filtered["fatigue"].mean()
    correlation = filtered["fatigue"].corr(filtered["overtime_min_calculated"])

    summary = (
        f"{year}年{month}月の平均残業時間は{avg_overtime:.2f}分でした。\n"
        f"疲労度の平均は{avg_fatigue:.2f}です。\n"
        f"残業時間と疲労度の相関は{correlation:.3f}で、"
        f"{interpret_correlation(correlation)}。"
    )
    return summary


def interpret_correlation(value):
    if value is None:
        return "相関を計算できません"

    abs_val = abs(value)

    if abs_val < 0.2:
        return "ほとんど相関は見られません"
    elif abs_val < 0.5:
        return "弱い正の相関" if value > 0 else "弱い負の相関"
    else:
        return "強い正の相関" if value > 0 else "強い負の相関"


@app.get("/all-month-summaries", response_model=list[str])
def all_month_summaries():
    df = load_and_concat_all_data()
    summaries = []

    for (year, month), group in df.groupby([df["date"].dt.year, df["date"].dt.month]):
        avg_overtime = group["overtime_min_calculated"].mean()
        avg_fatigue = group["fatigue"].mean()
        correlation = group["fatigue"].corr(group["overtime_min_calculated"])

        text = (
            f"{year}年{month}月："
            f"平均残業{avg_overtime:.2f}分、"
            f"平均疲労度{avg_fatigue:.2f}。"
            f"残業と疲労の相関は{correlation:.2f}で"
            f"{interpret_correlation(correlation)}。"
        )

        summaries.append(text)

    return summaries
