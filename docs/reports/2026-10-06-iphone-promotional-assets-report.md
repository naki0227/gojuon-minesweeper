# 作業報告書

## 作業日時

2026年10月06日 15時36分55秒（Asia/Tokyo、`date`で取得）

## 作業対象

iPhone 17向けApp Store Connectの「ヘッダ」「検索結果」画像。

## 作業目的

提出用スクリーンショット5枚と同じ視覚表現で、両枠に指定されたサイズの画像を作る。

## 変更内容

- `promotional/01-header-3840x1646.png` を作成。ゲーム開始時の実画面を配置。
- `promotional/02-search-results-1920x1280.png` を作成。数字が表示された実画面を配置。
- 既存の5枚のデザインに合わせ、白と淡い青の背景、濃紺の日本語見出し、端末フレームを使用。
- App Store用の保存先と用途をREADMEとTODOに記録。

## 変更したファイル

- `store-assets/ios/promotional/01-header-3840x1646.png`
- `store-assets/ios/promotional/02-search-results-1920x1280.png`
- `store-assets/ios/README.md`
- `docs/TODO.md`
- 本報告書

## 変更意図

App Store Connect画面に表示されたヘッダの許容サイズ3840×1646 px、検索結果の許容サイズ1920×1280 pxに合わせるため。

## 設計上の意図

アプリコード、依存ライブラリ、CIは変更しない。背景は生成画像、UIは既存のiPhone 17 Pro Max Simulator撮影原本、見出しはシステムの日本語フォントを使って組版した。これにより画面内の日本語・数字の正確さを維持する。合成処理は作業用の一時スクリプトで行い、プロダクション挙動には影響しない。

## 影響範囲

App Store提出用画像とその説明のみ。アプリ画面、API、DBへの影響はない。

## 追加・更新したテスト

コード変更がないため追加なし。PNGの寸法、RGB形式、目視で構図と文字を確認した。

## 実行した確認コマンド

- `git status --short`：アプリコードの差分なし。
- 画像生成用一時スクリプト：ヘッダ3840×1646 RGB、検索結果1920×1280 RGBを出力。
- 画像表示ツールで両画像を目視確認。

## CIで確認される内容

既存の `.github/workflows/ci.yml` は問題データ検証、TypeScript typecheck、Webビルド。formatter、lint、unit testは未整備。画像寸法は現行CIの検証対象外。

## 未解決の課題

- App Store Connectへのアップロード・受け付け確認は未実施。
- `ios.supportsTablet: true` のため、iPad配信時の13インチ用画像は別途必要。
- 現行CIにformatter、lint、unit testがない。

## 次にやること

`promotional/`の2枚を対応するApp Store Connect欄に配置し、受け付け結果を確認する。iPhone用の5枚も各デバイス枠へ配置して確認する。

## 次回最初に見るべきファイル

`store-assets/ios/README.md`、`docs/TODO.md`、`.github/workflows/ci.yml`。

## 引き継ぎ事項

ヘッダと検索結果はiPhone用の宣伝アセットで、縦長のアプリスクリーンショット枠とは別。撮影原本は`store-assets/ios/raw/`。画像生成で作った背景は作業環境内にあり、最終PNGは`promotional/`に保存済み。コードや依存関係は変更していない。commit/pushは行っていない。
