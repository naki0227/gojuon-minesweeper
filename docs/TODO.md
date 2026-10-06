# Todo

## 完了

- [x] iPhone 17 Pro Max Simulatorでアプリの5状態を撮影し、`store-assets/ios/raw/` に保存（2026-10-06）。
- [x] 撮影専用の一時コードを復元し、アプリコードの差分がないことを確認。
- [x] ユーザー指定の提出用デザイン5枚を `store-assets/ios/submission/` に原寸で保存し、`store-assets/ios/submission-ready/` に1320×2868 pxのRGB PNGへ変換（2026-10-06）。
- [x] App Store Connectの中型iPhone枠向けに1206×2622 pxの5枚を `store-assets/ios/submission-ready-6.3/` に作成（2026-10-06）。
- [x] iPhone 17用のヘッダと検索結果アセットを `store-assets/ios/promotional/` に作成（2026-10-06）。
- [x] 13インチiPad Pro（M5）Simulatorで5状態を撮影し、同じデザインの2064×2752 px提出用画像5枚を作成（2026-10-06）。
- [x] ポケモン系8ファイルを出題データから削除し、日常の12カテゴリ・216問を追加（2026-10-06）。
- [x] カテゴリの複数選択とカテゴリ均等抽選を追加（2026-10-06）。
- [x] CIにformatter check、lint、unit testを追加し、ローカルで全チェックを実行（2026-10-06）。
- [x] 安全マスを開き切った後の終盤ルールを追加。答えを先頭から1文字ずつ表示し、両者が1回ずつ回答するごとに次の文字を表示、全文字が出たら引き分け（2026-10-06）。
- [x] PR #4の広告コードを統合し、レビュー指摘を修正（購入確認の失敗時は広告を出さない、同意取得エラー時は保存済みの同意で判定、開発ビルドは常にテスト広告ID、片方のOSだけの本番ビルドでは他方のAdMob IDを必須にしない、アプリ復帰時の再確認で広告を出し直さない）（2026-10-06）。
- [x] Webトップに `lang="ja"`・title・descriptionを設定、`userInterfaceStyle: "light"` とAndroidアダプティブアイコンを設定（2026-10-06）。

## 未着手

- [ ] `store-assets/ios/submission-ready/` の5枚をApp Store Connectでプレビューし、受け付け結果を確認する。
- [ ] 中型iPhone枠には `store-assets/ios/submission-ready-6.3/` の5枚をアップロードし、受け付け結果を確認する。
- [ ] `store-assets/ios/promotional/` の2枚をApp Store Connectの「ヘッダ」「検索結果」にアップロードして受け付け結果を確認する。
- [ ] `store-assets/ios/ipad/submission-ready/` の5枚を13インチiPad枠にアップロードし、受け付け結果を確認する。
- [ ] ゲームロジックのunit testを整備する。
- [ ] 変更後の設定画面でiPhone・iPad提出用スクリーンショットを撮り直す。既存画像には削除したカテゴリが含まれる。
- [ ] npm auditが報告した本番依存の既知の脆弱性を、Expoとの互換性を確認して解消する。`npm audit fix --force`は破壊的なExpo変更を提示するため未実施。

## 進行中

- なし。

## 保留・技術的負債・要確認

- iOSネイティブの配布ビルドを使った撮影は未実施。今回のPNGはExpo Go内で実アプリUIを表示し、開発ボタンを非表示にして撮影した。
- 設定画面は項目数が多いため、1画面に開始ボタンまでは収まらない。
- 提出用デザインの元画像は851×1849 px。変換後の画像は規定サイズだが、拡大で失われた精細さは戻らない。
- GitHub上のCI結果は未確認。今回のCI設定はローカルで同じコマンドを確認したが、commit/pushしていない。

## 次回最初に着手するタスク

- 未コミットの変更をコミットする。PR #4（広告）は main 上のこの作業ツリーに統合済みなので、#4 を閉じて新しいPRにまとめるか、#4 のブランチへ反映するかを決める。

- `docs/reports/2026-10-06-question-bank-rebalance-report.md` を読み、`npm test` と `npm run validate:questions` を実行する。
- 提出画像を現行アプリUIで撮り直した後、App Store Connectでプレビューする。
