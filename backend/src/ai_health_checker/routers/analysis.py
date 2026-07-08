from fastapi import APIRouter, Depends, HTTPException
from google.cloud.firestore import Client

from ai_health_checker.dependencies import (
    get_current_user_id,
    get_db,
    verify_scheduler_key,
)
from ai_health_checker.models.analysis import AnalysisReportInDB, AnalysisRunRequest
from ai_health_checker.services import analysis_service

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.post("/run", response_model=AnalysisReportInDB, status_code=201)
async def run_analysis(
    payload: AnalysisRunRequest | None = None,
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
) -> AnalysisReportInDB:
    start_date = payload.start_date if payload else None
    end_date = payload.end_date if payload else None
    try:
        return analysis_service.run_analysis_for_user(db, user_id, start_date, end_date)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.post(
    "/scheduler-run",
    response_model=list[AnalysisReportInDB],
    status_code=201,
    dependencies=[Depends(verify_scheduler_key)],
)
async def scheduler_run_analysis(
    db: Client = Depends(get_db),
) -> list[AnalysisReportInDB]:
    return analysis_service.run_analysis_for_all_users(db)


@router.get("/reports", response_model=list[AnalysisReportInDB])
async def list_reports(
    user_id: str = Depends(get_current_user_id),
    db: Client = Depends(get_db),
) -> list[AnalysisReportInDB]:
    return analysis_service.list_reports(db, user_id)
