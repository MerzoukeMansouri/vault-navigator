import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Use happy-dom for DOM environment (lighter than jsdom)
    environment: "happy-dom",

    // Global test utilities
    globals: true,

    // Setup files
    setupFiles: ["./vitest.setup.ts"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],

      // Only test business logic, not UI components
      include: [
        "hooks/**/*.{ts,tsx}",
        "lib/**/*.ts",
        "contexts/**/*.tsx",
      ],

      exclude: [
        "**/__tests__/**",
        "**/*.test.{ts,tsx}",
        "**/node_modules/**",
        "components/**", // Exclude UI components
        "app/**",        // Exclude pages
        "**/*.d.ts",
        "**/*.config.{ts,js}",
        "**/types.ts",
      ],

      // Coverage thresholds
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },

    // Exclude UI components from tests
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "components/**", // Skip component tests
      "app/**",        // Skip page tests
    ],
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
