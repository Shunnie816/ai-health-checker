from fastapi import Header, HTTPException
from firebase_admin import auth
from google.cloud.firestore import Client

from ai_health_checker.firebase_app import get_firestore


async def get_current_user_id(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer token required")
    token = authorization[len("Bearer "):]
    try:
        decoded = auth.verify_id_token(token)
        uid: str = decoded["uid"]
        return uid
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from e


def get_db() -> Client:
    return get_firestore()
