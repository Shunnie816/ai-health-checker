import { defineConfig } from "@playwright/test";

/**
 * E2E はフルエミュレータ構成で実行する（実 stg には接続しない）:
 *   Firebase Emulator (Auth:9099 / Firestore:8080)
 *   + ローカルバックエンド (:8000) + ローカルフロントエンド (:3000)
 *
 * エミュレータは playwright の外側で起動する前提（`make e2e` が
 * firebase emulators:exec でラップする）。バックエンド・フロントエンドは
 * 下記 webServer が起動する。
 */

// CI では venv がないため、環境変数でバックエンド起動コマンドを差し替えられるようにする
// cwd はリポジトリルート（下記 webServer の cwd: ".."）
const backendCommand =
  process.env.E2E_BACKEND_COMMAND ??
  "venv/bin/python -m uvicorn ai_health_checker.main:app --port 8000";

export default defineConfig({
  testDir: "./e2e",
  // design-shots はデザイン確認用のスクリーンショット採取専用。
  // 通常の E2E 実行からは除外し、DESIGN_SHOTS=1 のときだけ動かす
  testIgnore: process.env.DESIGN_SHOTS ? [] : ["**/design-shots.spec.ts"],
  fullyParallel: false, // エミュレータのデータをテスト間でリセットするため直列実行
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: backendCommand,
      cwd: "..",
      port: 8000,
      reuseExistingServer: !process.env.CI,
      env: {
        PYTHONPATH: "backend/src",
        FIRESTORE_EMULATOR_HOST: "localhost:8080",
        FIREBASE_AUTH_EMULATOR_HOST: "localhost:9099",
      },
      timeout: 60_000,
    },
    {
      command: "npm run dev",
      port: 3000,
      reuseExistingServer: !process.env.CI,
      env: {
        NEXT_PUBLIC_USE_FIREBASE_EMULATOR: "true",
        NEXT_PUBLIC_BACKEND_URL: "http://localhost:8000",
        // Auth エミュレータ利用時は実キー不要（非空であればよい）
        NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "localhost",
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: "ai-health-checker-stg",
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "demo.appspot.com",
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "000000000000",
        NEXT_PUBLIC_FIREBASE_APP_ID: "demo-app-id",
      },
      timeout: 120_000,
    },
  ],
});
