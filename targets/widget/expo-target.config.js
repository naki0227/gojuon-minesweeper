// The 今日の一問 widgets: a playable board for the Home Screen and the
// streak with a hint button for the Lock Screen. Linked into the Xcode
// project by @bacons/apple-targets on `expo prebuild`.
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: "widget",
  name: "DailyWidget",
  displayName: "今日の一問",
  icon: "../../assets/icon.png",
  // Buttons in widgets (App Intents) need iOS 17.
  deploymentTarget: "17.0",
  colors: {
    $accent: "#3388b0",
    $widgetBackground: "#f7fafc",
  },
  entitlements: {
    "com.apple.security.application-groups":
      config.ios.entitlements["com.apple.security.application-groups"],
  },
});
