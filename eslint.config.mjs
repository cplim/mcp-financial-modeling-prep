import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "prefer-const": "error",
      "no-var": "error",
      "no-console": "warn",
    },
  },
  {
    ignores: ["dist/", "node_modules/", "tests/**/*.ts", "*.mjs", "*.config.*"],
  },
);
