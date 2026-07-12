from datetime import date, datetime, timedelta, timezone

from google.cloud.firestore import Client

from ai_health_checker.dependencies import get_user_email
from ai_health_checker.models.analysis import AnalysisReportInDB
from ai_health_checker.models.log import LogInDB
from ai_health_checker.services import llm_service, log_service
from ai_health_checker.services.email_service import send_report_email

DEFAULT_PERIOD_DAYS = 30


def _reports_ref(db: Client, user_id: str):  # type: ignore[no-untyped-def]
    return db.collection("users").document(user_id).collection("reports")


def _resolve_period(
    start_date: str | None, end_date: str | None
) -> tuple[str, str]:
    if start_date and end_date:
        return start_date, end_date
    today = date.today()
    default_start = (today - timedelta(days=DEFAULT_PERIOD_DAYS)).isoformat()
    default_end = today.isoformat()
    return start_date or default_start, end_date or default_end


def _build_prompt(logs: list[LogInDB], start_date: str, end_date: str) -> str:
    lines = [
        f"{start_date}〜{end_date}のライフログを分析し、"
        "傾向をレポートしてください。"
    ]
    for log in logs:
        mood_after_work = (
            log.mood_after_work if log.mood_after_work is not None else "-"
        )
        overtime_score = (
            log.overtime_score if log.overtime_score is not None else "-"
        )
        lines.append(
            f"- {log.date}: 朝の気分{log.mood_morning} "
            f"終業後の気分{mood_after_work} "
            f"疲労度{log.fatigue} "
            f"残業スコア{overtime_score} "
            f"ジム{'あり' if log.gym else 'なし'} "
            f"コメント{log.comment or 'なし'}"
        )
    return "\n".join(lines)


def run_analysis_for_user(
    db: Client,
    user_id: str,
    start_date: str | None = None,
    end_date: str | None = None,
) -> AnalysisReportInDB:
    resolved_start, resolved_end = _resolve_period(start_date, end_date)

    logs = log_service.list_logs(db, user_id, resolved_start, resolved_end)
    if not logs:
        raise ValueError("対象期間のログが見つかりません")

    prompt = _build_prompt(logs, resolved_start, resolved_end)
    content = llm_service.generate_analysis_report(prompt, user_id)

    now = datetime.now(timezone.utc)
    doc_ref = _reports_ref(db, user_id).document()
    data = {
        "id": doc_ref.id,
        "user_id": user_id,
        "start_date": resolved_start,
        "end_date": resolved_end,
        "content": content,
        "log_count": len(logs),
        "created_at": now,
    }
    doc_ref.set(data)
    report = AnalysisReportInDB(**data)

    user_email = get_user_email(user_id)
    if user_email:
        send_report_email(user_email, report)

    return report


def list_reports(db: Client, user_id: str) -> list[AnalysisReportInDB]:
    query = _reports_ref(db, user_id).order_by("created_at", direction="DESCENDING")
    return [AnalysisReportInDB(**doc.to_dict()) for doc in query.stream()]


def run_analysis_for_all_users(db: Client) -> list[AnalysisReportInDB]:
    reports = []
    for user_doc in db.collection("users").stream():
        try:
            reports.append(run_analysis_for_user(db, user_doc.id))
        except ValueError:
            continue
    return reports
