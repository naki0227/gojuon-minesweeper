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
- [x] Node.js 2026年10月セキュリティリリースに合わせ、CIのNode.jsを `.node-version`（22.23.4）に固定（2026-10-21）。記録は `docs/reports/2026-10-21-nodejs-security-release-report.md`。
- [x] 今日の一問が未公開のとき「通信できませんでした」になる不具合を修正し、昨日の問題を出すようにした（2026-10-27）。記録は `docs/reports/2026-10-27-daily-offline-report.md`。
- [x] 今日の一問の先の日付の答えが Web 版バンドルに含まれていた問題を修正した（2026-10-27）。記録は `docs/reports/2026-10-27-daily-schedule-bundle-report.md`。
- [x] 2026-10-27 の今日の一問を公開した。Deploy Web がジョブ開始前に失敗していたが、リポジトリを Public にしたあとの手動実行で 8:53 に公開できた（2026-10-27）。

## 未着手

- [ ] 2026-10-27 の Deploy Web がジョブ開始前に失敗した理由（GitHub Actions の利用枠・課金など）を確認する（Public 化で解消したが、原因は未確認）。
- [ ] `src/daily/remote.ts` の修正を main へ統合後、EAS Update で配信し、未公開の時間帯に昨日の問題が出ることを実機で確認する。
- [ ] リポジトリを Public にする場合は、先に `src/daily/schedule.json`（先の答え）をリポジトリの外へ移す。
- [ ] `store-assets/ios/submission-ready/` の5枚をApp Store Connectでプレビューし、受け付け結果を確認する。
- [ ] 中型iPhone枠には `store-assets/ios/submission-ready-6.3/` の5枚をアップロードし、受け付け結果を確認する。
- [ ] `store-assets/ios/promotional/` の2枚をApp Store Connectの「ヘッダ」「検索結果」にアップロードして受け付け結果を確認する。
- [ ] `store-assets/ios/ipad/submission-ready/` の5枚を13インチiPad枠にアップロードし、受け付け結果を確認する。
- [ ] ゲームロジックのunit testを整備する。
- [ ] 変更後の設定画面でiPhone・iPad提出用スクリーンショットを撮り直す。既存画像には削除したカテゴリが含まれる。
- [ ] npm auditの残り3件を解消する（2026-10-21時点、詳細は `docs/reports/2026-10-21-dependency-vulnerability-report.md`）。decode-uri-component（GHSA-vcc3-ghjq-m6fr）はExpo SDK 58（expo-router 58）への更新で解消する。ただしSDK 58への更新は2026-10-23に見送った。React Native Firebase 26.4の設定プラグインはSDK 58のscene対応AppDelegateに `FirebaseApp.configure()` を挿入できず（prebuildで "Unable to determine correct Firebase insertion point" と警告が出る）、対応した27.0.0はFirebase 13をSwift Package Manager専用で取り込むため、`disableSPM: true`（Google Mobile AdsのCocoaPodsとGoogleの共通部品を二重にしないための設定）が使えないため。RNFBとGoogle Mobile Adsの組み合わせがSDK 58で動く見通しが立ってから再開する。再開時は `npx expo install expo@^58.0.0 --fix` に加えて、`app.json` の `newArchEnabled` 削除、`expo-font` / `expo-asset` の直接追加、RN 0.87のref型（`PressableInstance` / `ScrollViewInstance`）対応、`enableSceneSupport` の削除が必要（いずれも2026-10-23に確認済み）。node-forge（GHSA-86w9-cpqp-85rv）とexpo経由のbraces（GHSA-vfj7-8cjw-p6xm）は修正版が出ていないので、出たら取り込む。`npm audit fix --force`は破壊的なExpo変更を提示するため使わない。
- [ ] 必要なら未購入状態の実機でTestFlight 1.0.1の本番広告を確認する。Simulatorで確認したのはテスト広告。
- [ ] オンライン対局中のバナーについて、実機の操作感とAdMobの誤タップ指標を公開後に確認する。盤面操作画面への広告はGoogleのガイダンス上、特に注意が必要。

## 進行中

- なし。

## 保留・技術的負債・要確認

- Web版のAdSenseは承認待ち。`main` のpushでWebが自動デプロイされても、広告の表示・収益は承認後に確認する。
- iOSネイティブの配布ビルドを使った撮影は未実施。今回のPNGはExpo Go内で実アプリUIを表示し、開発ボタンを非表示にして撮影した。
- 設定画面は項目数が多いため、1画面に開始ボタンまでは収まらない。
- 提出用デザインの元画像は851×1849 px。変換後の画像は規定サイズだが、拡大で失われた精細さは戻らない。
- GitHub上のCI結果は未確認。今回のCI設定はローカルで同じコマンドを確認したが、commit/pushしていない。

## 次回最初に着手するタスク

- GitHub ActionsのCI結果を確認し、iOS版を配る場合は「TestFlight」workflowを手動実行する。PR #4（広告）は main 上の作業ツリーに統合済みなので、必要ならPRの状態を整理する。

- `docs/reports/2026-10-06-question-bank-rebalance-report.md` を読み、`npm test` と `npm run validate:questions` を実行する。
- 提出画像を現行アプリUIで撮り直した後、App Store Connectでプレビューする。
