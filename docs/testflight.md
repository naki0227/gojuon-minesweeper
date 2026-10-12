# TestFlight 配布

GitHub の Actions タブにある「TestFlight」ワークフローを手で実行すると、EAS で iOS の production ビルドを作り、App Store Connect にアップロードする。処理が終わると TestFlight に出る。

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
3. 内部テスターのグループで自動配信をオンにしておけば、App Store Connect の処理が終わり次第テスターに届く。外部テスターは最初のビルドだけ Apple のベータ審査がある。

公開済みのバージョン番号には新しいビルドを上げられない。v1.0.0 の公開後は 1.0.1 以降で配る。

EAS 無料プランは iOS ビルドの月間回数に上限があるので、マージのたびではなく手動実行にしている。
