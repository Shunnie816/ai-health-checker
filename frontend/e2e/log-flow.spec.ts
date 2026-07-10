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

// NOTE: 日付重複は本来登録不可にしたい仕様（#76）。
// このテストは現状挙動の文書化であり、#76 実装時に「登録できない」テストへ更新する。
test("同じ日付で2回記録すると一覧に2件表示される（現状の仕様）", async ({ page }) => {
  await createWeekdayLog(page, { date: TEST_DATE });
  await expect(page.getByText(TEST_DATE_DISPLAY)).toBeVisible();

  await createWeekdayLog(page, { date: TEST_DATE });

  // 日付重複はバックエンドで制限されず、2件とも登録される
  await expect(page.getByText(TEST_DATE_DISPLAY)).toHaveCount(2);
});
