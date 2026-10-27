# TestFlight 配布

GitHub の Actions タブにある「TestFlight」ワークフローを手で実行すると、EAS で iOS の production ビルドを開始し、完成後に App Store Connect への提出を予約する。ワークフローは `--no-wait` で終了するため、Actions の成功はビルド・アップロード・Apple 側の処理完了を意味しない。EAS のビルドと提出画面、および App Store Connect の TestFlight 画面で個別に結果を確認する。[EAS の自動提出](https://docs.expo.dev/build/automate-submissions/) / [App Store Connect のビルド状態](https://developer.apple.com/help/app-store-connect/reference/app-build-statuses/)

## 最初に1回だけ

1. **Expo のトークン**: expo.dev の Account settings → Access tokens で作り、GitHub の Settings → Secrets and variables → Actions → **Secrets** に `EXPO_TOKEN` として入れる。
2. **App Store Connect の API キー**: Mac で一度だけ対話式に実行し、EAS にキーを保存させる。以降は CI から使われる。
   ```
   npx eas-cli build --platform ios --profile production --auto-submit
   ```
   途中で Apple ID でログインし、「App Store Connect API Key を作るか」に Yes と答える。
3. **ascAppId**: CI（非対話）での提出に使う `eas.json` の `submit.production.ios.ascAppId`。App Store Connect → アプリ → App情報 の「Apple ID」（数字）で、設定済み（6819539119）。

## GitHub でビルドして審査に出す（2026-10-27〜）

リポジトリを Public にしたので、GitHub Actions の macOS ランナーは無料で使える。TestFlight ワークフローは既定で GitHub 上でビルドし（`eas build --local`）、EAS の月間ビルド回数を使わない。

1. Actions → TestFlight → Run workflow（`where: github`）。ビルドして App Store Connect にアップロードし、TestFlight に入るまで待つ。`where: eas` を選ぶと、これまでどおり EAS でビルドする。
2. `appstore/release.yml` の `version`・`build`・`whats_new` などを書き換えて PR を出す。PR では App Store Connect を読むだけで、何が変わるかがログに出る（App Store ワークフロー）。
3. マージすると反映し、`submit_for_review: true` なら審査に出す。`release: manual` のときは、承認後に App Store Connect で公開する。

必要な Secrets（Settings → Secrets and variables → Actions）:

- `EXPO_TOKEN`（既存）: ビルドと署名情報、App Store Connect へのアップロード
- `GOOGLE_SERVICE_INFO_PLIST_BASE64`: `base64 -i GoogleService-Info.plist | pbcopy` で作る。ローカルビルドは EAS のファイル型の変数を受け取れず、無いと Firebase 抜きのアプリになるので、無ければビルドを止める
- `ASC_KEY_ID` / `ASC_ISSUER_ID` / `ASC_KEY_P8`: App Store Connect API キー（StudyReel と同じチームのキーでよい）。`tools/appstore/asc.py` が使う

`tools/appstore/asc.py` は StudyReel のものの写し。直すときは両方そろえる。

## 配るとき

1. 新しいストアバージョンにするなら `app.json` の `expo.version` を上げてマージする（例: 1.0.1）。ビルド番号は EAS が自動で上げる。
2. Actions → TestFlight → Run workflow。
3. EAS でビルドと提出の完了を確認し、App Store Connect で Apple 側の処理と TestFlight の状態を確認する。
4. 内部テスターのグループで自動配信をオンにしておけば、App Store Connect の処理後にテスターへ配信できる。外部テスター用ビルドにはベータ審査が必要になる場合がある。

同じストアバージョンで複数のビルドをアップロードできるが、各ビルド番号は新しくする。新しい App Store 公開版を出すときはストアバージョンも上げる。[Apple のビルド管理](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds) / [新バージョンの作成](https://developer.apple.com/help/app-store-connect/update-your-app/create-a-new-version)

ビルド回数と提出タイミングを管理できるよう、マージごとの自動実行ではなく手動実行にしている。

## 審査なしの更新（EAS Update）

2026-10-12 以降の 1.0.1 ビルドから `expo-updates` が入っている。JavaScript（画面・ルール・文言）と画像だけの変更なら、main にマージしたあと Actions → 「EAS Update」を手で実行すると、同じストアバージョンの iOS アプリに審査なしで届く。アプリは起動時に更新を確認し、次回起動から新しい版になる。

- ネイティブの変更（ライブラリの追加・更新、権限、`app.json` のネイティブ設定）は届かない。`expo.version` を上げて TestFlight から審査に出す。`runtimeVersion` はストアバージョンと同じなので、バージョンを上げ忘れると古いネイティブに新しい JS が届いて落ちる恐れがある。
- オンライン対戦のルールや出題データを変えたときは、先に「Deploy Supabase」で Edge Function を反映してから「EAS Update」を実行する。
- 配った更新は EAS のダッシュボード（Updates）から前の版に戻せる。
