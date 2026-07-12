import { test, expect, Page } from "@playwright/test";
import { resetEmulators, signInWithGoogle, createWeekdayLog } from "./helpers";

/**
 * デザイン確認用の全画面スクリーンショット採取（CI 対象外の作業用spec）。
 * SHOT_DIR にスクリーンショットを保存する。
 */
const SHOT_DIR = process.env.SHOT_DIR ?? "/tmp/design-shots";

const PROJECT_ID = "ai-health-checker-stg";
const AUTH_EMULATOR = "http://localhost:9099";
const FIRESTORE_EMULATOR = "http://localhost:8080";

async function getUid(): Promise<string> {
  const res = await fetch(
    `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:query`,
    {
      method: "POST",
      headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
      body: "{}",
    }
  );
  const data = await res.json();
  return data.userInfo[0].localId;
}

async function seedReport(uid: string): Promise<void> {
  await fetch(
    `${FIRESTORE_EMULATOR}/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}/reports/seed-report-1`,
    {
      method: "PATCH",
      headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          id: { stringValue: "seed-report-1" },
          user_id: { stringValue: uid },
          start_date: { stringValue: "2026-06-12" },
          end_date: { stringValue: "2026-07-11" },
          content: {
            stringValue:
              "直近30日間の記録では、平日の疲労度は平均2.8と安定しています。\n\n残業が90分を超えた日は翌朝の気分スコアが平均1.2ポイント低下する傾向がありました。ジムに行った日の翌日は疲労度がやや高いものの、気分スコアは高めです。\n\n引き続き残業時間の管理と週2回程度の運動を継続することをおすすめします。",
          },
          log_count: { integerValue: "3" },
          created_at: { timestampValue: new Date().toISOString() },
        },
      }),
    }
  );
}

async function captureAll(page: Page, prefix: string): Promise<void> {
  await resetEmulators();

  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Google でログイン" })).toBeVisible();
  await page.screenshot({ path: `${SHOT_DIR}/${prefix}login.png`, fullPage: true });

  await signInWithGoogle(page);
  await createWeekdayLog(page, { date: "2026-07-08", workEnd: "19:30" });
  await expect(page.getByText("2026/07/08")).toBeVisible();
  await createWeekdayLog(page, { date: "2026-07-09", workEnd: "18:00" });
  await expect(page.getByText("2026/07/09")).toBeVisible();
  await createWeekdayLog(page, { date: "2026-07-10", workEnd: "21:00" });
  await expect(page.getByText("2026/07/10")).toBeVisible();
  await page.screenshot({ path: `${SHOT_DIR}/${prefix}home.png`, fullPage: true });

  await page.getByRole("link", { name: "新規記録" }).click();
  await expect(page.getByText("新規記録")).toBeVisible();
  await page.screenshot({ path: `${SHOT_DIR}/${prefix}log-new.png`, fullPage: true });

  await page.goto("/");
  await page.getByText("2026/07/10").click();
  await expect(page.getByText("詳細・編集")).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: `${SHOT_DIR}/${prefix}log-edit.png`, fullPage: true });

  await page.goto("/graph");
  await expect(page.getByRole("heading", { name: "グラフ" })).toBeVisible();
  await page.waitForTimeout(1500); // recharts 描画待ち
  await page.screenshot({ path: `${SHOT_DIR}/${prefix}graph.png`, fullPage: true });

  const uid = await getUid();
  await seedReport(uid);
  await page.goto("/reports");
  await expect(page.getByText("2026/06/12")).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: `${SHOT_DIR}/${prefix}reports.png`, fullPage: true });

  await page.locator('a[href="/reports/seed-report-1"]').click();
  await expect(page).toHaveURL(/\/reports\/seed-report-1/, { timeout: 15_000 });
  await expect(page.getByText("対象ログ 3 件")).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: `${SHOT_DIR}/${prefix}report-detail.png`, fullPage: true });
}

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("全画面のスクリーンショットを採取する（モバイル）", async ({ page }) => {
    test.setTimeout(180_000);
    await captureAll(page, "");
  });
});

test.describe("desktop", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("全画面のスクリーンショットを採取する（PC）", async ({ page }) => {
    test.setTimeout(180_000);
    await captureAll(page, "desktop-");
  });
});
