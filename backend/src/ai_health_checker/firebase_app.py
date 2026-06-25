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
    else:
        firebase_admin.initialize_app()


def get_firestore() -> Client:
    _initialize()
    return cast(Client, firestore.client())
