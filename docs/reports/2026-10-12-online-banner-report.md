# 作業報告書

## 作業日時

2026年10月12日 11時54分51秒 JST

## 作業対象

オンライン対戦画面の広告配置。確認端末は iPhone 17 Pro Max Simulator（iOS 26.5）。

## 作業目的

待機中、対局中の盤面下、決着後の空き領域にバナーを表示する。

## 変更内容

- `OnlineScreen` の末尾に広告枠を1つ置き、待機中と対局中は既存の `setup`、決着後は既存の `result` 配置を使うようにした。ロビーには表示しない。
- 結果画面内にあった広告を削除し、二重表示を防いだ。
- 広告枠を画面下へ寄せ、盤面と退出操作から境界線と余白で離した。広告未読込時や広告非表示購入時は `BannerAd` 自体が表示されない。
- Simulatorで3状態を実際に表示し、各状態の1320×2868 px PNGを `store-assets/ios/verification/` に保存した。検証用オンライン部屋は両端末から退出した。

## 変更したファイル

- `app/online.tsx`
- `docs/TODO.md`
- `docs/reports/2026-10-12-online-banner-report.md`
- `store-assets/ios/verification/2026-10-12-online-waiting-ad.png`
- `store-assets/ios/verification/2026-10-12-online-playing-ad.png`
- `store-assets/ios/verification/2026-10-12-online-result-ad.png`

## 変更意図

オンライン画面の空き領域を使い、対局操作を広告で覆わずに表示するため。既存のAdMob/AdSense枠を再利用して、広告設定や外部依存を増やさない。

## 設計上の意図

Expo/React Nativeの既存構成を維持し、広告の同意・購入判定は既存の `BannerAd` に任せた。表示状態の分岐はオンライン画面に限定した。利点は変更範囲が小さいこと。欠点は同じ `setup` 広告枠を設定画面とオンライン待機・対局で共用するため、配置別の収益比較ができないこと。新規広告枠や依存ライブラリは追加していない。既存の大きな画面ファイルは今回のUI配置のためだけには分割していない。

## 影響範囲

オンライン対戦の待機・対局・結果画面。オフライン対戦、ゲームルール、DB、API、課金判定は変更なし。

## 追加・更新したテスト

新規ユニットテストなし。今回の変更は既存広告部品の表示位置だけで、表示状態はSimulatorの実画面で確認した。既存の広告・ゲーム関連を含む37件のユニットテストはすべて成功。

## 実行した確認コマンド

- `npm run typecheck`：成功。
- `npm run format:check`：整形後に成功。
- `npm run lint`：成功。
- `npm test`：7ファイル、37件成功。
- `npm run build:web`：成功。
- `npm run validate:questions`：成功。
- `xcodebuild -workspace ios/app.xcworkspace -scheme app -configuration Release -sdk iphonesimulator -destination 'platform=iOS Simulator,id=FDBA5C2A-ABD2-4E67-AB8A-FBDFEADBADDC' -derivedDataPath /private/tmp/gojuon-simulator-derived CODE_SIGNING_ALLOWED=NO build -quiet`：成功。最初のsandbox内実行ではCoreSimulatorへ接続できず、権限付きで再実行した。
- `xcrun simctl install` / `xcrun simctl launch` / `xcrun simctl io ... screenshot`：成功。待機・対局・結果の3状態でAdMobテストバナーを視認した。
- `sips -g pixelWidth -g pixelHeight`：上記3枚とも1320×2868 px。

## CIで確認される内容

`.github/workflows/ci.yml` は質問データ検証、typecheck、formatter check、lint、unit test、Web buildを実行する。今回ローカルでは同等のチェックを通した。GitHub上のCIはcommit/pushしていないため未実行。

## 未解決の課題

- TestFlight 1.0.1や本番配信広告にはこの変更はまだ含まれない。Simulatorはテスト広告での確認のみ。
- Googleはゲーム操作画面などで広告の誤タップに注意するよう案内している。盤面と広告を余白・境界線で離したが、実機の操作感と公開後の指標は未確認。[AdMobの配置ガイダンス](https://support.google.com/admob/answer/6128877)、[推奨例](https://support.google.com/admob/answer/6275335)。
- 広告非表示購入時はバナー本体は隠れるが、オンライン画面下部の境界線と余白は残る。

## 次にやること

実機で操作感を確認し、広告枠の誤タップが起きないか観察する。必要なら配置や表示条件を調整する。配布する際は改めてビルドし、CIを通す。

## 次回最初に見るべきファイル

`app/online.tsx`、`src/ads/BannerAd.native.tsx`、`src/ads/BannerAd.web.tsx`、`docs/TODO.md`。

## 引き継ぎ事項

生成済みの `ios/` は作業後に `/private/tmp/gojuon-ios-generated-2026-10-12` へ戻した。Simulator用ビルドは `/private/tmp/gojuon-simulator-derived/Build/Products/Release-iphonesimulator/app.app`、アプリIDは `com.naki0227.gojuonminesweeper`。次回の最初の確認コマンドは `git status --short` と `npm test`。今回の作業ではcommit/pushしていない。広告同意・課金コードとゲームエンジンは触っていない。
