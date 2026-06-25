from fastapi import FastAPI

from ai_health_checker.routers import logs

app = FastAPI(title="AI Health Checker API")

app.include_router(logs.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
