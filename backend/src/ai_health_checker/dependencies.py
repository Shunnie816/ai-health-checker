import os

from fastapi import Header, HTTPException
from firebase_admin import auth
from google.cloud.firestore import Client

from ai_health_checker.firebase_app import _initialize, get_firestore


async def get_current_user_id(authorization: str = Header(...)) -> str:
    _initialize()
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer token required")
    token = authorization[len("Bearer "):]
    try:
        decoded = auth.verify_id_token(token)
        uid: str = decoded["uid"]
        return uid
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from e


async def verify_scheduler_key(
    x_scheduler_key: str | None = Header(default=None),
) -> None:
    expected = os.getenv("SCHEDULER_API_KEY")
    if not expected or x_scheduler_key != expected:
        raise HTTPException(status_code=401, detail="Invalid scheduler key")


def get_user_email(user_id: str) -> str | None:
    _initialize()
    try:
        email: str | None = auth.get_user(user_id).email
        return email
    except Exception:
        return None


def get_db() -> Client:
    return get_firestore()
