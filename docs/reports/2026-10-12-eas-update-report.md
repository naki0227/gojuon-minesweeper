# 作業報告書

## 作業日時

2026年10月12日 14時38分23秒（作業環境の現在時刻）

## 作業対象・目的

JavaScript だけの変更を審査なしで iOS アプリに配れるよう、EAS Update を導入する。

## 変更内容・変更したファイル

- `package.json` / `package-lock.json`: `expo-updates`（SDK 57 対応版）を追加。
- `app.json`: `version` は 1.0.1（審査中の 1.0.0 の次）のまま、`runtimeVersion`（appVersion）と `updates.url` を設定。
- `eas.json`: production / preview ビルドにチャンネルを設定。
- `.github/workflows/eas-update.yml`: 手動実行の更新配信（main のみ、`APP_ENV=production`、EAS の production 環境変数を使用）。
- `tests/updates-config.test.ts`、`docs/testflight.md`、`docs/adr/2026-10-12-eas-update.md`。

## 設計上の意図

`APP_ENV=production` を付けないと `extra.ads.useTestIds` が true になり、本番アプリにテスト広告が出るため、ワークフローで固定した。

## 影響範囲

次のストア版（1.0.1）のうち、この変更以降のビルドから有効。1.0.0 と、これより前の 1.0.1 ビルドには届かない。Web には影響なし。

## 追加・更新したテスト・確認コマンド

`tests/updates-config.test.ts`（3件）。typecheck / format:check / lint / test（50件）/ quality / build:web 成功。`APP_ENV=production npx expo config` で updates・runtimeVersion・useTestIds=false を確認。

## 未解決の課題・次にやること

- 1.0.1 の新しいビルドを TestFlight で作り、1.0.0 の審査後に申請する。
- 初回の EAS Update は TestFlight ビルドで反映を確認する。実際の配信はまだ一度も試していない。

## 次回最初に見るべきファイル

`.github/workflows/eas-update.yml`、`docs/testflight.md`

## 引き継ぎ事項

ネイティブを変えたら必ず `expo.version` を上げる。オンライン関連は Deploy Supabase → EAS Update の順。
