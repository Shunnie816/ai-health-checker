import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ai_health_checker.routers import logs

app = FastAPI(title="AI Health Checker API")

_allowed_origins = os.getenv(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(logs.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
