# 作業報告書

## 作業日時

2026年10月27日（日本時間。時刻は記録していない）

## 作業対象・目的

今日の一問の先の日付の答えが、公開中の Web 版 JavaScript から読めていた問題の修正。プレゼント抽選は正解を送ると応募できるため、遊ばずに当選を狙えた。

## 原因

`src/daily/schedule.ts` が `schedule.json`（11/8 までの出題）を import しており、アプリはこのファイルから日付の関数（`currentPuzzleDate`・`shortDate` など）だけを使っていた。Metro は JSON の import を取り除かないため、表全体がバンドルに入っていた。2026-10-27 に `https://minesweeper.enludus.com` の entry バンドルに 11/1〜11/8 の日付と 11/5 の問題 ID が含まれることを確認した。

## 変更内容・変更したファイル

- `src/daily/dates.ts`（新規）: アプリが使う日付・URL の関数を `schedule.ts` から移した。
- `src/daily/schedule.ts`: 表と出題関連の関数だけを残し、日付の関数は `dates.ts` から再エクスポートする（scripts・tests は変更不要）。
- アプリ側7ファイル（`src/daily/*`・`src/components/HomeTitle.tsx`）の import を `./dates` に変更。
- `tests/daily-schedule-bundle.test.ts`（新規）: `app/`・`src/` から schedule を import したら失敗する。
- `supabase/functions/daily-lottery/index.ts`: 参照先コメントの修正のみ（再デプロイ不要）。

## 確認コマンドと結果

- 修正前の import に対して新しいテストが7ファイルを検出して失敗し、修正後は成功。
- `npm run build:web` の成果物に、10/28 以降の日付と問題 ID の組が1つも含まれないことを確認した。
- `npm run typecheck`・`npm run lint`・`npm run format:check`・`npm run quality`・`npm test`（26ファイル・121件）がすべて成功。

## 影響範囲・限界

- Web は main への統合後のデプロイで反映される。アプリは EAS Update で反映できる（JavaScript だけの変更）。すでに配信済みのアプリと、公開済みの Web バンドルのキャッシュには古い表が残る。
- 当日の答えは、ゲームを端末で遊ぶ仕組み上、当日の `app.json` と問題バンクから求められる。今回なくしたのは先の日付の答えの漏れ。
- リポジトリを Public にすると `src/daily/schedule.json` 自体が読めるため、先の答えは再び見える。Public にするなら、出題表をリポジトリの外（Supabase や Private リポジトリなど）へ移す必要がある。
