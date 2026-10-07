# オンライン対戦（Supabase）

ふたりが別々の端末で遊ぶオンライン対戦の仕組みと、Supabase の準備手順。1台を交互に使うローカル対戦はそのまま残る。

## 遊び方

- ホームの「オンラインで対戦」から入る。ボタンは `EXPO_PUBLIC_SUPABASE_URL` と `EXPO_PUBLIC_SUPABASE_KEY` が入ったビルドにだけ出る。
- **合言葉**: ふたりが同じ合言葉（2〜16文字）を入れると対戦が始まる。全角半角・大文字小文字・ひらがなカタカナ・空白の違いは同じとみなす。先に入った人のジャンルと文字数で出題する。対戦が始まると合言葉は空き、ほかの人が同じ言葉を使える。
- **ランダムマッチ**: 同じ言語（日本語・English・まぜる）を選んだ人どうしを先着順でつなぐ。ジャンルと文字数は「ぜんぶ」。
- 持ち時間は1手90秒。相手の時間が切れると、待っている側の端末が自動で勝ちを申告する。途中で「降参して部屋を出る」と相手の勝ち。
- 決着後、ふたりとも「もう一戦」を押すと、先手を入れ替えて別の問題で再戦する。
- 対局中は広告を出さない（結果画面のみ）。

## 仕組み

- 端末は Supabase の匿名ログインで識別する（アカウント登録なし）。
- 答えと判定はすべてサーバー（Edge Function `online-game`）が持つ。端末に届くのは `online_rooms.public_state` だけで、答えは決着するまで含まれない。
- `online_rooms`: 参加者だけが読める（RLS）。端末からは書き込めない。Realtime で変更が届く。
- `online_room_secrets`: 出題と完全な盤面。service role（Edge Function）以外は読めない。
- ルールはアプリと同じコード（`src/game/`、`src/online/rules.ts`）を使う。`npm run online:sync` が Deno 向けに `supabase/functions/_shared/app/` へコピーする（生成物なので git には入れない）。
- 放置された待ち部屋は30分、対戦中・決着後の部屋は24時間で閉じ、閉じた部屋は1週間で削除する（どれも誰かが対戦を始めるときに掃除する）。

## Supabase の準備（初回だけ）

1. https://supabase.com でプロジェクトを作る（リージョンは Tokyo）。
2. Authentication → Sign In / Providers で **Allow anonymous sign-ins** をオンにする。
3. このリポジトリで CLI をつなぐ。

   ```sh
   npx supabase login
   npx supabase link --project-ref <プロジェクトのref>
   ```

4. テーブルを作る: `npx supabase db push`（`supabase/migrations/` を適用）。
5. 関数をデプロイする: `npm run online:deploy`（ルールのコピー → `supabase functions deploy online-game`）。
6. Project Settings → API Keys の **Project URL** と **Publishable key**（旧 anon key でも可）を次に入れる。どちらも公開前提の値だが、git には入れない。
   - ローカル: `.env` の `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_KEY`
   - EAS: production 環境の環境変数に同じ2つ
   - Web: GitHub の Actions Variables に同じ2つ（`deploy-web.yml` が読む）

ルール（`src/game/`、`src/online/rules.ts`）や出題データを変えたら、アプリと一緒に `npm run online:deploy` もやり直す。サーバーは出題をIDで覚えているので、データを入れ替える前に対戦中の部屋が残っていないときに行う。

## ローカルで試す

Docker があれば `npx supabase start` でローカルの Supabase が立つ（`supabase/config.toml` で匿名ログインは有効）。そのうえで `npm run online:sync && npx supabase functions serve` を動かし、`.env` に `npx supabase status` の API URL と Publishable key を入れて `npm run web` を2つのブラウザで開く。

## 今後

- 匿名ユーザーは増え続けるので、古い匿名ユーザーを消す定期処理を入れる（Supabase のドキュメントにある `auth.users` の削除クエリを cron で回す）。
- 対戦成績・レーティング、通報・ブロックは未実装。
