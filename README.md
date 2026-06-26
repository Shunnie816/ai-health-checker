# ai-health-checker

個人のライフログを蓄積し、AI が長期分析できるプラットフォーム。

## 概要

毎日の気分・疲労・勤務時間などを記録し、AI（Dify RAG）による分析で  
「幸福度が高い日の共通点」「疲労の傾向」「残業と体調の関係」などを可視化する。

## アーキテクチャ

```
Firebase App Hosting（Next.js）
        ↓ Firebase Auth token
Cloud Run（FastAPI）
  ├── Firestore    ← CRUD
  ├── Dify API     ← AI 分析
  └── Email        ← 通知
```

## テックスタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | Next.js / TypeScript |
| バックエンド | Python / FastAPI |
| 認証 | Firebase Auth |
| データベース | Firestore |
| AI | Dify / RAG |
| インフラ | Cloud Run / Firebase App Hosting |

## セットアップ

### バックエンド

```bash
make venv    # 仮想環境セットアップ
make sync    # 依存関係インストール
make run     # FastAPI サーバー起動（http://localhost:8000）
```

### フロントエンド

```bash
cd frontend
npm install
npm run dev  # 開発サーバー起動（http://localhost:3000）
```

### Firebase エミュレータ

```bash
make run-emulator  # Auth + Firestore エミュレータ起動
```

### 環境変数

`frontend/.env.local` を `.env.local.example` をもとに作成：

```bash
cp frontend/.env.local.example frontend/.env.local
```

## 開発コマンド

```bash
make lint        # Ruff lint チェック
make lint-fix    # Ruff 自動修正 + Black フォーマット
make typecheck   # mypy 型チェック
make test        # pytest 実行
```

## ドキュメント

- [要件定義](docs/requirements.md)
- [アーキテクチャ設計](docs/architecture.md)
