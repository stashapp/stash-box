import tseslint from 'typescript-eslint';
import reactRecommendedConfig from "eslint-plugin-react/configs/recommended.js"
import reactJSXConfig from "eslint-plugin-react/configs/jsx-runtime.js"
import reactHooks from "eslint-plugin-react-hooks";
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  tseslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  reactRecommendedConfig,
  reactJSXConfig,
  importPlugin.flatConfigs.recommended,
  jsxA11y.flatConfigs.recommended,
  eslintConfigPrettier,
  {
    ignores: ["**/vite.config.js"],

    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    plugins: {
        "react-hooks": reactHooks,
    },

    settings: {
        react: {
            version: "detect",
        },
    },

    rules: {
        ...reactHooks.configs.recommended.rules,
        "react/prop-types": "off",

        "@typescript-eslint/no-use-before-define": ["error", {
            functions: false,
            classes: true,
        }],

        "@typescript-eslint/no-floating-promises": "off",
        "@typescript-eslint/restrict-template-expressions": "off",

        "@typescript-eslint/no-unused-vars": ["error", {
            "vars": "all",
            "args": "after-used",
            "ignoreRestSiblings": true,
        }],

        "prefer-destructuring": ["error", {
            object: true,
            array: false,
        }],

        "import/named": "off",
        "import/namespace": "off",
        "import/no-unresolved": "off",

        "@typescript-eslint/no-misused-promises": ["error", {
            checksVoidReturn: false,
        }],

        "jsx-a11y/no-autofocus": "off",
    },
});
