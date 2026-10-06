# 作業報告書

## 作業日時

2026年10月06日 14時56分32秒 JST

## 作業対象

App Store Connectのスクリーンショット枠とiPhone提出画像。

## 作業目的

表示されている複数のアセット枠を整理し、「サイズが無効」エラーに対応する。

## 変更内容

ユーザーの画面では「Dynamic Island搭載iPhone（中型ディスプレイ）」が選択され、受け付けサイズとして1206×2622 pxなどが表示されていた。851×1849 pxの原本5枚から1206×2622 pxのRGB PNGを作り、`submission-ready-6.3/` に保存した。各フォルダとアップロード先の対応を `store-assets/ios/README.md` に記録した。

## 変更したファイル

- `store-assets/ios/submission-ready-6.3/01-game-start.png`
- `store-assets/ios/submission-ready-6.3/02-win.png`
- `store-assets/ios/submission-ready-6.3/03-mine.png`
- `store-assets/ios/submission-ready-6.3/04-settings.png`
- `store-assets/ios/submission-ready-6.3/05-numbered-board.png`
- `store-assets/ios/README.md`
- `docs/TODO.md`
- `docs/reports/2026-10-06-app-store-size-routing-report.md`

## 変更意図

1320×2868 pxは6.9インチ向けだが、現在選択中の中型iPhone枠は1206×2622 pxを受け付ける。元デザインを保持しながら、選択中の枠に合う寸法を用意した。

## 設計上の意図

原本、6.9インチ用、中型iPhone用、Simulator撮影原本を分け、誤ったファイルのアップロードを防ぐ。アプリコードは変更しない。

## 影響範囲

画像とドキュメントのみ。アプリ実装、API、DB、CIへの影響はない。

## 追加・更新したテスト

なし。画像処理のみのため寸法、形式、表示を確認した。

## 実行した確認コマンド

- `sips -z 2622 1206 ... --out ...` — 5枚作成成功。
- `sips -g pixelWidth -g pixelHeight -g format -g space store-assets/ios/submission-ready-6.3/*.png` — 全5枚が1206×2622 px、RGB PNG。
- `file store-assets/ios/submission-ready-6.3/*.png` — 全5枚が8-bit RGB PNG。
- 変換後の勝利画面を目視確認。

## CIで確認される内容

既存CIは問題データ検証、typecheck、Webビルドを実行する。画像寸法の検証はCIにない。リモートCIは今回未実行。

## 未解決の課題

- App Store Connectへのアップロードと受け付け確認は未実施。
- `app.json` の `ios.supportsTablet: true` によりiPad向けスクリーンショットも必要。iPad実画面の撮影は未実施。
- 画像は851×1849 pxの原本から拡大しているため、高解像度の細部は増えていない。

## 次にやること

中型iPhone枠へ `submission-ready-6.3/` の5枚をアップロードして確認する。13インチiPad用画像を別途作成する。

## 次回最初に見るべきファイル

`store-assets/ios/README.md`、`store-assets/ios/submission-ready-6.3/`、`app.json`、`docs/TODO.md`。

## 引き継ぎ事項

次回最初に `sips -g pixelWidth -g pixelHeight store-assets/ios/submission-ready-6.3/*.png` を実行する。「ヘッダと検索結果」は今回の5枚のアップロード先ではない。iPhone用合成画像をiPad枠へ転用しない。Gitのcommit/pushは未実施。
