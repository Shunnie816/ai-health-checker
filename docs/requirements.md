# アプリ要件定義

## 基本要件

| 項目 | 内容 |
|---|---|
| 利用者 | マルチユーザー（将来拡張を前提に設計） |
| 認証 | Firebase Auth |
| データ可視性 | ユーザーごとにプライベート |

---

## データモデル（ライフログ）

| フィールド | 型 | 必須 | 備考 |
|---|---|---|---|
| date | date | ✅ | 記録日 |
| is_holiday | bool | ✅ | 休日フラグ（true の場合、勤務時間不要） |
| mood | int | ✅ | 気分スコア |
| fatigue | int | ✅ | 疲労スコア |
| comment | text | - | 自由記述 |
| work_start | time | △ | 勤務開始時刻（is_holiday=false の場合必須） |
| work_end | time | △ | 勤務終了時刻（is_holiday=false の場合必須） |
| overtime_minutes | int | - | 自動算出（work_start / work_end から計算） |
| overtime_score | int | - | ルールで自動算出（下記参照） |
| gym | bool | - | ジム行ったチェック |
| sleep_hours | float | - | Apple Health 連携（将来対応） |
| weight | float | - | Apple Health 連携（将来対応） |

### 残業スコア算出ルール

```
overtime_minutes = 0          → score 0
0  < overtime_minutes ≤ 30   → score 1
30 < overtime_minutes ≤ 60   → score 2
60 < overtime_minutes ≤ 90   → score 3
90 < overtime_minutes ≤ 120  → score 4
overtime_minutes > 120        → score 5
```

### 休日フラグの仕様

- `is_holiday = true` の日は `work_start` / `work_end` / `overtime_minutes` / `overtime_score` が任意
- 既存 Excel では仕事のある日のみ記録していたが、アプリではすべての日に記録できるようにする
- カレンダービューで休日かどうかを視覚的に区別する

---

## 入力・記録仕様

- **入力頻度**: 毎日、1日複数回入力可
- **編集**: 可
- **削除**: 不要

---

## 画面・ビュー（優先順）

1. **一覧** — ログの一覧表示（メイン）
2. **グラフ** — トレンド可視化
3. **カレンダー** — 過去日付へのナビゲーション用途（将来対応）

---

## AI 分析

| 項目 | 内容 |
|---|---|
| 実行タイミング | 手動実行 + 定期実行（Cloud Scheduler）の両対応 |
| 出力形式 | テキストレポート（グラフ付き） |
| 将来拡張 | チャット機能を追加して詳細深掘り可能に |

---

## 通知

- **種別**: Email
- **用途**: 入力リマインダー + 分析レポート配信

---

## MVP スコープ

### MVP に含む

- Firebase Auth（マルチユーザー）
- ライフログ入力（mood / fatigue / work_start・end / gym / comment / is_holiday）
- 残業スコア自動算出
- 記録の編集
- 一覧ビュー
- グラフビュー
- AI テキストレポート（グラフ付き）
- Email 通知（入力リマインダー）

### 将来対応

- カレンダービュー
- Apple Health 連携（睡眠・体重）
- AI チャット深掘り機能
- UI ライブラリは後で検討
