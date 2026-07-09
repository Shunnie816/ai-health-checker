import logging
import os
import smtplib
from email.message import EmailMessage

from ai_health_checker.models.analysis import AnalysisReportInDB

logger = logging.getLogger(__name__)


def _send_email(
    to_email: str, subject: str, body: str, *, skip_log_context: str
) -> None:
    smtp_host = os.getenv("SMTP_HOST")
    if not smtp_host:
        logger.info(
            "SMTP_HOST が未設定のため、メール送信をスキップしました (%s)",
            skip_log_context,
        )
        return

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = os.getenv("EMAIL_FROM", "")
    message["To"] = to_email
    message.set_content(body)

    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        if smtp_user and smtp_password:
            server.login(smtp_user, smtp_password)
        server.send_message(message)


def send_report_email(to_email: str, report: AnalysisReportInDB) -> None:
    _send_email(
        to_email,
        subject=f"AI分析レポート ({report.start_date} 〜 {report.end_date})",
        body=report.content,
        skip_log_context=f"user_id={report.user_id}",
    )


def send_reminder_email(to_email: str, date: str) -> None:
    _send_email(
        to_email,
        subject=f"ライフログ入力のお知らせ ({date})",
        body=f"{date} のライフログがまだ記録されていません。忘れずに記録しましょう。",
        skip_log_context=f"date={date}",
    )
