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
- [x] 1.0.1のiOS Simulator用ReleaseビルドをiPhone 17 Pro Maxに入れ、設定画面下部のAdMobテスト広告を実画面で確認（2026-10-12）。記録は `docs/reports/2026-10-12-ios-simulator-ad-build-report.md`。
- [x] オンライン対戦の待機中・対局中・決着後に画面下部の広告枠を追加し、iPhone 17 Pro Max Simulatorで3状態のテスト広告を確認（2026-10-12）。記録は `docs/reports/2026-10-12-online-banner-report.md`。
- [x] `63039b5` を main に push し、[CI](https://github.com/naki0227/gojuon-minesweeper/actions/runs/38198728753) と [Webデプロイ](https://github.com/naki0227/gojuon-minesweeper/actions/runs/38198728758) の成功を確認（2026-10-12）。
- [x] README・第三者データ・オンライン対戦・TestFlightの説明を現行コードに合わせ、コード全体を静的レビュー（2026-10-12）。記録は `docs/reports/2026-10-12-docs-code-review-report.md`。

## 未着手

- [ ] `store-assets/ios/submission-ready/` の5枚をApp Store Connectでプレビューし、受け付け結果を確認する。
- [ ] 中型iPhone枠には `store-assets/ios/submission-ready-6.3/` の5枚をアップロードし、受け付け結果を確認する。
- [ ] `store-assets/ios/promotional/` の2枚をApp Store Connectの「ヘッダ」「検索結果」にアップロードして受け付け結果を確認する。
- [ ] `store-assets/ios/ipad/submission-ready/` の5枚を13インチiPad枠にアップロードし、受け付け結果を確認する。
- [ ] 既存の終盤ルール3件に加え、ゲームロジックの境界・異常系unit testを拡充する。
- [ ] 変更後の設定画面でiPhone・iPad提出用スクリーンショットを撮り直す。既存画像には削除したカテゴリが含まれる。
- [ ] npm auditが報告した本番依存の既知の脆弱性を、Expoとの互換性を確認して解消する。`npm audit fix --force`は破壊的なExpo変更を提示するため未実施。
- [ ] 必要なら未購入状態の実機でTestFlight 1.0.1の本番広告を確認する。Simulatorで確認したのはテスト広告。
- [ ] オンライン対局中のバナーについて、実機の操作感とAdMobの誤タップ指標を公開後に確認する。盤面操作画面への広告はGoogleのガイダンス上、特に注意が必要。
- [ ] オンライン対戦のタイムアウト処理で、締切・手番・バージョンを同一の状態として再確認する。古い締切で新しいターンを敗北扱いしない回帰テストを先に追加する。
- [ ] オンライン対戦の非公開状態と公開状態の更新をDBトランザクションにまとめ、開始・手番・再戦の失敗時に片方だけ進まないようにする。競合と失敗注入のテストを追加する。
- [ ] 再戦希望の同時送信で片方のフラグが消えないようにし、同時再戦テストを追加する。
- [ ] WebデプロイをCI成功後に実行し、依存インストールを `npm ci` に統一する。
- [ ] ルール・問題データ変更時のSupabase Edge Functionデプロイ手順と配布順序をCIまたはリリース手順に組み込む。
- [ ] CIでSupabase Edge Function本体のDeno型チェックとテストを実行する。現在のTypeScript/ESLint設定は `supabase/` を除外している。
- [ ] オンライン対戦の通信失敗を画面へ伝え、部屋退出後に古い非同期応答で部屋が復活しないようにする。
- [ ] オンライン対戦の不正な文字数範囲を拒否し、全体プールへの暗黙の切り替えをなくす。
- [ ] 広告非表示購入の返金・失効をアプリ復帰時にどう扱うかストア仕様を確認する。

## 進行中

- なし。

## 保留・技術的負債・要確認

- Web版のAdSenseは承認待ち。`main` のpushでWebが自動デプロイされても、広告の表示・収益は承認後に確認する。
- iOSネイティブの配布ビルドを使った撮影は未実施。今回のPNGはExpo Go内で実アプリUIを表示し、開発ボタンを非表示にして撮影した。
- 設定画面は項目数が多いため、1画面に開始ボタンまでは収まらない。
- 問題バンクの起動・集計コストと、大きいUI/Edge Functionファイルの分割は、実測または優先度の高い修正後に別作業で検討する。
- 提出用デザインの元画像は851×1849 px。変換後の画像は規定サイズだが、拡大で失われた精細さは戻らない。

## 次回最初に着手するタスク

- `docs/reports/2026-10-12-docs-code-review-report.md` の対戦判定・状態更新の指摘から着手する。最初に `npm test` を実行し、再現テストを追加する。
- 提出画像を現行アプリUIで撮り直した後、App Store Connectでプレビューする。iOS版を配る場合は修正を取り込んで「TestFlight」workflowを手動実行し、EASとApp Store Connectでも完了を確認する。
