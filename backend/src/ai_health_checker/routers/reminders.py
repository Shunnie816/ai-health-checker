from fastapi import APIRouter, Depends
from google.cloud.firestore import Client

from ai_health_checker.dependencies import get_db, verify_scheduler_key
from ai_health_checker.services import reminder_service

router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.post(
    "/run",
    status_code=200,
    dependencies=[Depends(verify_scheduler_key)],
)
async def run_reminders(db: Client = Depends(get_db)) -> dict[str, list[str]]:
    reminded_user_ids = reminder_service.run_reminders(db)
    return {"reminded_user_ids": reminded_user_ids}
