import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

/** `next lint` is deprecated and prompts interactively when no config exists,
 *  which meant `pnpm lint` could never run unattended. This is the ESLint CLI
 *  path Next recommends instead. */
const config = [
  { ignores: [".next/**", "node_modules/**", "prisma/migrations/**", "app.js", "index.html", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
];

export default config;
