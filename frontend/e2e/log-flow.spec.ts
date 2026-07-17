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

test("期間で絞り込むと該当期間のログのみ表示される", async ({ page }) => {
  await createWeekdayLog(page, { date: TEST_DATE });
  await expect(page.getByText(TEST_DATE_DISPLAY)).toBeVisible();

  // ログのない期間で絞り込むと空メッセージが表示される
  await page.getByRole("button", { name: "期間で絞り込む" }).click();
  await page.getByLabel("開始日").fill("2026-06-01");
  await page.getByLabel("終了日").fill("2026-06-30");
  await page.getByRole("button", { name: "絞り込む", exact: true }).click();
  await expect(page.getByText("この期間の記録はありません")).toBeVisible();

  // ログを含む期間へ変更すると表示される
  await page.getByLabel("終了日").fill("2026-07-31");
  await page.getByRole("button", { name: "絞り込む", exact: true }).click();
  await expect(page.getByText(TEST_DATE_DISPLAY)).toBeVisible();

  // クリアで通常表示に戻る
  await page.getByRole("button", { name: "クリア" }).click();
  await expect(page.getByText(TEST_DATE_DISPLAY)).toBeVisible();
});

test("「前回と同じ内容を入力」で前日の勤務時間と仕事内容が転記される", async ({ page }) => {
  // 前日分のログを仕事内容つきで作成する
  await page.getByRole("link", { name: "新規記録" }).click();
  await page.locator('input[type="date"]').fill(TEST_DATE);
  await page.locator('input[type="time"]').nth(0).fill("10:00");
  await page.locator('input[type="time"]').nth(1).fill("19:00");
  await page.getByPlaceholder("今日の業務内容…").fill("APIの実装");
  await page.getByRole("button", { name: "記録する" }).click();
  await expect(page.getByText(TEST_DATE_DISPLAY)).toBeVisible();

  // 翌日の新規記録でワンタップ転記する
  await page.getByRole("link", { name: "新規記録" }).click();
  await page.locator('input[type="date"]').fill("2026-07-02");
  await page.getByRole("button", { name: "前回と同じ内容を入力" }).click();

  await expect(page.locator('input[type="time"]').nth(0)).toHaveValue("10:00");
  await expect(page.locator('input[type="time"]').nth(1)).toHaveValue("19:00");
  await expect(page.getByPlaceholder("今日の業務内容…")).toHaveValue("APIの実装");
});

test("朝のみモードで記録し、あとから1日分へ追記できる", async ({ page }) => {
  // 朝: 朝のみモードに切り替えると勤務開始だけ入力して保存できる
  await page.getByRole("link", { name: "新規記録" }).click();
  await page.locator('input[type="date"]').fill(TEST_DATE);
  await page.getByRole("button", { name: "朝のみ" }).click();
  await page.locator('input[type="time"]').fill("09:00");
  await page.getByRole("button", { name: "朝の分を記録する" }).click();

  // 一覧には追記待ちバッジ付きで表示され、疲れ度は未入力
  await expect(page.getByText(TEST_DATE_DISPLAY)).toBeVisible();
  await expect(page.getByText("追記待ち")).toBeVisible();

  // 夕方: 編集画面を開くと朝のみモードで表示され、1日分へ切り替えて追記する
  await page.getByText(TEST_DATE_DISPLAY).click();
  await expect(page.getByText("詳細・編集")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "1日分" }).click();
  await page.locator('input[type="time"]').nth(1).fill("19:30");
  await page.getByRole("button", { name: "保存する" }).click();

  // 追記が完了して追記待ちが消え、残業スコアが自動計算される（09:00-19:30 → スコア3）
  await expect(page.getByText(TEST_DATE_DISPLAY)).toBeVisible();
  await expect(page.getByText("追記待ち")).toHaveCount(0);
  await expect(page.getByText("3", { exact: true }).first()).toBeVisible();
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
