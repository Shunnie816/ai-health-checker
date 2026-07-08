from unittest.mock import MagicMock

import pytest

from ai_health_checker.services import dify_service

TEST_USER_ID = "test-user-id"


class TestGenerateAnalysisReport:
    def test_should_return_answer_from_dify_response(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("APP_API_KEY", "test-app-api-key")
        mock_response = MagicMock()
        mock_response.json.return_value = {"answer": "疲労度と残業時間に強い相関があります。"}
        mock_post = MagicMock(return_value=mock_response)
        monkeypatch.setattr(dify_service.requests, "post", mock_post)

        result = dify_service.generate_analysis_report("ログを分析してください。", TEST_USER_ID)

        assert result == "疲労度と残業時間に強い相関があります。"
        mock_response.raise_for_status.assert_called_once()

    def test_should_call_chat_messages_endpoint_with_expected_payload(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setenv("APP_API_KEY", "test-app-api-key")
        mock_response = MagicMock()
        mock_response.json.return_value = {"answer": "ok"}
        mock_post = MagicMock(return_value=mock_response)
        monkeypatch.setattr(dify_service.requests, "post", mock_post)

        dify_service.generate_analysis_report("プロンプト", TEST_USER_ID)

        args, kwargs = mock_post.call_args
        assert args[0] == "https://api.dify.ai/v1/chat-messages"
        assert kwargs["headers"]["Authorization"] == "Bearer test-app-api-key"
        assert kwargs["json"] == {
            "inputs": {},
            "query": "プロンプト",
            "response_mode": "blocking",
            "user": TEST_USER_ID,
        }
