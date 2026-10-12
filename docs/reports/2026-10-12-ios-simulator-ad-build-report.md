# 作業報告書

## 作業日時

2026年10月12日 11時48分06秒（JST）

## 作業対象

iOS 1.0.1 のSimulator用ビルドと、iPhone 17 Pro Max Simulatorでの広告表示。

## 作業目的

実機の購入状態に影響されず、広告SDK入りのアプリをSimulatorで起動して表示を確認する。

## 変更内容

- 現在のソースからiOS Simulator向けReleaseビルドを作成し、iPhone 17 Pro Max（iOS 26.5）にインストール・起動した。
- ビルドの `CFBundleShortVersionString` が `1.0.1`、bundle ID が `com.naki0227.gojuonminesweeper` であることを確認した。
- 設定画面下部で「Test mode / AdMob Adaptive Banner」の表示を確認し、PNGを保存した。
- Expo prebuildが変更した `package.json` のスクリプトを元に戻し、生成した `ios/` は `/private/tmp/gojuon-ios-generated-2026-10-12` へ移した。アプリ本体はSimulatorにインストール済み。
- CocoaPods 1.17.0をHomebrewで導入した。

## 変更したファイル

- `store-assets/ios/verification/2026-10-12-iphone-17-pro-max-test-ad.png`（追加）
- `docs/reports/2026-10-12-ios-simulator-ad-build-report.md`（追加）
- `docs/TODO.md`（更新）

アプリケーションコードと設定ファイルに恒久的な変更はない。

## 変更意図・設計上の意図

TestFlight用の実機バイナリはSimulatorで動かせないため、同じバージョン表記の現在のソースをSimulator用にビルドした。テスト広告IDを使う設定で広告表示経路を確認し、本番広告の配信や収益は検証対象に含めない。

## 影響範囲

iPhone 17 Pro Max Simulatorへのアプリ導入と検証用画像・文書のみ。TestFlight配布物や本番環境には影響しない。

## 追加・更新したテスト

単体テストの追加はなし。アプリの画面上で広告バナーの表示を確認した。

## 実行した確認コマンド

- `pod install`：成功（104 dependencies、106 pods）。
- `xcodebuild -workspace ios/app.xcworkspace -scheme app -configuration Release -sdk iphonesimulator -destination 'platform=iOS Simulator,id=FDBA5C2A-ABD2-4E67-AB8A-FBDFEADBADDC' -derivedDataPath /private/tmp/gojuon-simulator-derived CODE_SIGNING_ALLOWED=NO build`：`BUILD SUCCEEDED`。
- `xcrun simctl install` / `xcrun simctl launch`：成功。
- `npm run typecheck`、`npm run format:check`、`npm run lint`、`npm test`（37件）、`npm run build:web`、`npm run validate:questions`：すべて成功。

## CIで確認される内容

既存CIは問題データ検証、型検査、整形、lint、unit test、Web出力を実行する。今回のiOSネイティブビルドと画面上の広告表示はCI対象外で、ローカルで確認した。未コミットのため今回の差分に対するGitHub CIは未実行。

## 未解決の課題

このSimulatorビルドはTestFlightの1.0.1と同一バイナリではない。Simulatorに表示されたのはAdMobのテスト広告であり、TestFlightの本番広告配信と実機の購入状態は確認できない。

## 次にやること

必要なら未購入状態の実機でTestFlightの本番広告を確認する。提出用画像は現在のアプリUIに合わせて撮り直す。

## 次回最初に見るべきファイル

`app.config.ts`、`src/ads/BannerAd.native.tsx`、`src/purchases/RemoveAdsProvider.tsx`、本報告書。

## 引き継ぎ事項

SimulatorのアプリIDは `com.naki0227.gojuonminesweeper`。再起動は `xcrun simctl launch FDBA5C2A-ABD2-4E67-AB8A-FBDFEADBADDC com.naki0227.gojuonminesweeper`。ビルド生成物は `/private/tmp/gojuon-simulator-derived/Build/Products/Release-iphonesimulator/app.app`。テスト広告は設定画面を下へスクロールすると見える。`/private/tmp` の生成物は永続保存ではない。TestFlightの購入履歴はこのSimulatorの購入状態とは別。
