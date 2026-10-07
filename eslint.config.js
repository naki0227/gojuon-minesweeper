const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/**", ".expo/**", "coverage/**", "supabase/**"],
    rules: { "@typescript-eslint/array-type": "off" },
  },
]);
