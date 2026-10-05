import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules/**", ".vercel/**", "dist/**"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: { ...globals.node, fetch: "readonly" },
    },
    rules: {
      "no-console": ["error", { allow: ["error", "warn"] }],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
);
