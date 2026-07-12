import { test, expect } from "@playwright/test";
import { resetEmulators, signInWithGoogle, createWeekdayLog } from "./helpers";

const TEST_DATE = "2026-07-01";
const TEST_DATE_DISPLAY = "2026/07/01";

test.beforeEach(async ({ page }) => {
  await resetEmulators();
  await signInWithGoogle(page);
});

test("ログを記録すると一覧に反映される（ゴールデンパス）", async ({ page }) => {
  await expect(page.getByText("まだログがありません")).toBeVisible();

  await createWeekdayLog(page, { date: TEST_DATE, workEnd: "19:30" });

  // 一覧に戻り、記録したログが表示される
  await expect(page.getByText(TEST_DATE_DISPLAY)).toBeVisible();
  await expect(page.getByText("平日")).toBeVisible();
  // 09:00-19:30 勤務 → 残業90分 → スコア3（自動算出の反映確認）
  await expect(page.getByText("3", { exact: true }).first()).toBeVisible();
});

test("勤務時刻が未入力のまま保存すると送信がブロックされる", async ({ page }) => {
  await page.getByRole("link", { name: "新規記録" }).click();
  await page.locator('input[type="date"]').fill(TEST_DATE);

  // 開始・終了を空のまま送信
  await page.getByRole("button", { name: "記録する" }).click();

  // フォーム画面に留まる（required によるブロック）
  await expect(page).toHaveURL(/\/logs\/new/);

  // ホームに戻ってもログは作成されていない
  await page.getByRole("button", { name: "戻る" }).click();
  await expect(page.getByText("まだログがありません")).toBeVisible();
});

test("記録済みの日付を選ぶと編集画面へ誘導され、二重登録できない", async ({ page }) => {
  await createWeekdayLog(page, { date: TEST_DATE });
  await expect(page.getByText(TEST_DATE_DISPLAY)).toBeVisible();

  // 同じ日付で新規記録を試みる
  await page.getByRole("link", { name: "新規記録" }).click();
  await page.locator('input[type="date"]').fill(TEST_DATE);

  // 記録済みバナーが表示され、送信ボタンが無効になる
  await expect(page.getByText("この日付は記録済みです")).toBeVisible();
  await expect(page.getByRole("button", { name: "記録する" })).toBeDisabled();

  // 編集画面へ遷移できる（dev サーバーの初回コンパイルを考慮して長めに待つ）
  await page.getByRole("button", { name: "編集画面を開く" }).click();
  await expect(page.getByText("詳細・編集")).toBeVisible({ timeout: 15_000 });

  // 一覧に戻っても1件のまま（二重登録されていない）
  await page.goto("/");
  await expect(page.getByText(TEST_DATE_DISPLAY)).toHaveCount(1);
});

test("休日フラグの切り替えが保存され一覧に反映される", async ({ page }) => {
  await createWeekdayLog(page, { date: TEST_DATE });
  await expect(page.getByText(TEST_DATE_DISPLAY)).toBeVisible();

  // 編集画面で休日に切り替えて保存
  await page.getByText(TEST_DATE_DISPLAY).click();
  await expect(page.getByText("詳細・編集")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("switch").first().click();
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(page.getByText("休日")).toBeVisible();

  // 平日に戻して保存（勤務時刻は再入力が必要）
  await page.getByText(TEST_DATE_DISPLAY).click();
  await expect(page.getByText("詳細・編集")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("switch").first().click();
  await page.locator('input[type="time"]').nth(0).fill("09:00");
  await page.locator('input[type="time"]').nth(1).fill("18:00");
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(page.getByText("平日")).toBeVisible();
});
