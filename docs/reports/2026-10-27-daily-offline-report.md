# 作業報告書

## 作業日時

2026年10月27日 07時41分ごろ（日本時間。調査開始時に `TZ=Asia/Tokyo date` で確認）

## 作業対象・目的

アプリの「今日の一問」が「通信できませんでした」になる不具合の修正。

## 原因

- サイト（Cloudflare Pages）は、存在しない `/daily/<日付>/app.json` に 404 ではなくアプリのページ（200 text/html）を返す。2026-10-27 07:41 に `https://minesweeper.enludus.com/daily/2026-10-27/app.json` が `200 text/html` を返すことを確認した。
- `src/daily/remote.ts` は `response.ok` だけを見て `response.json()` を呼んでいたため、HTML の解析で例外になり `offline` 扱いになっていた。その日の問題が未公開のときに昨日の問題を出す仕組みが、一度も働いていなかった。
- `deploy-web.yml` の公開確認は、同じ理由で Content-Type を見ている。アプリ側だけ考慮が漏れていた。
- 今回のきっかけ: 2026-10-27 の公開（Deploy Web の 7:01・7:20 の実行、run 159・160）が、`check` ジョブの開始前（約2秒・ランナー未割り当て・ログなし）に失敗し、10/27 の問題が未公開だった。GitHub Actions 側の理由（利用枠・課金など）はこの環境からは確認できていない。

## 変更内容・変更したファイル

- `src/daily/remote.ts`: Content-Type が `application/json` でない応答を「未公開」として扱う。通信そのものの失敗だけを `offline` にする。
- `tests/daily-remote.test.ts`（新規）: 当日分あり、当日分なしで昨日を表示、両日なしで `missing`、通信失敗で `offline` の4件。

## 確認コマンドと結果

- 修正前に `npx vitest run tests/daily-remote.test.ts` で、昨日表示と `missing` の2件が失敗することを確認した。修正後は4件とも成功。
- `npm run typecheck`、`npm run lint`、`npm run format:check`、`npm run quality`、`npm test`（26ファイル・124件）がすべて成功。

## 影響範囲・リリース

JavaScript だけの変更なので、main へ統合後に EAS Update（手動実行）で配信できる。新しいストア版は不要。実機・Simulator での表示確認は未実施。

## 未解決事項

- 2026-10-27 分の問題の公開（Deploy Web の再実行）。Actions が動かない理由の確認が先に必要。
