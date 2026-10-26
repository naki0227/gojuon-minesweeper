# 作業報告書

## 作業日時

2026年10月27日（日本時間。時刻は記録していない）

## 作業対象・目的

リポジトリを Public にしたことで、今日の一問の先の出題（答え）が `src/daily/schedule.json` と計画スクリプトから読める状態になったため、先の出題を暗号化して持つ。判断の経緯は `docs/adr/2026-10-27-encrypted-daily-schedule.md`。

## 変更内容・変更したファイル

- `src/daily/schedule.ts`: 公開済みの日（`schedule.json`）と、暗号化した先の日（`schedule.upcoming.enc`）を合わせて読む。暗号化・復号・計画用の種（HMAC）・書き込みを追加。
- `src/daily/schedule.json`: 2026-10-28〜11-08 を削除（Public 化で読めるようになったため破棄）。
- `scripts/daily/plan.ts`: 鍵から作った種で計画し、暗号化して書く。ログは日付だけ。破棄した12問を除外。
- `scripts/daily/publish.ts`: 鍵が無く先の日を読めないときは止まる。
- `scripts/daily/schedule-edit.ts`（新規、`npm run daily:schedule`）: 先の日を平文で開いて編集し、暗号化して戻す。最後の日付の表示。
- `.github/workflows/daily-plan.yml`・`deploy-web.yml`・`ci.yml`: `DAILY_SCHEDULE_KEY` を渡す。計画 PR は暗号化ファイルを追加する。
- `.gitignore`: 編集用の平文ファイルを除外。
- `tests/daily-schedule-store.test.ts`（新規）: 暗号化と復号、別の鍵・改ざんの拒否、鍵あり・なしの読み込み、鍵ごとに違う種（5件）。

## 確認コマンドと結果

- 一時的な鍵で `npm run daily:plan -- 12` を実行し、10/28〜11/8 の12日分を暗号化して書けた。どの日も破棄した出題と一致しなかった。`daily:schedule -- open` / `close` でトリビアを追記して読み戻せた。この確認で作った暗号化ファイルは削除した（本番の鍵ではないため）。
- 鍵あり・なしの両方で `npm test`（27ファイル・126件）が成功。
- `npm run typecheck`・`npm run lint`・`npm run format:check`・`npm run quality` が成功。
- `daily:publish` は Chrome が必要なため実行していない。読み込み部分は上のテストで確認した。

## 統合の順番（重要）

1. `openssl rand -base64 32` で鍵を作り、Actions secret `DAILY_SCHEDULE_KEY` に登録する。手元にも安全に保管する。
2. この変更を main へ統合する（先の日がまだ無いので、統合しただけでは公開は止まらない）。
3. Daily Plan を手動実行し、作られた PR を **10/28 7:00 までに** 統合する。間に合わない日は、アプリが昨日の問題を出す（`claude/daily-question-network-error` の修正後）。

## 未解決事項

- Git の履歴と過去の Actions ログには旧出題表（〜11-08）が残る。破棄済みなので実害はない。
