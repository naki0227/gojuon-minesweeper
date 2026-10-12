# 作業報告書

## 作業日時

2026年10月12日 13時21分09秒（作業環境の現在時刻）

## 作業対象

地雷文字の重複表示と周囲の数字（`src/game/engine.ts`、`src/online/rules.ts`、盤面コンポーネント）。

## 作業目的

「ちょうちょう」のように同じ文字が答えに複数回出る場合、開いた地雷文字に「×2」などを表示し、セーフマスの数字も重複込みで数える。

## 変更内容

- `questionMineMultiplicity` を追加。答え（primary answer）の正規化後の出現回数を返す。
- `adjacentMineCount` を「周囲の地雷マス数」から「周囲の答え文字数（重複込み）」に変更。
- 地雷・セーフ時のメッセージを新しい数え方に合わせた（地雷は「答えに2回」を併記）。
- 五十音盤・A〜Z盤の開いた地雷に「×N」を表示し、読み上げラベルにも回数を入れた。
- オンラインの公開状態に `mineMultiplicities` を追加。開いた地雷文字だけを含み、未公開の文字の回数は送らない。旧サーバーとの互換のため optional。
- README と画面の説明文を変更。

## 変更したファイル

`README.md`、`app/index.tsx`、`app/online.tsx`、`src/components/BoardTile.tsx`、`src/components/CharacterBoard.tsx`、`src/components/GojuonBoard.tsx`、`src/game/engine.ts`、`src/online/protocol.ts`、`src/online/rules.ts`、`tests/mine-multiplicity.test.ts`、`docs/TODO.md`

## 設計上の意図

回数計算はゲームロジック（engine）に置き、コンポーネントは関数を受け取って表示するだけにした。オンラインではサーバーが回数を計算し、開いた文字の分だけ公開する。

## 影響範囲

ローカル対戦・オンライン対戦の盤面表示と数字。オンラインの数字はサーバー（Edge Function）が計算するため、Edge Function を再デプロイするまで旧ルールのまま。新アプリ＋旧サーバーでは「×N」が出ないだけで壊れない。

## 追加・更新したテスト

`tests/mine-multiplicity.test.ts`（回数・重複込みの周囲数・オンライン公開範囲・メッセージ）。

## 実行した確認コマンド

`npm run typecheck` / `format:check` / `lint` / `test`（41件成功）/ `validate:questions` / `build:web`、すべて成功。

## CIで確認される内容

問題バンク検証、型チェック、整形、lint、単体テスト、Webビルド。

## 未解決の課題

- 実機・Simulatorでの「×N」の見た目は未確認。
- オンライン反映には `npm run online:deploy` が必要（対戦中の部屋がないときに）。

## 次にやること

PRのレビュー後、Edge Function の再デプロイとアプリ配布。

## 次回最初に見るべきファイル

`src/game/engine.ts`、`tests/mine-multiplicity.test.ts`

## 引き継ぎ事項

複数正解（signature グループ）の場合も primary answer の回数を使う。signature が同じなので各正解の文字の回数は一致する。
