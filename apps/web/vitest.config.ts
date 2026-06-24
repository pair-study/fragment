import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@fragment/shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
  },
  test: {
    css: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
