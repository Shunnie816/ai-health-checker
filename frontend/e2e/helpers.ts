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

const TEST_EMAIL = "e2e-user@example.com";

/**
 * Auth エミュレータに Google 連携済みのテストユーザーを REST で事前作成する。
 * popup 内のアカウント新規作成フォーム（CI で不安定）を経由せずに済む。
 */
async function createEmulatorGoogleUser(): Promise<void> {
  const fakeIdToken = JSON.stringify({
    sub: "e2e-user",
    email: TEST_EMAIL,
    email_verified: true,
  });
  await fetch(
    `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=demo-api-key`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestUri: "http://localhost",
        returnSecureToken: true,
        postBody: `id_token=${encodeURIComponent(fakeIdToken)}&providerId=google.com`,
      }),
    }
  );
}

/**
 * Auth エミュレータの Google ログイン popup でサインインする。
 * 事前作成済みアカウントを選択するだけの安定したフロー。
 */
export async function signInWithGoogle(page: Page): Promise<void> {
  await createEmulatorGoogleUser();
  await page.goto("/login");

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "Google でログイン" }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState();

  // アカウント選択画面から事前作成したユーザーを選ぶ
  await popup.getByText(TEST_EMAIL).click();

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
