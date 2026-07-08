from unittest.mock import MagicMock

import pytest

from ai_health_checker import dependencies

TEST_USER_ID = "test-user-id"


class TestGetUserEmail:
    def test_should_return_email_when_user_exists(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(dependencies, "_initialize", MagicMock())
        mock_user = MagicMock(email="user@example.com")
        monkeypatch.setattr(
            dependencies.auth, "get_user", MagicMock(return_value=mock_user)
        )

        result = dependencies.get_user_email(TEST_USER_ID)

        assert result == "user@example.com"

    def test_should_return_none_when_lookup_fails(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(dependencies, "_initialize", MagicMock())
        monkeypatch.setattr(
            dependencies.auth,
            "get_user",
            MagicMock(side_effect=Exception("user not found")),
        )

        result = dependencies.get_user_email(TEST_USER_ID)

        assert result is None
