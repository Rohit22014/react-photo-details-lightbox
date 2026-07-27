import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    settings: {
      next: {
        rootDir: "apps/docs/",
      },
    },
  },
  prettier,
  globalIgnores([
    "**/.next/**",
    "**/.open-next/**",
    "**/.sites-worker/**",
    "**/.wrangler/**",
    "**/coverage/**",
    "**/dist/**",
    "**/node_modules/**",
    "**/playwright-report/**",
    "**/test-results/**",
    "**/*.tsbuildinfo",
    "apps/docs/next-env.d.ts",
  ]),
]);
