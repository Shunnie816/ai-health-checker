import os

import requests
from dotenv import load_dotenv

# .env 読み込み
load_dotenv()

# 環境変数取得
API_KEY = os.getenv("DATASET_API_KEY")
DATASET_ID = os.getenv("DATASET_ID")


def register_to_dify(name: str, text: list[str]) -> requests.Response:
    url = f"https://api.dify.ai/v1/datasets/{DATASET_ID}/document/create-by-text"

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    data = {
        "name": name,
        "text": text,
        "indexing_technique": "high_quality",
    }

    return requests.post(url, headers=headers, json=data)
