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
  // ═════════════════════════════════════════════════════════════════
  // PRICING CONTRACT GUARD — v1.1 HARDENED
  // ─────────────────────────────────────────────────────────────────
  // SOLE DECISION AUTHORITY: src/core/pricing/pricingViewModel.ts
  //
  // Every other file is FORBIDDEN from:
  //   • Selecting price based on billingPeriod
  //   • Accessing priceMonthly / priceYearly directly
  //   • Deriving paddle price IDs
  //   • Writing ternary expressions that produce price values
  //   • Applying numeric fallbacks to price fields
  // ═════════════════════════════════════════════════════════════════
  {
    // Covers ALL source files — pricingViewModel.ts is explicitly excluded below.
    files: [
      "src/**/*.js",
      "src/**/*.ts",
      "src/**/*.tsx",
      "lib/**/*.ts",
      "lib/**/*.js",
    ],
    ignores: [
      // The ONLY file authorised to make pricing decisions.
      "src/core/pricing/pricingViewModel.ts",
      // Guard itself is allowed to reference the patterns in strings/regexes.
      "src/core/pricing/pricingContractGuard.ts",
    ],
    rules: {
      // ── Structural / AST-level restrictions ───────────────────────
      "no-restricted-syntax": [
        "warn",

        // ❌ billingPeriod used as an identifier (any expression)
        {
          selector: "Identifier[name='billingPeriod']",
          message:
            "[PRICING CONTRACT v1.1] `billingPeriod` is forbidden outside pricingViewModel.ts. " +
            "All billing-period price decisions must live in getPricingViewModel().",
        },

        // ❌ .priceMonthly or .priceYearly member access (selection)
        {
          selector:
            "MemberExpression[property.name='priceMonthly'], " +
            "MemberExpression[property.name='priceYearly']",
          message:
            "[PRICING CONTRACT v1.1] `.priceMonthly` / `.priceYearly` selection is forbidden outside pricingViewModel.ts. " +
            "Use `vm.price` (already resolved by the viewModel).",
        },

        // ❌ priceMonthly / priceYearly as bare identifiers (destructuring)
        {
          selector:
            "Identifier[name='priceMonthly'], " +
            "Identifier[name='priceYearly']",
          message:
            "[PRICING CONTRACT v1.1] `priceMonthly` / `priceYearly` identifiers are forbidden outside pricingViewModel.ts. " +
            "Use `vm.price` (already resolved by the viewModel).",
        },

        // ❌ Paddle price ID field access (raw derivation)
        {
          selector:
            "MemberExpression[property.name='paddle_monthly_price_id'], " +
            "MemberExpression[property.name='paddle_yearly_price_id']",
          message:
            "[PRICING CONTRACT v1.1] Paddle price ID selection is forbidden outside pricingViewModel.ts. " +
            "Use `vm.priceMeta.priceId` (already resolved by the viewModel).",
        },

        // ❌ Ternary that returns a price-like value (shadow derivation)
        {
          selector:
            "ConditionalExpression > Identifier[name=/^price/], " +
            "ConditionalExpression > MemberExpression[property.name=/^price/]",
          message:
            "[PRICING CONTRACT v1.1] Ternary expressions returning price-related values are forbidden outside pricingViewModel.ts. " +
            "Derive `vm.price` in the viewModel and consume it here.",
        },
      ],

      // ── Import restrictions ────────────────────────────────────────
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              // Block any file from importing pricingViewModel internals
              // other than the sanctioned getPricingViewModel function and types.
              // (Re-exporting getPricingViewModel is fine; importing readPlanPrice etc. is not.)
              group: ["**/core/pricing/pricingViewModel"],
              importNamePattern:
                "^(readPlanPrice|STRICT_PLAN_IDS|readPlan|applyBilling)$",
              message:
                "[PRICING CONTRACT v1.1] Internal pricing helpers from pricingViewModel.ts must not be imported elsewhere. " +
                "Only `getPricingViewModel` (and its public types) may be consumed outside the viewModel.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([

    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
