import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    // e2e/ は Playwright 管轄のため vitest の対象外にする
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
