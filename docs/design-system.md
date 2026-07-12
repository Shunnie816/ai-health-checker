# デザインシステム

HealthLog（ai-health-checker frontend）のデザイントークンと運用ルール。
トークンの唯一の情報源は `frontend/src/app/globals.css`。

## 原則

1. **色はトークン経由のみ** — コンポーネントで oklch / hex を直書きしない
2. **ダークモードは OS 設定に追従** — `prefers-color-scheme` のみ。クラス切替（`.dark`）は採用しない。トークンがライト/ダーク両方の値を持つため、コンポーネント側で `dark:` バリアントを書く必要はない
3. **Tailwind ユーティリティを使う** — `bg-[var(--color-surface-1)]` のような任意値記法ではなく `bg-surface-1` を使う（`@theme inline` でマッピング済み）
4. **タイポ・スペーシングは Tailwind 標準スケール** — 独自トークンは持たない。`text-[13px]` などの任意値は原則禁止（Phase2 で標準スケールに寄せる）

## カラートークン

### セマンティックカラー（Tailwind ユーティリティあり）

| 用途 | トークン | ユーティリティ例 |
|---|---|---|
| ページ背景 | `--color-bg` | `bg-canvas` |
| カード・サーフェス | `--color-surface-1` / `--color-surface-2` | `bg-surface-1` |
| テキスト（主） | `--color-text-primary` | `text-fg` |
| テキスト（副） | `--color-text-secondary` | `text-fg-secondary` |
| テキスト（弱） | `--color-text-muted` | `text-fg-muted` |
| ボーダー | `--color-border` / `--color-border-strong` | `border-border` |
| プライマリ（teal） | `--color-primary` / `-hover` / `-subtle` | `bg-primary` |
| セカンダリ（sage） | `--color-secondary` / `-subtle` | `bg-secondary` |
| デンジャー | `--color-danger` / `-subtle` | `text-danger` / `bg-danger-subtle` |

`-subtle` はバナー・チップなどの淡い背景用。前景には対応する濃色を合わせる
（例: `bg-danger-subtle text-danger`）。

### データカラー（JS から動的参照）

値に応じて色が変わるデータ表示用。`lib/colors.ts` のゲッター経由で使う。

- **Emotion（気分 -5〜+5）**: `--color-emotion-n5` 〜 `--color-emotion-p5`
  — 負は赤〜黄、0 はニュートラルグレー、正は緑〜teal
  — `getEmotionColor(value)`
- **Fatigue（疲れ度 1〜5）**: `--color-fatigue-1` 〜 `--color-fatigue-5`
  — 1 が緑（快適）、5 が赤（疲弊） — `getFatigueColor(value)`
- **残業スコア**: 専用トークンはなく `getOvertimeColor(score)` がセマンティック
  カラーへ振り分け（0=primary / 1-2=警告 / 3+=danger）

## シャドウ

| トークン | ユーティリティ | 用途 |
|---|---|---|
| `--shadow-card` | `shadow-card` | カードの浮き |
| `--shadow-overlay` | `shadow-overlay` | ボトムシート・モーダル |

## タイポグラフィ

- フォント: Noto Sans JP（`next/font` が `--font-sans` を注入、`body` で適用）
- サイズ: Tailwind 標準（`text-xs` 12px / `text-sm` 14px / `text-base` 16px /
  `text-lg` 18px / `text-xl` 20px）
- ウェイト: `font-normal` (400) / `font-medium` (500) / `font-semibold` (600) の3段のみ

> 現状の画面には `text-[11px]` `text-[13px]` `text-[15px]` などの任意値が
> 残っている。Phase2（#80）のリデザインで標準スケールへ集約する。

## 角丸

現状の事実上の運用: カード = `rounded-xl`、ピル・ボタン = `rounded-full`。
Phase2 でこの2段+入力欄用の計3段に標準化する。

## レイアウト

- モバイルファースト。PC は中央寄せ＋コンテンツ幅制限で対応
  - 基本コンテンツ幅: `max-w-lg`（512px）
  - グラフ画面のみ `max-w-3xl`（768px）
  - ヘッダーは `PageHeader` の `containerClassName` で本文と同じ幅に揃える
  - ホームの FAB はコンテンツカラムの右端に追従
    （`right-[max(1.25rem,calc(50%-14.75rem))]`）
- 画面ヘッダーは `components/ui/page-header.tsx`（PageHeader）を使う
- 読み込み中・空状態・エラーは `components/ui/status.tsx`
  （LoadingText / EmptyMessage / ErrorBanner）を使う

## Claude Design 連携

デザインシステムのプレビューは claude.ai/design のプロジェクトに同期する。
プレビューのソースは `frontend/design-system/`（`@dsCard` マーカー付き HTML）。
トークンを変更したら同期し直すこと。
