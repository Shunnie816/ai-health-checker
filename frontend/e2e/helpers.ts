import { Page, expect } from "@playwright/test";

const PROJECT_ID = "ai-health-checker-stg";
const FIRESTORE_EMULATOR = "http://localhost:8080";
const AUTH_EMULATOR = "http://localhost:9099";

/** Firestore・Auth エミュレータの全データを削除し、テストを独立させる */
export async function resetEmulators(): Promise<void> {
  await fetch(
    `${FIRESTORE_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: "DELETE" }
  );
  await fetch(
    `${AUTH_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/accounts`,
    { method: "DELETE" }
  );
}

/**
 * Auth エミュレータの Google ログイン popup を操作してサインインする。
 * popup はエミュレータが提供する擬似アカウント選択画面。
 */
export async function signInWithGoogle(page: Page): Promise<void> {
  await page.goto("/login");

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Google でログイン" }).click();
  const popup = await popupPromise;

  await popup.getByRole("button", { name: "Add new account" }).click();
  await popup
    .getByRole("button", { name: "Auto-generate user information" })
    .click();
  await popup.getByRole("button", { name: "Sign in with Google.com" }).click();

  // ホーム画面に遷移したらログイン完了
  await expect(
    page.getByRole("heading", { name: "HealthLog" })
  ).toBeVisible();
}

/** 新規記録フォームで平日ログを入力して保存する */
export async function createWeekdayLog(
  page: Page,
  { date, workStart = "09:00", workEnd = "18:00" }: {
    date: string;
    workStart?: string;
    workEnd?: string;
  }
): Promise<void> {
  await page.getByRole("link", { name: "新規記録" }).click();
  await expect(page.getByText("新規記録")).toBeVisible();

  await page.locator('input[type="date"]').fill(date);
  await page.locator('input[type="time"]').nth(0).fill(workStart);
  await page.locator('input[type="time"]').nth(1).fill(workEnd);
  await page.getByRole("button", { name: "記録する" }).click();
}
