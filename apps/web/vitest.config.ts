import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // tsconfig는 Next.js 빌드용으로 jsx: "preserve"이므로 테스트에서는 JSX를 직접 변환한다.
  oxc: {
    jsx: { runtime: "automatic" },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@fragment/shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
  },
  test: {
    css: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
  },
});
