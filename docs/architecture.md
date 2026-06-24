# アーキテクチャ設計

## 全体構成

```
[Firebase App Hosting]
  Next.js (TypeScript)
          ↓ Firebase Auth token
[Cloud Run]
  FastAPI (Python)
  ├── Firestore (Firebase Admin SDK)  ← CRUD
  ├── Dify API                        ← AI 分析
  └── Email 通知                      ← リマインダー・レポート配信
          ↑ 定期トリガー
[Cloud Scheduler]
  定期 AI 分析

[Firebase Auth]   ← 認証（全ユーザー共通）
[Firestore]       ← ライフログデータ・分析レポート
```

## データフロー

### ライフログ入力

```
ユーザー → Next.js → FastAPI（バリデーション・残業スコア算出）→ Firestore
```

### AI 分析（手動 or 定期）

```
Cloud Scheduler / 手動 → FastAPI → Firestore（ログ取得）→ Dify API → Firestore（レポート保存）→ Email 送信
```

### 閲覧

```
Next.js → FastAPI → Firestore → 一覧 / グラフ表示
```

---

## 設計上の決定事項

| 項目 | 決定 | 理由 |
|---|---|---|
| 認証 | Firebase Auth | マルチユーザー対応、Firebase エコシステムと統合 |
| CRUD | すべて FastAPI 経由 | 残業スコア算出等のビジネスロジックをバックエンドに集約 |
| フロントホスティング | Firebase App Hosting | Next.js ネイティブ対応 |
| バックエンドホスティング | Cloud Run | FastAPI コンテナをそのまま動かせる唯一の Firebase エコシステム選択肢 |
| DB | Firestore | Firebase Admin SDK で FastAPI から操作 |
| AI 連携 | Dify API（REST） | 手動実行 + Cloud Scheduler による定期実行の両対応 |
| AI 出力形式 | テキストレポート（グラフ付き） | 将来チャット機能を追加予定 |
| 通知 | Email | 入力リマインダー + 分析レポート配信 |
| UI ライブラリ | 未定（後で検討） | — |

---

## mono-repo ディレクトリ構成

```
ai-health-checker/
├── backend/                      # FastAPI (Cloud Run)
│   ├── src/ai_health_checker/
│   │   ├── main.py
│   │   ├── routers/
│   │   ├── models/
│   │   └── services/
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.in
├── frontend/                     # Next.js (App Hosting)
│   ├── src/
│   ├── public/
│   └── package.json
├── docs/                         # 要件・設計ドキュメント
│   ├── requirements.md
│   └── architecture.md
├── .github/workflows/
├── CLAUDE.md
└── firebase.json
```

---

## 将来拡張候補

- Apple Health 連携（睡眠・体重）
- カレンダービュー
- AI チャット深掘り機能
- レポート PDF 保存（Cloud Storage）
