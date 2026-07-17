from datetime import datetime, timezone

from google.cloud.firestore import Client
from google.cloud.firestore_v1.base_query import FieldFilter

from ai_health_checker.models.log import Log, LogCreate, LogInDB, LogUpdate


class DuplicateDateError(ValueError):
    """同じ日付のログが既に存在する場合のエラー（1日1件の制約）"""


def _logs_ref(db: Client, user_id: str):  # type: ignore[no-untyped-def]
    return db.collection("users").document(user_id).collection("logs")


def create_log(db: Client, user_id: str, payload: LogCreate) -> LogInDB:
    duplicate = list(
        _logs_ref(db, user_id)
        .where(filter=FieldFilter("date", "==", payload.date))
        .limit(1)
        .stream()
    )
    if duplicate:
        raise DuplicateDateError(f"{payload.date} のログは既に存在します")

    log = Log(**payload.model_dump())
    now = datetime.now(timezone.utc)
    doc_ref = _logs_ref(db, user_id).document()
    data = {
        **log.model_dump(),
        "id": doc_ref.id,
        "user_id": user_id,
        "created_at": now,
        "updated_at": now,
    }
    doc_ref.set(data)
    return LogInDB(**data)


def get_log(db: Client, user_id: str, log_id: str) -> LogInDB:
    doc = _logs_ref(db, user_id).document(log_id).get()
    if not doc.exists:
        raise ValueError(f"Log {log_id} not found")
    return LogInDB(**doc.to_dict())


def list_logs(
    db: Client,
    user_id: str,
    start_date: str | None = None,
    end_date: str | None = None,
) -> list[LogInDB]:
    query = _logs_ref(db, user_id).order_by("date", direction="DESCENDING")
    if start_date:
        query = query.where(filter=FieldFilter("date", ">=", start_date))
    if end_date:
        query = query.where(filter=FieldFilter("date", "<=", end_date))
    return [LogInDB(**doc.to_dict()) for doc in query.stream()]


def delete_log(db: Client, user_id: str, log_id: str) -> None:
    doc_ref = _logs_ref(db, user_id).document(log_id)
    if not doc_ref.get().exists:
        raise ValueError(f"Log {log_id} not found")
    doc_ref.delete()


def update_log(
    db: Client, user_id: str, log_id: str, payload: LogUpdate
) -> LogInDB:
    doc_ref = _logs_ref(db, user_id).document(log_id)
    doc = doc_ref.get()
    if not doc.exists:
        raise ValueError(f"Log {log_id} not found")

    current = LogInDB(**doc.to_dict())
    # exclude_unset: 明示的な null はフィールドのクリア（休日切替時の勤務時間など）、
    # 未送信は変更なし。exclude_none だと平日→休日の切替で勤務系を消せない
    updates = payload.model_dump(exclude_unset=True)
    merged = current.model_dump()
    merged.update(updates)
    merged["updated_at"] = datetime.now(timezone.utc)

    updated = Log(**{k: merged[k] for k in LogCreate.model_fields})
    final = {**merged, **updated.model_dump()}
    doc_ref.update(final)
    return LogInDB(**final)
