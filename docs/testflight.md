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

## 配るとき

1. 新しいストアバージョンにするなら `app.json` の `expo.version` を上げてマージする（例: 1.0.1）。ビルド番号は EAS が自動で上げる。
2. Actions → TestFlight → Run workflow。
3. EAS でビルドと提出の完了を確認し、App Store Connect で Apple 側の処理と TestFlight の状態を確認する。
4. 内部テスターのグループで自動配信をオンにしておけば、App Store Connect の処理後にテスターへ配信できる。外部テスター用ビルドにはベータ審査が必要になる場合がある。

同じストアバージョンで複数のビルドをアップロードできるが、各ビルド番号は新しくする。新しい App Store 公開版を出すときはストアバージョンも上げる。[Apple のビルド管理](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds) / [新バージョンの作成](https://developer.apple.com/help/app-store-connect/update-your-app/create-a-new-version)

ビルド回数と提出タイミングを管理できるよう、マージごとの自動実行ではなく手動実行にしている。
