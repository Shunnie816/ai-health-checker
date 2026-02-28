from typing import Any

from fastapi import FastAPI, Query

from ai_health_checker.analysis import generate_monthly_summary
from ai_health_checker.dify import register_to_dify
from ai_health_checker.etl import load_and_concat_all_data

app = FastAPI()


@app.post("/generate-and-register")
def generate_and_register(year: int = Query(...)) -> dict[str, Any]:
    df = load_and_concat_all_data(year)
    summary = generate_monthly_summary(df)

    dify_response = register_to_dify(name=f"{year}年_健康レポート", text=summary)

    return {
        "status": "success",
        "year": year,
        "summary": summary,
        "dify_status": dify_response,
    }
