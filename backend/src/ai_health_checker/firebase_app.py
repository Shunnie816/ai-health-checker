import os
from typing import cast

import firebase_admin
from firebase_admin import credentials, firestore
from google.auth.credentials import AnonymousCredentials
from google.cloud.firestore import Client


class _EmulatorCredentials(credentials.Base):  # type: ignore[misc]
    """Firestore/Auth emulator 用のダミー認証情報。ADC 不要。"""

    def get_credential(self) -> AnonymousCredentials:
        return AnonymousCredentials()  # type: ignore[no-untyped-call]


def _initialize() -> None:
    if firebase_admin._apps:
        return
    # エミュレータ指定は明示的な切り替え操作なので、
    # GOOGLE_APPLICATION_CREDENTIALS の有無より優先する（実 stg への誤接続防止）
    if os.getenv("FIRESTORE_EMULATOR_HOST"):
        firebase_admin.initialize_app(
            _EmulatorCredentials(),
            options={"projectId": "ai-health-checker-stg"},
        )
        return
    key_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if key_path:
        firebase_admin.initialize_app(credentials.Certificate(key_path))
    else:
        # Cloud Run: Application Default Credentials を使用
        firebase_admin.initialize_app()


def get_firestore() -> Client:
    _initialize()
    return cast(Client, firestore.client())
