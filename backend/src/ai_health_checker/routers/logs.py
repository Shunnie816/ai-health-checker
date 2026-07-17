from fastapi import APIRouter, Depends, HTTPException, Response
from google.cloud.firestore import Client
from pydantic import ValidationError

from ai_health_checker.dependencies import get_current_user_id, get_db
from ai_health_checker.models.log import LogCreate, LogInDB, LogUpdate
from ai_health_checker.services import log_service

router = APIRouter(prefix="/logs", tags=["logs"])


@router.post("", response_model=LogInDB, status_code=201)
async def create_log(
    payload: LogCreate,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
) -> LogInDB:
    try:
        return log_service.create_log(db, user_id, payload)
    except log_service.DuplicateDateError as e:
        raise HTTPException(status_code=409, detail=str(e)) from e


@router.get("", response_model=list[LogInDB])
async def list_logs(
    start_date: str | None = None,
    end_date: str | None = None,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
) -> list[LogInDB]:
    return log_service.list_logs(db, user_id, start_date, end_date)


@router.get("/{log_id}", response_model=LogInDB)
async def get_log(
    log_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
) -> LogInDB:
    try:
        return log_service.get_log(db, user_id, log_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.delete("/{log_id}", status_code=204)
async def delete_log(
    log_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
) -> Response:
    try:
        log_service.delete_log(db, user_id, log_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    return Response(status_code=204)


@router.put("/{log_id}", response_model=LogInDB)
async def update_log(
    log_id: str,
    payload: LogUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
) -> LogInDB:
    try:
        return log_service.update_log(db, user_id, log_id, payload)
    except ValidationError as e:
        # 更新後の状態が不整合（例: 平日なのに勤務時間なし）
        raise HTTPException(status_code=422, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
