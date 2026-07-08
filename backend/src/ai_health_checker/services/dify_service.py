import os

import requests

_CHAT_MESSAGES_URL = "https://api.dify.ai/v1/chat-messages"


def generate_analysis_report(prompt: str, user_id: str) -> str:
    headers = {
        "Authorization": f"Bearer {os.getenv('APP_API_KEY')}",
        "Content-Type": "application/json",
    }
    data = {
        "inputs": {},
        "query": prompt,
        "response_mode": "blocking",
        "user": user_id,
    }

    response = requests.post(
        _CHAT_MESSAGES_URL, headers=headers, json=data, timeout=60
    )
    response.raise_for_status()
    answer: str = response.json()["answer"]
    return answer
