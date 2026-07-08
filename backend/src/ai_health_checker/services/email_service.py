import logging
import os
import smtplib
from email.message import EmailMessage

from ai_health_checker.models.analysis import AnalysisReportInDB

logger = logging.getLogger(__name__)


def send_report_email(to_email: str, report: AnalysisReportInDB) -> None:
    smtp_host = os.getenv("SMTP_HOST")
    if not smtp_host:
        logger.info(
            "SMTP_HOST が未設定のため、レポートメール送信をスキップしました "
            "(user_id=%s)",
            report.user_id,
        )
        return

    message = EmailMessage()
    message["Subject"] = f"AI分析レポート ({report.start_date} 〜 {report.end_date})"
    message["From"] = os.getenv("EMAIL_FROM", "")
    message["To"] = to_email
    message.set_content(report.content)

    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        if smtp_user and smtp_password:
            server.login(smtp_user, smtp_password)
        server.send_message(message)
