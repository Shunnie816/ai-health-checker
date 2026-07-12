"""既存 Excel（Google Sheets）の健康記録を Firestore に移行するワンタイムスクリプト。

使い方:
    PYTHONPATH=backend/src python -m ai_health_checker.migrate_excel \\
        --user-id <Firebase Auth UID> --years 2023,2024

    書き込みは --execute 指定時のみ。未指定なら dry-run（検証と件数報告のみ）。

前提:
    - .env に年度ごとのファイルパス/URL を `{year}_FILE` で定義（例: 2023_FILE=...）
    - GOOGLE_APPLICATION_CREDENTIALS で移行先 Firestore に接続

仕様メモ:
    - Excel の「残業点」（上限10の旧ルール）は使わず、Log モデルが勤務時間から
      アプリのルール（0〜5）で再計算する
    - Excel は勤務日のみ記録されているため、全行 is_holiday=False
    - 同じ日付のログが Firestore に既にある場合はスキップ（再実行しても安全）
"""

import argparse
import os
from dataclasses import dataclass, field
from datetime import date, datetime, time
from typing import Any

import pandas as pd
from dotenv import load_dotenv
from google.cloud.firestore import Client
from pydantic import ValidationError

from ai_health_checker.models.log import LogCreate
from ai_health_checker.services.log_service import create_log, list_logs

MASTER_SHEET = "リストマスタ"

COLUMN_MAP = {
    "日付": "date",
    "朝の気分": "mood_morning",
    "仕事終わり気分": "mood_after_work",
    "疲れ度": "fatigue",
    "始業": "work_start",
    "終業": "work_end",
    "コメント": "comment",
    "内容": "work_content",
}


@dataclass
class MigrationResult:
    migrated: list[str] = field(default_factory=list)
    skipped_existing: list[str] = field(default_factory=list)
    skipped_invalid: list[tuple[str, str]] = field(default_factory=list)

    @property
    def total(self) -> int:
        return (
            len(self.migrated)
            + len(self.skipped_existing)
            + len(self.skipped_invalid)
        )


def _to_date_str(value: Any) -> str:
    if isinstance(value, (datetime, date)):
        return value.strftime("%Y-%m-%d")
    raise ValueError(f"日付として解釈できません: {value!r}")


def _to_time_str(value: Any) -> str | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    if isinstance(value, time):
        return value.strftime("%H:%M")
    if isinstance(value, datetime):
        return value.strftime("%H:%M")
    if isinstance(value, str):
        return value[:5]  # "HH:MM:SS" → "HH:MM"
    raise ValueError(f"時刻として解釈できません: {value!r}")


def _to_int(value: Any) -> int | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    return int(value)


def _to_text(value: Any) -> str | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    text = str(value).strip()
    return text or None


def row_to_log_create(row: dict[str, Any]) -> LogCreate:
    """Excel の1行（列名変換済み dict）を LogCreate に変換する。

    バリデーション違反（気分の範囲外・勤務日の必須欠損など）は
    pydantic の ValidationError として送出される。
    """
    return LogCreate(
        date=_to_date_str(row["date"]),
        is_holiday=False,
        mood_morning=_to_int(row.get("mood_morning")),  # type: ignore[arg-type]
        mood_after_work=_to_int(row.get("mood_after_work")),
        fatigue=_to_int(row.get("fatigue")),
        comment=_to_text(row.get("comment")),
        work_content=_to_text(row.get("work_content")),
        work_start=_to_time_str(row.get("work_start")),
        work_end=_to_time_str(row.get("work_end")),
        gym=False,
    )


def load_excel_rows(file_path: str) -> list[dict[str, Any]]:
    """全シート（リストマスタ以外）を読み込み、列名変換済みの行 dict を返す。"""
    xls = pd.ExcelFile(file_path)
    sheet_names = [s for s in xls.sheet_names if str(s).strip() != MASTER_SHEET]
    rows: list[dict[str, Any]] = []
    for sheet in sheet_names:
        df = pd.read_excel(file_path, sheet_name=sheet, header=1)
        df = df.loc[:, ~df.columns.str.contains("^Unnamed")]
        df = df.rename(columns=COLUMN_MAP)
        df = df[df["date"].notna()]
        rows.extend(
            {str(k): v for k, v in r.items()}
            for r in df.to_dict(orient="records")
        )
    return rows


def migrate_rows(
    db: Client,
    user_id: str,
    rows: list[dict[str, Any]],
    *,
    execute: bool,
) -> MigrationResult:
    existing_dates = {log.date for log in list_logs(db, user_id)}
    result = MigrationResult()
    seen_dates: set[str] = set()

    for row in rows:
        try:
            payload = row_to_log_create(row)
        except (ValidationError, ValueError, KeyError) as e:
            raw_date = row.get("date")
            label = str(raw_date)[:10] if raw_date is not None else "(日付不明)"
            result.skipped_invalid.append((label, str(e)))
            continue

        if payload.date in existing_dates or payload.date in seen_dates:
            result.skipped_existing.append(payload.date)
            continue

        seen_dates.add(payload.date)
        if execute:
            create_log(db, user_id, payload)
        result.migrated.append(payload.date)

    return result


def _print_report(result: MigrationResult, execute: bool) -> None:
    mode = "実行" if execute else "dry-run（書き込みなし）"
    print(f"=== 移行結果 [{mode}] ===")
    print(f"対象行数:       {result.total}")
    print(f"移行:           {len(result.migrated)}")
    print(f"スキップ(既存): {len(result.skipped_existing)}")
    print(f"スキップ(不正): {len(result.skipped_invalid)}")
    if result.migrated:
        print(f"移行期間: {min(result.migrated)} 〜 {max(result.migrated)}")
    for label, reason in result.skipped_invalid:
        print(f"  [不正] {label}: {reason}")


def main() -> None:
    load_dotenv()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--user-id", required=True, help="移行先の Firebase Auth UID")
    parser.add_argument(
        "--years",
        required=True,
        help="移行対象の年度（カンマ区切り）。ファイルは env の {year}_FILE から解決",
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Firestore に書き込む（未指定なら dry-run）",
    )
    args = parser.parse_args()

    years = [y.strip() for y in args.years.split(",")]
    file_map: dict[str, str] = {}
    for year in years:
        path = os.getenv(f"{year}_FILE")
        if not path:
            raise SystemExit(f"環境変数 {year}_FILE が未設定です")
        file_map[year] = path

    rows: list[dict[str, Any]] = []
    for year, path in file_map.items():
        year_rows = load_excel_rows(path)
        print(f"{year}: {len(year_rows)} 行読み込み")
        rows.extend(year_rows)

    from ai_health_checker.firebase_app import get_firestore

    db = get_firestore()
    result = migrate_rows(db, args.user_id, rows, execute=args.execute)
    _print_report(result, args.execute)


if __name__ == "__main__":
    main()
