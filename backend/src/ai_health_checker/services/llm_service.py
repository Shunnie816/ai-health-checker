import anthropic

_MODEL = "claude-haiku-4-5"

_SYSTEM_PROMPT = """\
あなたは個人のライフログ（気分・疲労度・勤務時間・運動・コメント）を\
分析するアシスタントです。与えられた期間のログから以下を日本語でレポートしてください。

- 全体的な傾向（気分・疲労度・残業の推移）
- 項目間の関係で注目すべき点（例: 残業が多い日の翌朝の気分、運動と疲労の関係）
- データに基づく、来週に向けた具体的なアドバイス（1〜2点）

制約:
- 記録されたデータから言えることだけを述べ、憶測は「可能性があります」と明示する
- 見出し記号や Markdown は使わず、段落分けしたプレーンテキストで書く
- 全体で400字程度に収める"""


def generate_analysis_report(prompt: str, user_id: str) -> str:
    """ログを整形したプロンプトから分析レポート本文を生成する。

    APIキーは環境変数 ANTHROPIC_API_KEY から解決される。
    """
    client = anthropic.Anthropic()
    response = client.messages.create(
        model=_MODEL,
        max_tokens=2048,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
        metadata={"user_id": user_id},
    )
    return "".join(
        block.text for block in response.content if block.type == "text"
    )
