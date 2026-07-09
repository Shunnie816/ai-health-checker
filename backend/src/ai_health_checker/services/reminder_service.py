from datetime import datetime
from zoneinfo import ZoneInfo

from google.cloud.firestore import Client

from ai_health_checker.dependencies import get_user_email
from ai_health_checker.services import log_service
from ai_health_checker.services.email_service import send_reminder_email

JST = ZoneInfo("Asia/Tokyo")


def _today_jst() -> str:
    return datetime.now(JST).date().isoformat()


def run_reminders(db: Client) -> list[str]:
    today = _today_jst()
    reminded_user_ids = []

    for user_doc in db.collection("users").stream():
        user_id = user_doc.id
        if log_service.list_logs(db, user_id, today, today):
            continue

        email = get_user_email(user_id)
        if not email:
            continue

        send_reminder_email(email, today)
        reminded_user_ids.append(user_id)

    return reminded_user_ids
