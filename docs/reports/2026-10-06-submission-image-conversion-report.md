# 作業報告書

## 作業日時

2026年10月06日 14時53分03秒 JST

## 作業対象

ユーザー指定のiPhone向けApp Store提出画像5枚。

## 作業目的

指定されたデザインを保持し、6.9インチ向けの画像サイズへ変換する。

## 変更内容

Downloadsの5枚を番号順に `store-assets/ios/submission/` へコピーした。各画像を `sips` で851×1849 pxから1320×2868 pxに拡大し、`store-assets/ios/submission-ready/` に保存した。元画像は上書きしていない。

## 変更したファイル

- `store-assets/ios/submission/{01-game-start,02-win,03-mine,04-settings,05-numbered-board}.png`
- `store-assets/ios/submission-ready/{01-game-start,02-win,03-mine,04-settings,05-numbered-board}.png`
- `docs/TODO.md`
- `docs/reports/2026-10-06-submission-image-conversion-report.md`

## 変更意図

指定画像の851×1849 pxはAppleの6.9インチ表示向け指定サイズに含まれない。構図を変えずに1320×2868 pxに合わせるため、元画像を保存したうえで寸法のみ変換した。

## 設計上の意図

`raw/` はSimulatorからの撮影原本、`submission/` はユーザー指定デザインの原本、`submission-ready/` は寸法を合わせた提出候補として分けた。アプリコードは変更していない。

## 影響範囲

画像アセットとドキュメントのみ。アプリの動作、API、DB、CIに影響はない。

## 追加・更新したテスト

なし。コード変更をしていないため、画像の形式・寸法と目視確認を行った。

## 実行した確認コマンド

- `sips -z 2868 1320 ... --out ...` — 5枚の変換に成功。
- `sips -g pixelWidth -g pixelHeight -g format -g space store-assets/ios/submission-ready/*.png` — 全5枚が1320×2868 px、PNG、RGB。
- `file store-assets/ios/submission-ready/*.png` — 全5枚が8-bit/color RGB、非インターレースPNG。
- `git diff --check` — 成功。
- 変換後の5枚すべてを目視確認。

## CIで確認される内容

既存CIは問題データ検証、typecheck、Webビルドを実行する。画像の寸法検証はCIにない。リモートCIは今回未実行。

## 未解決の課題

- App Store Connectでの受け付け結果と実機表示は未確認。
- 元画像より大きくしたため、新しい細部は増えていない。高精細な再書き出しが可能なら差し替えが望ましい。
- 既存CIにはformatter check、lint、unit testがない。

## 次にやること

`submission-ready/` の5枚をApp Store Connectでプレビューする。受け付けに問題があれば元デザインの高解像度版を用意する。

## 次回最初に見るべきファイル

`store-assets/ios/submission-ready/`、`store-assets/ios/submission/`、`docs/TODO.md`。

## 引き継ぎ事項

次回最初に `sips -g pixelWidth -g pixelHeight store-assets/ios/submission-ready/*.png` を実行する。提出候補には `submission-ready/` を使い、`raw/` と `submission/` は原本として保持する。App Store ConnectへのアップロードやGitのcommit/pushは未実施。
