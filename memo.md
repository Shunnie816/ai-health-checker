以下の文章はChatGPTで生成しており、私の意見から拡張された内容が入っています。実際に実装計画を立てる前に詳細は私にもう一度訪ねてください。

# プロジェクト引継ぎ（Claude Code用）

## プロジェクト概要

個人向け健康・幸福度分析アプリ。

当初はExcelで蓄積した健康記録をPythonで集計し、Dify + RAGで分析するPoCとして開始した。

現在は「Excel分析ツール」ではなく、

**個人のライフログを蓄積し、AIが長期分析できるプラットフォーム**

へ方向転換する予定。

---

## 最終目標

ユーザーの日常データを蓄積し、

* 健康状態
* 疲労状態
* 幸福度
* 行動パターン

をAIが分析できるようにする。

例：

* 幸福度が高い日の共通点
* 疲労が蓄積しやすい条件
* 残業と体調の関係
* 睡眠と気分の関係
* 運動習慣と幸福度の関係

など。

---

## 現在の到達点

PoCとして以下は実装済み。

### データ取得

* Excel読み込み
* Google Drive上のExcel読み込み

### ETL

* データ整形
* 月次集計

### 分析

* 平均残業
* 平均疲労度
* 平均気分
* 相関分析

### API

FastAPIで集計APIを公開済み。

### RAG

Dify Dataset APIを利用して

* 月次サマリー生成
* Dataset登録

まで動作確認済み。

### Dify

* Dataset登録
* Knowledge Retrieval
* ChatFlow

動作確認済み。

---

## 方針変更

現在の

```text
Excel
↓
ETL
↓
RAG
```

中心の構成は将来的には採用しない。

Excelは既存データの移行元としてのみ扱う。

---

## 今後のアーキテクチャ

```text
Next.js App
↓
Firestore
↓
FastAPI
↓
分析
↓
Dify Dataset
↓
LLM分析
```

---

## 技術スタック方針

フロントエンド

* Next.js
* TypeScript
* MUI

バックエンド

* FastAPI

データベース

* Firestore

AI

* Dify
* RAG

インフラ

* Docker
* Cloud Run（将来的）

---

## 設計方針

### 優先順位

1. 個人利用で便利
2. 拡張しやすい
3. AI分析しやすい

---

### 重要

最初から複雑な分析機能を作らない。

まずは

* データ入力
* データ蓄積

を最優先する。

分析は後から追加する。

---

## MVPで扱うデータ

最低限

```text
date
mood
fatigue
comment
```

を扱う。

---

## 将来的に追加したいデータ

```text
sleep_hours
exercise
happiness
overtime_minutes
reading_time
game_time
outside_activity
```

---

## 将来的な分析例

* 幸福度が高い日の共通点
* 疲労の原因分析
* 睡眠と幸福度の関係
* 運動と気分の関係
* 行動と幸福度の相関分析

---

## 開発時の考え方

AI分析部分よりも、

**「良いデータを蓄積する仕組み」**

を重視する。

分析ロジックは後から改善可能だが、蓄積されていないデータは後から取り戻せない。
