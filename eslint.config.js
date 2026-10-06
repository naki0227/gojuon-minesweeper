const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/**", ".expo/**", "coverage/**"],
    rules: { "@typescript-eslint/array-type": "off" },
  },
]);
