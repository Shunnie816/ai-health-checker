from unittest.mock import MagicMock

import pytest

from ai_health_checker import firebase_app


@pytest.fixture
def mock_firebase(monkeypatch: pytest.MonkeyPatch) -> dict[str, MagicMock]:
    """firebase_admin を未初期化状態にし、初期化呼び出しを記録できるようにする。"""
    initialize_app = MagicMock()
    certificate = MagicMock()
    monkeypatch.setattr(firebase_app.firebase_admin, "_apps", {})
    monkeypatch.setattr(firebase_app.firebase_admin, "initialize_app", initialize_app)
    monkeypatch.setattr(firebase_app.credentials, "Certificate", certificate)
    monkeypatch.delenv("FIRESTORE_EMULATOR_HOST", raising=False)
    monkeypatch.delenv("GOOGLE_APPLICATION_CREDENTIALS", raising=False)
    return {"initialize_app": initialize_app, "certificate": certificate}


class TestInitialize:
    def test_should_prefer_emulator_when_both_emulator_and_credentials_are_set(
        self, monkeypatch: pytest.MonkeyPatch, mock_firebase: dict[str, MagicMock]
    ) -> None:
        monkeypatch.setenv("FIRESTORE_EMULATOR_HOST", "localhost:8080")
        monkeypatch.setenv("GOOGLE_APPLICATION_CREDENTIALS", "/path/to/key.json")

        firebase_app._initialize()

        mock_firebase["certificate"].assert_not_called()
        _, kwargs = mock_firebase["initialize_app"].call_args
        assert kwargs["options"] == {"projectId": "ai-health-checker-stg"}

    def test_should_use_certificate_when_only_credentials_are_set(
        self, monkeypatch: pytest.MonkeyPatch, mock_firebase: dict[str, MagicMock]
    ) -> None:
        monkeypatch.setenv("GOOGLE_APPLICATION_CREDENTIALS", "/path/to/key.json")

        firebase_app._initialize()

        mock_firebase["certificate"].assert_called_once_with("/path/to/key.json")

    def test_should_use_default_credentials_when_nothing_is_set(
        self, mock_firebase: dict[str, MagicMock]
    ) -> None:
        firebase_app._initialize()

        mock_firebase["initialize_app"].assert_called_once_with()

    def test_should_not_reinitialize_when_already_initialized(
        self, monkeypatch: pytest.MonkeyPatch, mock_firebase: dict[str, MagicMock]
    ) -> None:
        monkeypatch.setattr(
            firebase_app.firebase_admin, "_apps", {"[DEFAULT]": MagicMock()}
        )

        firebase_app._initialize()

        mock_firebase["initialize_app"].assert_not_called()
