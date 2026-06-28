import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    files: ["src/app/lib/analytics/**/*.js", "src/app/lib/analytics/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/components/**", "**/app/components/**"],
              message: "Analytics Layer is forbidden from importing from the UI Layer."
            }
          ]
        }
      ]
    }
  },
  {
    files: ["src/components/**/*.js", "src/components/**/*.tsx", "src/app/components/**/*.js"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/analytics/**", "**/intelligence/**", "**/lib/analytics/**", "**/lib/intelligence/**"],
              message: "UI Layer is forbidden from importing from Analytics or Intelligence Layers."
            }
          ]
        }
      ]
    }
  },
  {
    files: ["src/app/api/**/*.js", "src/app/api/**/*.ts"],
    ignores: ["src/app/api/revenue/control-plane/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/analytics/**", "**/lib/analytics/**"],
              message: "Backend Layer is forbidden from importing from Analytics Layer logic."
            }
          ]
        }
      ]
    }
  },
  {
    files: ["lib/intelligence/**/*.ts", "lib/intelligence/**/*.js"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/src/app/**", "**/src/components/**", "**/lib/analytics/**"],
              message: "Intelligence Layer is forbidden from importing from runtime application code."
            }
          ]
        }
      ]
    }
  },
  {
    rules: {
      "no-restricted-imports": [
        "error",
        "reaction-engine",
        "pricing-sensitivity",
        "state-engine"
      ],
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react/no-unescaped-entities": "warn"
    }
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
