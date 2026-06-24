# ai-health-checker — Claude Code ガイド

## プロジェクト概要

個人のライフログを蓄積し、AIが長期分析できるプラットフォーム。

**現在のフェーズ**: PoC（Excel → ETL → Dify RAG）  
**将来のゴール**: Next.js + Firestore + FastAPI + Dify による本格的なライフログプラットフォーム

---

## アーキテクチャ

### 現在（PoC）
```
Excel（Google Drive）
↓
ETL（pandas）
↓
FastAPI
↓
Dify Dataset（RAG）
```

### 将来（移行先）
```
Next.js App（データ入力フォーム）
↓
Firestore（ライフログ蓄積）
↓
FastAPI（分析 API）
↓
Dify Dataset（RAG）
↓
LLM 分析
```

---

## テックスタック

| レイヤー | 技術 |
|---|---|
| バックエンド | Python / FastAPI |
| データ処理 | pandas |
| データベース（将来） | Firestore |
| フロントエンド（将来） | Next.js / TypeScript / MUI |
| AI | Dify / RAG |
| インフラ（将来） | Docker / Cloud Run |

---

## ディレクトリ構成

```
src/ai_health_checker/
├── __init__.py
├── main.py        # FastAPI エントリーポイント（POST /generate-and-register）
├── etl.py         # Excel 読み込み・データ整形
├── analysis.py    # 月次集計・相関分析・サマリー生成
└── dify.py        # Dify Dataset API 連携

tests/             # pytest テスト（Issue 駆動で追加予定）
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
- **ブランチ命名規則**: `{prefix}/issue-{number}-{slug}`
  - 例: `feature/issue-1-firestore-data-model`
  - プレフィックス: `feature`, `fix`, `chore`, `refactor`, `docs`, `test`
- **Issue 駆動開発**: 必ず GitHub Issue を起点に作業開始
- **commit メッセージ**: Conventional Commits 形式
  - `feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`

---

## 開発方針

- **優先順位**: データ入力・蓄積 → 分析機能
- **MVP で扱うデータ**: `date`, `mood`, `fatigue`, `comment`
- 最初から複雑な分析機能を作らない
- 蓄積されていないデータは後から取り戻せない

---

## CI

GitHub Actions（`.github/workflows/ci.yml`）が PR・main push 時に以下を実行：
- `ruff check src/`（lint）
- `mypy src/`（型チェック）

Claude は PR 作成前に必ず `make lint` と `make typecheck` を実行する。
