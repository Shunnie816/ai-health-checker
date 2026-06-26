import os
from typing import cast

import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore import Client


def _initialize() -> None:
    if firebase_admin._apps:
        return
    key_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if key_path:
        firebase_admin.initialize_app(credentials.Certificate(key_path))
    elif os.getenv("FIRESTORE_EMULATOR_HOST"):
        # エミュレータ使用時: 認証情報不要、デモプロジェクトIDで初期化
        firebase_admin.initialize_app(options={"projectId": "demo-local"})
    else:
        # Cloud Run: Application Default Credentials を使用
        firebase_admin.initialize_app()


def get_firestore() -> Client:
    _initialize()
    return cast(Client, firestore.client())
