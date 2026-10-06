# 作業報告書

## 作業日時

2026年10月06日 15時53分30秒（Asia/Tokyo、`date`で取得）

## 作業対象

13インチiPad用App Storeスクリーンショット。

## 作業目的

iPad上の実アプリUIで5状態を撮影し、既存のiPhone提出画像と同じデザインに加工する。

## 変更内容

- iPad Pro 13-inch (M5)、iPadOS 26.5で設定、ゲーム開始直後、数字の盤面、地雷、勝利を撮影。
- 原本5枚を `store-assets/ios/ipad/raw/` に保存。
- 白と淡い青の背景、濃紺の見出し、iPadフレームで加工した5枚を `store-assets/ios/ipad/submission-ready/` に保存。
- 加工用の背景と再生成スクリプトを `store-assets/ios/ipad/source/` に保存。
- READMEとTODOを更新。

## 変更したファイル

- `store-assets/ios/ipad/raw/` のPNG 5枚
- `store-assets/ios/ipad/submission-ready/` のPNG 5枚
- `store-assets/ios/ipad/source/background.png`
- `store-assets/ios/ipad/source/generate_submission.py`
- `store-assets/ios/README.md`
- `docs/TODO.md`
- 本報告書

## 変更意図

`app.json` の `ios.supportsTablet: true` に対応し、13インチiPad枠向けに2064×2752 pxの画像を用意するため。

## 設計上の意図

アプリの既存Expo/React Native構成とゲームロジックを使う。撮影中だけURLパラメータで決まった状態を示す最小限のコードを置き、撮影後にバックアップから戻した。提出画像では実画面の文字や数字を変えず、背景とフレームと見出しのみ合成した。生成スクリプトは提出素材のフォルダに閉じており、本番アプリには影響しない。新しいアプリ依存関係はない。

## 影響範囲

App Store提出素材と文書のみ。アプリコード・API・DBの最終差分はない。

## 追加・更新したテスト

アプリテストは追加なし。原本5枚はRGBA PNG、提出画像5枚はRGB PNGで、いずれも2064×2752 pxであることを確認。5状態の画面内容と合成後の見た目も確認。

## 実行した確認コマンド

- `npm run typecheck`：成功。
- `npm run validate:questions`：成功。
- `npm run build:web`：成功。
- `xcrun simctl io <iPad UDID> screenshot ...`：5状態の撮影に成功。
- `sips -g pixelWidth -g pixelHeight store-assets/ios/ipad/raw/*.png`：全5枚2064×2752 px。
- Pillowで提出用PNG 5枚が2064×2752 px、RGBであることを確認。
- `git diff -- app/index.tsx`：差分なし。

## CIで確認される内容

既存の `.github/workflows/ci.yml` は問題データ検証、typecheck、Webビルドを実行。formatter、lint、unit testは未整備。提出画像は現行CIの検証対象外。

## 未解決の課題

- App Store Connectの13インチiPad枠へのアップロード・受け付け確認は未実施。
- iOSネイティブの配布ビルドではなくExpo Go上で実アプリUIを撮影。Expo Goの浮動ボタンは非表示にした。
- CIのformatter、lint、unit testは未整備。

## 次にやること

`store-assets/ios/ipad/submission-ready/` の5枚を13インチiPad枠でプレビューし、受け付け結果を確認する。

## 次回最初に見るべきファイル

`store-assets/ios/README.md`、`docs/TODO.md`、`store-assets/ios/ipad/source/generate_submission.py`。

## 引き継ぎ事項

iPad素材の番号順はiPhone提出デザインと同じ。使用したSimulatorのUDIDは `41168473-C37A-4C80-A96E-2F5EF19D2E2C`。撮影用コードは復元済みで、アプリ本体の差分はない。背景は画像生成ツールで制作し、文字と実画面は合成で正確に配置した。commit/pushはしていない。
