# npm audit 分類（2026-10-06）

`npm audit --omit=dev`: high 20 / moderate 11（合計31）。報告は多いですが、元になっている脆弱性は4つだけです。残りはそれを経由して上位パッケージに伝播した分です。

| 元の脆弱性 | 経路 | アプリへの影響 | 判断 |
| --- | --- | --- | --- |
| braces（深いネストのパターンでDoS） | micromatch → metro-file-map → metro / @expo/cli | ビルド時の Metro / Expo CLI だけで使われ、アプリのバンドルには入らない | リリースを止めない。Expo SDK の更新で解消する |
| node-forge（RSA署名検証の不備） | @expo/code-signing-certificates → @expo/cli | EAS Update のコード署名を CLI で扱うときだけ。アプリには入らない | リリースを止めない。コード署名は使っていない |
| uuid（v3/v5/v6 の境界チェック不足） | xcode → @expo/config-plugins | prebuild 時のプロジェクト生成だけ | リリースを止めない |
| decode-uri-component（不正な % エンコードでDoS） | query-string → expo-router | **実行時に使われる**（Web の URL やディープリンクの解析） | 影響は低い。細工した URL で固まるのは開いた本人の画面だけで、サーバーはない。expo-router 58（次の Expo SDK）で解消する |

`react-native-google-mobile-ads` / `react-native` / `expo` などが「direct」と出ているのは、上の経路を含んでいるためです。npm の提案（`expo@44` や `react-native@0.72` への巻き戻し）は破壊的なので、`npm audit fix --force` は実行しません。

結論: リリースを止める脆弱性はありません。次の Expo SDK に上げるタイミングでもう一度確認します。
