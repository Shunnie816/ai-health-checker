# ai-health-checker — Claude Code ガイド

## プロジェクト概要

個人のライフログを蓄積し、AIが長期分析できるプラットフォーム。

**現在のフェーズ**: PoC（Excel → ETL → Dify RAG）  
**将来のゴール**: Next.js + Firestore + FastAPI + Dify による本格的なライフログプラットフォーム

> 詳細は `docs/` を参照：
> - [要件定義](docs/requirements.md) — データモデル・MVP スコープ・機能仕様
> - [アーキテクチャ設計](docs/architecture.md) — 全体構成・データフロー・ディレクトリ設計

---

## アーキテクチャ（概要）

```
Firebase App Hosting（Next.js）
        ↓ Firebase Auth token
Cloud Run（FastAPI）
  ├── Firestore    ← CRUD
  ├── Dify API     ← AI 分析
  └── Email        ← 通知
        ↑
Cloud Scheduler（定期実行）
```

詳細: [docs/architecture.md](docs/architecture.md)

---

## テックスタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | Next.js / TypeScript（UI ライブラリは未定） |
| バックエンド | Python / FastAPI |
| 認証 | Firebase Auth |
| データベース | Firestore |
| AI | Dify / RAG |
| インフラ | Cloud Run（backend）/ Firebase App Hosting（frontend） |
| 通知 | Email |

---

## ディレクトリ構成

```
ai-health-checker/
├── backend/                      # FastAPI (Cloud Run)
│   ├── src/ai_health_checker/
│   │   ├── main.py               # FastAPI エントリーポイント
│   │   ├── etl.py                # PoC: Excel 読み込み（移行スクリプト用）
│   │   ├── analysis.py           # PoC: 月次集計・相関分析
│   │   └── dify.py               # PoC: Dify Dataset API 連携
│   ├── tests/
│   ├── requirements.in
│   └── requirements.txt
├── frontend/                     # Next.js (App Hosting) ※ 未作成
├── docs/                         # 要件・設計ドキュメント
│   ├── requirements.md
│   └── architecture.md
├── pyproject.toml                # ruff / black / mypy 設定
├── makefile
└── .github/workflows/
```

---

## 利用可能なコマンド

```bash
make venv        # 仮想環境セットアップ
make run         # FastAPI サーバー起動
make lint        # Ruff lint チェック
make lint-fix    # Ruff 自動修正 + Black フォーマット
make format      # Black フォーマットのみ
make typecheck   # mypy 型チェック
make test        # pytest 実行
make compile     # requirements.txt 更新（pip-compile）
make sync        # 環境を requirements.txt に同期
make clean       # venv 削除
```

---

## 環境変数

`.env` ファイルに以下を設定：

```
DATASET_API_KEY=  # Dify Dataset API キー
DATASET_ID=       # Dify Dataset ID
```

---

## Git ワークフロー

- **main**: プロダクションブランチ。直接 commit・push 禁止
- **作業ブランチ**: `{prefix}/issue-{number}-{slug}` のみ。**develop ブランチは使用しない**
  - 例: `feature/issue-1-firestore-data-model`
  - プレフィックス: `feature`, `fix`, `chore`, `refactor`, `docs`, `test`
- **Issue 駆動開発**: 必ず GitHub Issue を起点に作業開始
- **commit メッセージ**: Conventional Commits 形式
  - `feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`

---

## 開発方針

- **優先順位**: データ入力・蓄積 → 分析機能
- **MVP データ**: `date`, `is_holiday`, `mood`, `fatigue`, `work_start`, `work_end`, `overtime_score`, `gym`, `comment`
- 最初から複雑な分析機能を作らない
- 蓄積されていないデータは後から取り戻せない
- 詳細スコープは [docs/requirements.md](docs/requirements.md) を参照

---

## CI

GitHub Actions（`.github/workflows/ci.yml`）が PR・main push 時に以下を実行：
- `ruff check backend/src/`（lint）
- `mypy backend/src/`（型チェック）

Claude は PR 作成前に必ず `make lint` と `make typecheck` を実行する。
