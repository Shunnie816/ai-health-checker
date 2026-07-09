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
make emulator      # Auth + Firestore エミュレータ起動
make run-emulator  # エミュレータに接続してバックエンド起動
```

### 環境変数

`frontend/.env.local` を `.env.local.example` をもとに作成：

```bash
cp frontend/.env.local.example frontend/.env.local
```

## ローカル動作確認の2パターン

### パターン1: フル emulator（日常開発）

実環境に一切接続せず、ローカルで完結する構成。

```bash
make emulator      # ターミナル1: Auth + Firestore エミュレータ
make run-emulator  # ターミナル2: バックエンド（エミュレータ接続）
cd frontend && npm run dev  # ターミナル3: フロントエンド
```

- `frontend/.env.local` に `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` を設定する
- `make run-emulator` は `FIRESTORE_EMULATOR_HOST` を設定するため、
  `.env` に `GOOGLE_APPLICATION_CREDENTIALS` があってもエミュレータ接続が優先される

### パターン2: 実 stg 接続（結合確認）

実 Firebase Auth・Firestore（staging）に接続してエンドツーエンドで確認する構成。

```bash
make run                    # ターミナル1: バックエンド（.env の GOOGLE_APPLICATION_CREDENTIALS で実 Firestore に接続）
cd frontend && npm run dev  # ターミナル2: フロントエンド
```

- `frontend/.env.local` に `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false` を設定し、
  実 Firebase プロジェクト（stg）の `NEXT_PUBLIC_FIREBASE_*` を設定する
- **注意**: staging の実データを読み書きするため、確認後は不要データを削除すること

> エミュレータのフロントとバックエンドを混在させると、エミュレータ発行の
> Auth トークンを実 Firebase Auth が検証できず 401 になる。
> フロント・バックエンドは必ず同じパターンに揃えること。

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
